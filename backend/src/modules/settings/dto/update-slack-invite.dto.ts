import { Transform } from 'class-transformer';
import { IsString, Matches, MaxLength, ValidateIf } from 'class-validator';

/**
 * Slack workspace invite links. Anything else is refused, so the link on the
 * student dashboard can't send students to another site.
 */
export const SLACK_INVITE_RE = /^https:\/\/join\.slack\.com\/\S+$/;

export class UpdateSlackInviteDto {
  // A blank link clears it, the same as null.
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() || null : value,
  )
  @ValidateIf((o: { slackInviteUrl?: unknown }) => o.slackInviteUrl !== null)
  @IsString()
  @MaxLength(500)
  @Matches(SLACK_INVITE_RE, {
    message: 'Use a Slack invite link. It starts with https://join.slack.com/.',
  })
  slackInviteUrl!: string | null;
}
