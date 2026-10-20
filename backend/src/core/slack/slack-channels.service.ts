import { Injectable, Logger } from '@nestjs/common';
import { waitUntil } from '@vercel/functions';

import { PrismaService } from '../database/prisma.service';
import { SlackService } from './slack.service';

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
   * It only removes linked Forgeng students who aren't in the cohort. It
   * never removes admins, the bot, or anyone Forgeng doesn't know, since
   * they may be in the channel on purpose.
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
    // The only people the check may remove from a cohort channel.
    const linkedStudents = new Set(
      (
        await this.prisma.user.findMany({
          where: { role: 'student', slackUserId: { not: null } },
          select: { slackUserId: true },
        })
      ).map((u) => u.slackUserId),
    );

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
      for (const slackUserId of enrolled) {
        if (!slackUserId || members.has(slackUserId)) continue;
        const ok = await this.tryCall(
          () => this.slack.inviteToChannel(channelId, slackUserId),
          `add Slack member ${slackUserId} to channel ${channelId}`,
        );
        if (ok) result.added++;
      }
      for (const slackUserId of members) {
        if (!linkedStudents.has(slackUserId) || enrolled.has(slackUserId)) {
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

  private async sync(userId: number, cohortIds: number[]): Promise<void> {
    // Someone who hasn't joined Slack yet is added when they join.
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { slackUserId: true },
    });
    const slackUserId = user?.slackUserId;
    if (!slackUserId) return;

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
      const enrolled = cohort.enrollments.length > 0;
      try {
        if (enrolled) await this.slack.inviteToChannel(channelId, slackUserId);
        else await this.slack.removeFromChannel(channelId, slackUserId);
      } catch (err) {
        // One failed channel must not stop the others.
        this.logger.error(
          `Failed to ${enrolled ? 'add' : 'remove'} user ${userId} in Slack channel ${channelId}`,
          err instanceof Error ? err.stack : String(err),
        );
      }
    }
  }
}
