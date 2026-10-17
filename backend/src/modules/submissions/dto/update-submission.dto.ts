import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

/**
 * Payload for resubmitting work against a task the reviewer marked `needs_work`.
 * Both fields are optional so a student can revise either the written content
 * or the repo link independently. Leaving a field out keeps it; null removes it.
 */
export class UpdateSubmissionDto {
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  content?: string | null;

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  repoUrl?: string | null;
}
