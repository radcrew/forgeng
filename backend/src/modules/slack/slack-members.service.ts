import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';

import { ADMIN_ROUTES, STUDENT_ROUTES } from '../../common/constants/routes';
import type { AppConfiguration } from '../../config';
import { PrismaService } from '../../core/database/prisma.service';
import {
  SlackChannelsService,
  SlackService,
  type SlackMember,
} from '../../core/slack';

/**
 * Keeps Slack in step with Forgeng for people who join the workspace: links
 * their Slack account to their Forgeng account by email, adds students to
 * their cohort channels and admins to every cohort channel, and welcomes
 * them.
 */
@Injectable()
export class SlackMembersService {
  private readonly logger = new Logger(SlackMembersService.name);
  private readonly frontendUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly slack: SlackService,
    private readonly channels: SlackChannelsService,
    config: ConfigService<AppConfiguration, true>,
  ) {
    this.frontendUrl = config.get('frontendUrl', { infer: true });
  }

  /**
   * Handles Slack's team_join event, and members found by `linkExisting`.
   * True when the member was linked now.
   */
  async handleTeamJoin(member: SlackMember): Promise<boolean> {
    if (!member.id || member.is_bot || member.deleted) return false;
    const email = member.profile?.email?.trim().toLowerCase();
    if (!email) {
      this.logger.warn(
        `Slack member ${member.id} joined without an email. Is the users:read.email scope added?`,
      );
      return false;
    }

    // Someone with no Forgeng account, such as a guest, is left alone.
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true, name: true, slackUserId: true },
    });
    if (!user) return false;
    // Only accepted people get the invite link, but anyone can share it.
    if (user.role !== 'student' && user.role !== 'admin') return false;

    // Slack can send the same event twice. A repeat changes nothing, and
    // sends no second welcome.
    const alreadyLinked = user.slackUserId === member.id;
    if (!alreadyLinked && !(await this.link(user.id, member.id))) return false;

    if (user.role === 'student') {
      await this.addToCohortChannels(user.id, member.id);
    } else {
      // Cohort channels are private, so an admin must be in each one to
      // see it.
      await this.channels.addAdminToAllChannels(member.id);
    }
    if (!alreadyLinked) this.welcome(member.id, user.name, user.role);
    return !alreadyLinked;
  }

  /**
   * Links people who were in the workspace before they had a Forgeng
   * account linked, for example members who joined before the app was set
   * up. Slack sent no team_join for them. Returns how many were linked.
   */
  async linkExisting(): Promise<number> {
    if (!this.slack.enabled) return 0;

    const unlinked = await this.prisma.user.findMany({
      where: { slackUserId: null, role: { in: ['student', 'admin'] } },
      select: { email: true },
    });
    // Nothing to do, so no need to ask Slack.
    if (unlinked.length === 0) return 0;
    const emails = new Set(unlinked.map((u) => u.email.toLowerCase()));

    let linked = 0;
    for (const member of await this.slack.listWorkspaceMembers()) {
      const email = member.profile?.email?.trim().toLowerCase();
      if (!email || !emails.has(email)) continue;
      try {
        if (await this.handleTeamJoin(member)) linked++;
      } catch (err) {
        // One failed member must not stop the others.
        this.logger.error(
          `Failed to link Slack member ${member.id}`,
          err instanceof Error ? err.stack : String(err),
        );
      }
    }
    return linked;
  }

  /** Saves the Slack account on the user. False when it can't be linked. */
  private async link(userId: number, slackUserId: string): Promise<boolean> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { slackUserId },
      });
      return true;
    } catch (err) {
      // The Slack account already belongs to another Forgeng user.
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        this.logger.warn(
          `Slack member ${slackUserId} is already linked to another user, so user ${userId} was not linked`,
        );
        return false;
      }
      throw err;
    }
  }

  /** Adds a student to the Slack channels of every cohort they are in. */
  private async addToCohortChannels(
    userId: number,
    slackUserId: string,
  ): Promise<void> {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId, cohort: { slackChannelId: { not: null } } },
      select: { cohort: { select: { slackChannelId: true } } },
    });
    for (const { cohort } of enrollments) {
      const channelId = cohort.slackChannelId;
      if (!channelId) continue;
      try {
        await this.slack.inviteToChannel(channelId, slackUserId);
      } catch (err) {
        // One failed channel must not stop the others.
        this.logger.error(
          `Failed to add user ${userId} to Slack channel ${channelId}`,
          err instanceof Error ? err.stack : String(err),
        );
      }
    }
  }

  private welcome(
    slackUserId: string,
    name: string | null,
    role: string,
  ): void {
    const greeting = name
      ? `Welcome to the Forgeng Slack, ${name}!`
      : 'Welcome to the Forgeng Slack!';
    this.slack.postInBackground(slackUserId, {
      text:
        role === 'student'
          ? `${greeting} You are now in your cohort's channel. Ask your questions there, and mentors and other students will help.`
          : `${greeting} Mentors' alerts go to the mentors channel.`,
      link: {
        label: 'Open Forgeng',
        url: `${this.frontendUrl}${role === 'student' ? STUDENT_ROUTES.DASHBOARD : ADMIN_ROUTES.DASHBOARD}`,
      },
    });
  }
}
