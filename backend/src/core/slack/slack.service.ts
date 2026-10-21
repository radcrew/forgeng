import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { waitUntil } from '@vercel/functions';

import type { AppConfiguration } from '../../config';

const API_URL = 'https://slack.com/api';
const MEMBERS_PER_PAGE = 200;
const MAX_MEMBER_PAGES = 50;

/** The part every Slack Web API answer has. */
interface SlackAnswer {
  ok?: boolean;
  error?: string;
}
const SLACK_TIMEOUT_MS = 10_000;

/**
 * Slack's methods that only read data don't accept a JSON body, so their
 * arguments are sent as a form.
 */
const READ_METHODS = new Set([
  'conversations.members',
  'users.list',
  'users.lookupByEmail',
]);

/** A workspace member, as Slack's users.list and team_join send it. */
export interface SlackMember {
  id?: string;
  is_bot?: boolean;
  deleted?: boolean;
  /** The email needs the users:read.email scope. */
  profile?: { email?: string };
}

export interface SlackMessage {
  /** Plain text. It is escaped, so names and titles can't add Slack codes. */
  text: string;
  /** A button that opens a page in Forgeng. */
  link?: { label: string; url: string };
  /**
   * A button that Slack sends back to Forgeng's interactions route when it is
   * clicked, with this action ID and value.
   */
  action?: { label: string; actionId: string; value: string };
}

/** The action IDs of Forgeng's Slack buttons and forms. */
export const SLACK_ACTIONS = {
  /**
   * The Approve button under a new submission. Its value is a
   * `submissionKey`.
   */
  APPROVE_SUBMISSION: 'approve_submission',
} as const;

/**
 * Names one sending of a submission: its id and when the student sent it.
 * A resubmit keeps the id but changes the time, so a button from an older
 * Slack message can be told apart from the newest one.
 */
export function submissionKey(id: number, sentAt: Date): string {
  return `${id}@${sentAt.getTime()}`;
}

/** Reads a `submissionKey`. Null when it isn't one. */
export function parseSubmissionKey(
  key: string,
): { id: number; sentAt: number } | null {
  const match = /^(\d+)@(\d+)$/.exec(key);
  return match ? { id: Number(match[1]), sentAt: Number(match[2]) } : null;
}

/** Slack's longest channel name. */
const CHANNEL_NAME_MAX = 80;

/**
 * Turns text, such as a cohort name, into a Slack channel name: lower case,
 * with only letters, digits, "-" and "_", and at most 80 characters. For
 * example "Golang Autumn 2026" becomes "golang-autumn-2026". Empty when
 * nothing usable is left.
 */
export function toSlackChannelName(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^[-_]+|[-_]+$/g, '')
    .slice(0, CHANNEL_NAME_MAX)
    .replace(/[-_]+$/, '');
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

/** Slack refuses a section block whose text is longer than this. */
const SECTION_MAX = 3000;

/**
 * Escapes text for Slack and splits it into parts that each fit in one
 * section block, so a long message, such as returned feedback, isn't
 * refused. It never cuts an escaped character in half.
 */
export function toSlackSections(text: string): string[] {
  const sections: string[] = [];
  let current = '';
  for (const ch of text) {
    const escaped = escapeSlackText(ch);
    if (current.length + escaped.length > SECTION_MAX) {
      sections.push(current);
      current = '';
    }
    current += escaped;
  }
  sections.push(current);
  return sections;
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

  /** True when the bot token is set, so Slack calls can be made. */
  get enabled(): boolean {
    return this.botToken !== null;
  }

  /**
   * Creates a private channel and returns its ID. The bot that creates it is
   * a member, so it can post there. Tries each name in order and skips names
   * that are taken. Throws when Slack refuses, or when every name is taken.
   */
  async createPrivateChannel(names: string[]): Promise<string> {
    for (const name of names) {
      const answer = await this.call<{ channel?: { id?: string } }>(
        'conversations.create',
        { name, is_private: true },
        ['name_taken'],
      );
      if (answer.channel?.id) return answer.channel.id;
    }
    throw new Error(
      `Slack refused conversations.create: every name was taken (${names.join(', ')})`,
    );
  }

  /**
   * The Slack account with this email, or null when nobody in the workspace
   * uses it. Needs the users:read.email scope.
   */
  async findUserIdByEmail(email: string): Promise<string | null> {
    const answer = await this.call<{ user?: { id?: string } }>(
      'users.lookupByEmail',
      { email },
      ['users_not_found'],
    );
    return answer.user?.id ?? null;
  }

  /**
   * Adds a member to a channel. Someone already in it counts as done.
   * Throws when Slack refuses, so the caller can log which user failed.
   */
  async inviteToChannel(channelId: string, slackUserId: string): Promise<void> {
    await this.call(
      'conversations.invite',
      { channel: channelId, users: slackUserId },
      ['already_in_channel'],
    );
  }

  /**
   * Removes a member from a channel. Someone not in it counts as done.
   * They stay in the workspace: the app can't remove people from it.
   */
  async removeFromChannel(
    channelId: string,
    slackUserId: string,
  ): Promise<void> {
    await this.call(
      'conversations.kick',
      { channel: channelId, user: slackUserId },
      ['not_in_channel'],
    );
  }

  /**
   * Opens a Slack form (a "modal") for the person who clicked a button.
   * Slack's trigger id is only valid for 3 seconds after the click, so call
   * this before answering Slack, not in the background.
   */
  async openView(triggerId: string, view: object): Promise<void> {
    await this.call('views.open', { trigger_id: triggerId, view });
  }

  /** Every member of a channel, following Slack's pages. */
  async listChannelMembers(channelId: string): Promise<string[]> {
    const members: string[] = [];
    let cursor = '';
    for (let page = 0; page < MAX_MEMBER_PAGES; page++) {
      const answer = await this.call<{
        members?: string[];
        response_metadata?: { next_cursor?: string };
      }>('conversations.members', {
        channel: channelId,
        limit: MEMBERS_PER_PAGE,
        ...(cursor ? { cursor } : {}),
      });
      members.push(...(answer.members ?? []));
      cursor = answer.response_metadata?.next_cursor ?? '';
      if (!cursor) return members;
    }
    // A cut-off list could make the nightly check remove real members.
    throw new Error(`Slack channel ${channelId} has too many members to read`);
  }

  /**
   * Every member of the workspace, following Slack's pages. Bots and
   * deactivated accounts are included, so callers filter them.
   */
  async listWorkspaceMembers(): Promise<SlackMember[]> {
    const members: SlackMember[] = [];
    let cursor = '';
    for (let page = 0; page < MAX_MEMBER_PAGES; page++) {
      const answer = await this.call<{
        members?: SlackMember[];
        response_metadata?: { next_cursor?: string };
      }>('users.list', {
        limit: MEMBERS_PER_PAGE,
        ...(cursor ? { cursor } : {}),
      });
      members.push(...(answer.members ?? []));
      cursor = answer.response_metadata?.next_cursor ?? '';
      if (!cursor) return members;
    }
    throw new Error('The Slack workspace has too many members to read');
  }

  private async post(
    botToken: string,
    channelId: string,
    message: SlackMessage,
  ): Promise<void> {
    const text = escapeSlackText(message.text);
    const buttons = [
      ...(message.link
        ? [
            {
              type: 'button',
              text: { type: 'plain_text', text: message.link.label },
              url: message.link.url,
            },
          ]
        : []),
      ...(message.action
        ? [
            {
              type: 'button',
              style: 'primary',
              text: { type: 'plain_text', text: message.action.label },
              action_id: message.action.actionId,
              value: message.action.value,
            },
          ]
        : []),
    ];
    await this.call(
      'chat.postMessage',
      {
        channel: channelId,
        // Shown in notifications, and where blocks can't be shown.
        text,
        blocks: [
          ...toSlackSections(message.text).map((part) => ({
            type: 'section',
            text: { type: 'mrkdwn', text: part },
          })),
          ...(buttons.length > 0
            ? [{ type: 'actions', elements: buttons }]
            : []),
        ],
        unfurl_links: false,
      },
      [],
      botToken,
    );
  }

  /**
   * Calls one Slack Web API method. Slack answers 200 even for most errors,
   * with ok: false and an error code. Codes in `okErrors` count as done.
   */
  private async call<T extends object = object>(
    method: string,
    payload: Record<string, unknown>,
    okErrors: string[] = [],
    botToken = this.botToken,
  ): Promise<T & SlackAnswer> {
    if (!botToken) throw new Error('Slack is not set up on this server.');
    const asForm = READ_METHODS.has(method);
    const res = await fetch(`${API_URL}/${method}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${botToken}`,
        'Content-Type': asForm
          ? 'application/x-www-form-urlencoded'
          : 'application/json; charset=utf-8',
      },
      body: asForm
        ? new URLSearchParams(
            Object.entries(payload).map(([key, value]) => [key, String(value)]),
          ).toString()
        : JSON.stringify(payload),
      signal: AbortSignal.timeout(SLACK_TIMEOUT_MS),
    });
    const body = (await res.json().catch(() => ({}))) as T & SlackAnswer;
    if (res.ok && (body.ok || okErrors.includes(body.error ?? ''))) {
      return body;
    }
    // For example "not_in_channel": invite the bot to the channel.
    throw new Error(
      `Slack refused ${method}: ${body.error ?? `HTTP ${res.status}`}`,
    );
  }
}
