import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export const SUPPORTED_CHAINS = ['evm', 'solana', 'tron'] as const;
export type WalletChain = (typeof SUPPORTED_CHAINS)[number];

const ADDRESS_PATTERNS: Record<WalletChain, RegExp> = {
  evm: /^0x[0-9a-fA-F]{40}$/,
  solana: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
  tron: /^T[1-9A-HJ-NP-Za-km-z]{33}$/,
};

export class WalletEntryDto {
  @IsEnum(SUPPORTED_CHAINS)
  chain!: WalletChain;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  address!: string;

  // Address format validated in the service after deserialization.
  isValidAddress(): boolean {
    return ADDRESS_PATTERNS[this.chain]?.test(this.address) ?? false;
  }
}

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
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WalletEntryDto)
  wallets?: WalletEntryDto[];

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
  @IsString()
  @MaxLength(500)
  address?: string;
}
