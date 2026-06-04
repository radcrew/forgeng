import {
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Identity (name + email) is taken from the authenticated user, not the
 * request body — an applicant cannot apply on behalf of someone else.
 */
export class CreateApplicationDto {
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  motivation!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  background!: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  experience?: string;

  @IsUrl()
  @MaxLength(500)
  linkedin!: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  twitter?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  facebook?: string;

  @IsUrl()
  @MaxLength(500)
  github!: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  portfolio?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  videoUrl!: string;

  @IsOptional()
  @Matches(/^0x[0-9a-fA-F]{40}$/, { message: 'Invalid EVM address' })
  walletEvm?: string;

  @IsOptional()
  @Matches(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, { message: 'Invalid Solana address' })
  walletSolana?: string;

  @IsOptional()
  @Matches(/^T[1-9A-HJ-NP-Za-km-z]{33}$/, { message: 'Invalid Tron address' })
  walletTron?: string;
}
