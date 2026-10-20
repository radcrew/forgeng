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
