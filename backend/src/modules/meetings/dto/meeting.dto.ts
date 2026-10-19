import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

// A blank note is saved as no note.
const trimToNull = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() || null : value;

export class ScheduleMeetingDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  attendeeId!: number;

  @Transform(trim)
  @IsString()
  @MinLength(1, { message: 'Enter a title.' })
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  @MaxLength(2000)
  note?: string | null;

  /** An ISO time with its time zone, for example 2026-11-02T15:00:00Z. */
  @Type(() => Date)
  @IsDate()
  startsAt!: Date;

  @Type(() => Number)
  @IsInt()
  @Min(15)
  @Max(240)
  durationMinutes!: number;
}

/** Every field is optional: what is left out stays as it is. */
export class RescheduleMeetingDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1, { message: 'Enter a title.' })
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  @MaxLength(2000)
  note?: string | null;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startsAt?: Date;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(15)
  @Max(240)
  durationMinutes?: number;
}

export class ListMeetingsQuery {
  /** Admins only: the meetings with one student, from every mentor. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  attendeeId?: number;
}
