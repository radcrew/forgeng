import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { waitUntil } from '@vercel/functions';

import { PrismaService } from '../database/prisma.service';
import { SlackService, toSlackChannelName } from './slack.service';

/** Slack's longest channel name. */
const CHANNEL_NAME_MAX = 80;

/**
 * Keeps a user's cohort channel memberships in step with their enrollments.
 * Called after an enrollment changes: the user is added to the channel of
 * each cohort they are now in, and removed from the others.
 */
@Injectable()
export class SlackChannelsService {
  private readonly logger = new Logger(SlackChannelsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly slack: SlackService,
  ) {}

  /**
   * Syncs the channels of these cohorts after the response, like emails, so
   * a slow or failed Slack never holds up or fails the enrollment change.
   * Empty ids are skipped, so callers can pass an old and a new cohort.
   */
  syncInBackground(
    userId: number,
    cohortIds: Array<number | null | undefined>,
  ): void {
    const ids = [...new Set(cohortIds)].filter(
      (id): id is number => typeof id === 'number',
    );
    if (!this.slack.enabled || ids.length === 0) return;
    waitUntil(
      this.sync(userId, ids).catch((err: unknown) => {
        this.logger.error(
          `Failed to sync the Slack channels of user ${userId}`,
          err instanceof Error ? err.stack : String(err),
        );
      }),
    );
  }

  /**
   * Creates the cohort's channel after the response, and saves it on the
   * cohort. So a slow Slack never holds up creating a cohort.
   */
  createForCohortInBackground(
    cohort: { id: number; name: string },
    adminUserId: number,
  ): void {
    if (!this.slack.enabled) return;
    waitUntil(
      this.createAndSave(cohort, adminUserId).catch((err: unknown) => {
        this.logger.error(
          `Failed to save the Slack channel of cohort ${cohort.id}`,
          err instanceof Error ? err.stack : String(err),
        );
      }),
    );
  }

  private async createAndSave(
    cohort: { id: number; name: string },
    adminUserId: number,
  ): Promise<void> {
    const channelId = await this.createForCohort(cohort, adminUserId);
    if (!channelId) return;
    // Only when the cohort still has no channel. In the meantime, an admin
    // may have set one by hand, or deleted the cohort.
    const { count } = await this.prisma.cohort.updateMany({
      where: { id: cohort.id, slackChannelId: null },
      data: { slackChannelId: channelId },
    });
    if (count === 0) {
      this.logger.warn(
        `Slack channel ${channelId} was made for cohort ${cohort.id}, but the cohort changed first, so it was not saved`,
      );
    }
  }

  /**
   * Creates a private channel for a new cohort, named after it, and invites
   * the admins. Without that they could not see the private channel.
   * Returns the channel ID, or null
   * when Slack is not set up or refused. Never throws: a cohort is created
   * with or without its channel.
   */
  async createForCohort(
    cohort: { id: number; name: string },
    adminUserId: number,
  ): Promise<string | null> {
    if (!this.slack.enabled) return null;

    // "golang", then "golang-7" if that is taken. A name with nothing
    // usable, such as one in another alphabet, becomes "cohort-7".
    const suffix = `-${cohort.id}`;
    const base = toSlackChannelName(cohort.name);
    const names = base
      ? [
          base,
          base
            .slice(0, CHANNEL_NAME_MAX - suffix.length)
            .replace(/[-_]+$/, '') + suffix,
        ]
      : [`cohort${suffix}`];

    let channelId: string;
    try {
      channelId = await this.slack.createPrivateChannel(names);
    } catch (err) {
      this.logger.error(
        `Failed to create a Slack channel for cohort ${cohort.id}`,
        err instanceof Error ? err.stack : String(err),
      );
      return null;
    }

    for (const slackUserId of await this.adminsToInvite(adminUserId)) {
      await this.tryCall(
        () => this.slack.inviteToChannel(channelId, slackUserId),
        `add Slack member ${slackUserId} to channel ${channelId}`,
      );
    }
    return channelId;
  }

  /**
   * Every linked admin, so mentors can see every cohort channel. The admin
   * who created the cohort is linked by email first if they aren't yet, for
   * example when they were in Slack before the app was set up. Never throws.
   */
  private async adminsToInvite(creatorId: number): Promise<string[]> {
    try {
      const admins = await this.prisma.user.findMany({
        where: { role: 'admin' },
        select: { id: true, email: true, slackUserId: true },
      });
      const creator = admins.find((a) => a.id === creatorId);
      if (creator && !creator.slackUserId) {
        creator.slackUserId = await this.linkByEmail(creator);
      }
      return admins
        .map((a) => a.slackUserId)
        .filter((id): id is string => id !== null);
    } catch (err) {
      this.logger.error(
        'Failed to find the admins to add to a new Slack channel',
        err instanceof Error ? err.stack : String(err),
      );
      return [];
    }
  }

  /** Finds the user's Slack account by email and saves it. Null if none. */
  private async linkByEmail(user: {
    id: number;
    email: string;
  }): Promise<string | null> {
    const slackUserId = await this.slack.findUserIdByEmail(user.email);
    if (!slackUserId) return null;
    try {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { slackUserId },
      });
    } catch (err) {
      // The Slack account already belongs to another Forgeng user.
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        return null;
      }
      throw err;
    }
    return slackUserId;
  }

  /**
   * The Slack accounts of a cohort's linked students. Read it before the
   * cohort changes channel or is deleted, then pass it to
   * `moveInBackground`. Empty when Slack is not set up.
   */
  async linkedStudents(cohortId: number): Promise<string[]> {
    if (!this.slack.enabled) return [];
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        cohortId,
        user: { role: 'student', slackUserId: { not: null } },
      },
      select: { user: { select: { slackUserId: true } } },
    });
    return enrollments
      .map((e) => e.user.slackUserId)
      .filter((id): id is string => id !== null);
  }

  /**
   * Moves students from a cohort's old channel to its new one, after the
   * response. A null old channel only adds them, and a null new channel
   * only removes them, for example when the cohort was deleted.
   */
  moveInBackground(
    slackUserIds: string[],
    fromChannelId: string | null,
    toChannelId: string | null,
  ): void {
    if (
      !this.slack.enabled ||
      slackUserIds.length === 0 ||
      fromChannelId === toChannelId
    ) {
      return;
    }
    waitUntil(this.move(slackUserIds, fromChannelId, toChannelId));
  }

  /** Never throws: each failed call is logged, and the others go on. */
  private async move(
    slackUserIds: string[],
    fromChannelId: string | null,
    toChannelId: string | null,
  ): Promise<void> {
    for (const slackUserId of slackUserIds) {
      if (fromChannelId) {
        await this.tryCall(
          () => this.slack.removeFromChannel(fromChannelId, slackUserId),
          `remove Slack member ${slackUserId} from channel ${fromChannelId}`,
        );
      }
      if (toChannelId) {
        await this.tryCall(
          () => this.slack.inviteToChannel(toChannelId, slackUserId),
          `add Slack member ${slackUserId} to channel ${toChannelId}`,
        );
      }
    }
  }

  /** Runs one Slack call and logs a failure. True when it worked. */
  private async tryCall(
    call: () => Promise<void>,
    what: string,
  ): Promise<boolean> {
    try {
      await call();
      return true;
    } catch (err) {
      this.logger.error(
        `Failed to ${what}`,
        err instanceof Error ? err.stack : String(err),
      );
      return false;
    }
  }

  /**
   * Compares every cohort channel with its enrollments and fixes the
   * differences, which catches a Slack call that failed. Called once a day.
   *
   * It only removes linked Forgeng users who aren't in the cohort, such as a
   * student who became an applicant again. It never removes admins, the
   * bot, or anyone Forgeng doesn't know, since they may be in the channel
   * on purpose.
   */
  async reconcileAll(): Promise<{
    channels: number;
    added: number;
    removed: number;
  }> {
    const result = { channels: 0, added: 0, removed: 0 };
    if (!this.slack.enabled) return result;

    const cohorts = await this.prisma.cohort.findMany({
      where: { slackChannelId: { not: null } },
      select: {
        id: true,
        slackChannelId: true,
        enrollments: {
          where: { user: { role: 'student', slackUserId: { not: null } } },
          select: { user: { select: { slackUserId: true } } },
        },
      },
    });
    // Every role, so someone who is no longer a student or an admin is
    // removed too. Their enrollments are gone, but they stay linked.
    const linked = await this.prisma.user.findMany({
      where: { slackUserId: { not: null } },
      select: { role: true, slackUserId: true },
    });
    // The only people the check may remove from a cohort channel.
    const removable = new Set(
      linked.filter((u) => u.role !== 'admin').map((u) => u.slackUserId),
    );
    // Cohort channels are private, so every admin must be in each one to
    // see it. Admins are added, and never removed.
    const linkedAdmins = linked
      .filter((u) => u.role === 'admin')
      .map((u) => u.slackUserId);

    for (const cohort of cohorts) {
      const channelId = cohort.slackChannelId;
      if (!channelId) continue;
      let members: Set<string>;
      try {
        members = new Set(await this.slack.listChannelMembers(channelId));
      } catch (err) {
        // Without the member list, nobody can be added or removed safely.
        // One failed channel must not stop the others.
        this.logger.error(
          `Failed to check Slack channel ${channelId} of cohort ${cohort.id}`,
          err instanceof Error ? err.stack : String(err),
        );
        continue;
      }

      // Each call on its own: one member Slack refuses, such as a
      // deactivated account, must not stop the rest of the channel.
      const enrolled = new Set(
        cohort.enrollments.map((e) => e.user.slackUserId),
      );
      for (const slackUserId of new Set([...enrolled, ...linkedAdmins])) {
        if (!slackUserId || members.has(slackUserId)) continue;
        const ok = await this.tryCall(
          () => this.slack.inviteToChannel(channelId, slackUserId),
          `add Slack member ${slackUserId} to channel ${channelId}`,
        );
        if (ok) result.added++;
      }
      for (const slackUserId of members) {
        if (!removable.has(slackUserId) || enrolled.has(slackUserId)) {
          continue;
        }
        const ok = await this.tryCall(
          () => this.slack.removeFromChannel(channelId, slackUserId),
          `remove Slack member ${slackUserId} from channel ${channelId}`,
        );
        if (ok) result.removed++;
      }
      result.channels++;
    }
    return result;
  }

  /**
   * Adds an admin to every cohort channel, when they are linked to Slack.
   * Cohort channels are private, so without this the admin could not see
   * them. Never throws: each failed channel is logged, and the others go on.
   */
  async addAdminToAllChannels(slackUserId: string): Promise<void> {
    if (!this.slack.enabled) return;
    const cohorts = await this.prisma.cohort
      .findMany({
        where: { slackChannelId: { not: null } },
        select: { slackChannelId: true },
      })
      .catch((err: unknown) => {
        this.logger.error(
          `Failed to find the cohort channels for admin ${slackUserId}`,
          err instanceof Error ? err.stack : String(err),
        );
        return [];
      });
    for (const { slackChannelId } of cohorts) {
      if (!slackChannelId) continue;
      await this.tryCall(
        () => this.slack.inviteToChannel(slackChannelId, slackUserId),
        `add Slack member ${slackUserId} to channel ${slackChannelId}`,
      );
    }
  }

  private async sync(userId: number, cohortIds: number[]): Promise<void> {
    // Someone who hasn't joined Slack yet is added when they join.
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { slackUserId: true, role: true },
    });
    const slackUserId = user?.slackUserId;
    if (!slackUserId) return;
    // Cohort channels are private, so an admin stays in every one, even
    // when they leave a cohort they were enrolled in.
    const isAdmin = user.role === 'admin';

    const cohorts = await this.prisma.cohort.findMany({
      where: { id: { in: cohortIds }, slackChannelId: { not: null } },
      select: {
        id: true,
        slackChannelId: true,
        enrollments: { where: { userId }, select: { id: true } },
      },
    });
    for (const cohort of cohorts) {
      const channelId = cohort.slackChannelId;
      if (!channelId) continue;
      const add = isAdmin || cohort.enrollments.length > 0;
      try {
        if (add) await this.slack.inviteToChannel(channelId, slackUserId);
        else await this.slack.removeFromChannel(channelId, slackUserId);
      } catch (err) {
        // One failed channel must not stop the others.
        this.logger.error(
          `Failed to ${add ? 'add' : 'remove'} user ${userId} in Slack channel ${channelId}`,
          err instanceof Error ? err.stack : String(err),
        );
      }
    }
  }
}
