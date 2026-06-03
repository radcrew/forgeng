import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateNotificationPreferencesDto {
  @IsOptional()
  @IsBoolean()
  feedbackInApp?: boolean;

  @IsOptional()
  @IsBoolean()
  feedbackEmail?: boolean;

  @IsOptional()
  @IsBoolean()
  taskInApp?: boolean;

  @IsOptional()
  @IsBoolean()
  taskEmail?: boolean;
}
