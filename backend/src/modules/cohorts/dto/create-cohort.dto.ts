import { CohortStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import { SlackChannelId } from './slack-channel';

export class CreateCohortDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsInt()
  @Min(1)
  capacity!: number;

  @IsOptional()
  @IsEnum(CohortStatus)
  status?: CohortStatus;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @SlackChannelId()
  slackChannelId?: string | null;
}
