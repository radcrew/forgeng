import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { Matches, ValidateIf } from 'class-validator';

/**
 * A Slack channel ID: "C" for a public channel, "G" for an older private
 * one, then capital letters and digits. Not the channel name, which can
 * change.
 */
export const SLACK_CHANNEL_ID_RE = /^[CG][A-Z0-9]{6,20}$/;

/**
 * The cohort's Slack channel. Left out keeps it, and null or a blank value
 * removes it.
 */
export const SlackChannelId = () =>
  applyDecorators(
    Transform(({ value }: { value: unknown }) =>
      typeof value === 'string' ? value.trim() || null : value,
    ),
    ValidateIf(
      (o: { slackChannelId?: unknown }) =>
        o.slackChannelId !== undefined && o.slackChannelId !== null,
    ),
    Matches(SLACK_CHANNEL_ID_RE, {
      message:
        'Use the Slack channel ID, for example C0123ABCD. Find it at the bottom of the channel details in Slack.',
    }),
  );
