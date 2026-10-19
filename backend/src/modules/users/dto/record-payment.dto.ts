import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class RecordPaymentDto {
  /** The stipend month, "YYYY-MM". Defaults to the month it is recorded. */
  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'forMonth must be a month like 2026-05',
  })
  forMonth?: string;

  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  currency!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  txLink?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
