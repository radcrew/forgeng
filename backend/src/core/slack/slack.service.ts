import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { waitUntil } from '@vercel/functions';

import type { AppConfiguration } from '../../config';

const POST_MESSAGE_URL = 'https://slack.com/api/chat.postMessage';
const SLACK_TIMEOUT_MS = 10_000;

export interface SlackMessage {
  /** Plain text. It is escaped, so names and titles can't add Slack codes. */
  text: string;
  /** A button that opens a page in Forgeng. */
  link?: { label: string; url: string };
}

/**
 * Escapes the three characters Slack reads as codes. Without this, a name
 * like "<!channel>" would notify everyone in the channel.
 */
export function escapeSlackText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Posts app events to the Forgeng Slack workspace. Posts go out after the
 * response, like emails: a slow or failed Slack never holds up or fails a
 * save. The same information is always in the app too, so a lost post is
 * only logged.
 */
@Injectable()
export class SlackService {
  private readonly logger = new Logger(SlackService.name);
  private readonly botToken: string | null;
  private readonly mentorsChannelId: string | null;

  constructor(config: ConfigService<AppConfiguration, true>) {
    const slack = config.get('slack', { infer: true });
    this.botToken = slack?.botToken ?? null;
    this.mentorsChannelId = slack?.mentorsChannelId ?? null;
  }

  /** Posts to a channel, if Slack is set up and a channel is given. */
  postInBackground(channelId: string | null, message: SlackMessage): void {
    if (!this.botToken || !channelId) return;
    waitUntil(
      this.post(this.botToken, channelId, message).catch((err: unknown) => {
        this.logger.error(
          `Failed to post to Slack channel ${channelId}`,
          err instanceof Error ? err.stack : String(err),
        );
      }),
    );
  }

  /** Posts to the private mentors' channel, if one is set. */
  postToMentors(message: SlackMessage): void {
    this.postInBackground(this.mentorsChannelId, message);
  }

  private async post(
    botToken: string,
    channelId: string,
    message: SlackMessage,
  ): Promise<void> {
    const text = escapeSlackText(message.text);
    const res = await fetch(POST_MESSAGE_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${botToken}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        channel: channelId,
        // Shown in notifications, and where blocks can't be shown.
        text,
        blocks: [
          { type: 'section', text: { type: 'mrkdwn', text } },
          ...(message.link
            ? [
                {
                  type: 'actions',
                  elements: [
                    {
                      type: 'button',
                      text: { type: 'plain_text', text: message.link.label },
                      url: message.link.url,
                    },
                  ],
                },
              ]
            : []),
        ],
        unfurl_links: false,
      }),
      signal: AbortSignal.timeout(SLACK_TIMEOUT_MS),
    });
    // Slack answers 200 even for most errors, with ok: false.
    const body = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
    };
    if (!res.ok || !body.ok) {
      // For example "not_in_channel": invite the bot to the channel.
      throw new Error(
        `Slack refused the post: ${body.error ?? `HTTP ${res.status}`}`,
      );
    }
  }
}
