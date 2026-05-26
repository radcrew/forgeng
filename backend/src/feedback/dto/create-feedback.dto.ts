import { Verdict } from '@prisma/client';
import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateFeedbackDto {
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  content!: string;

  @IsEnum(Verdict)
  verdict!: Verdict;
}
