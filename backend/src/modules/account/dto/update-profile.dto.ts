import {
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  linkedin?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  twitter?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  facebook?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  github?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  portfolio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  telegram?: string;

  @IsOptional()
  @Matches(/^\+[1-9]\d{6,14}$/, {
    message: 'Enter a phone number with country code (e.g. +1234567890)',
  })
  whatsapp?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(2000)
  avatarUrl?: string;
}
