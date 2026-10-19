import { Verdict } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateFeedbackDto {
  // Trimmed first, so feedback that is only spaces counts as empty.
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  content!: string;

  @IsEnum(Verdict)
  verdict!: Verdict;
}
