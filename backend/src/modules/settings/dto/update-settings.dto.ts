import { IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  stipendMonth1?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  stipendMonth2?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  stipendMonth3?: number;
}
