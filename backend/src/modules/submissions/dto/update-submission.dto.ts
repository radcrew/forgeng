import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

/**
 * Payload for resubmitting work against a task the reviewer marked `needs_work`.
 * Both fields are optional so a student can revise either the written content
 * or the repo link independently.
 */
export class UpdateSubmissionDto {
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  content?: string;

  @IsOptional()
  @IsUrl()
  repoUrl?: string;
}
