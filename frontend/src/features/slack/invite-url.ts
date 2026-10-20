/**
 * Slack workspace invite links, the same rule the server checks. Anything
 * else is refused, so the link can't send students to another site.
 */
export const SLACK_INVITE_RE = /^https:\/\/join\.slack\.com\/\S+$/;

export const SLACK_INVITE_MESSAGE =
  "Use a Slack invite link. It starts with https://join.slack.com/.";

export const isSlackInviteUrl = (value: string): boolean =>
  SLACK_INVITE_RE.test(value);
