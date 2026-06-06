import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class RecordPaymentDto {
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  currency!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  txHash?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
