import { apiClient } from "@lib/api-client";

export interface SlackInvite {
  slackInviteUrl: string | null;
}

/** Students and admins only. */
export const getSlackInvite = (): Promise<SlackInvite> =>
  apiClient.get<SlackInvite>("/settings/slack-invite");

/** Admins only. `null` removes the link. */
export const updateSlackInvite = (
  slackInviteUrl: string | null,
): Promise<SlackInvite> =>
  apiClient.patch<SlackInvite>("/settings/slack-invite", { slackInviteUrl });
