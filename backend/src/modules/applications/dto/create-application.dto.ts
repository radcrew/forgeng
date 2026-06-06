import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
  registerDecorator,
  ValidationArguments,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export const SUPPORTED_CHAINS = ['evm', 'solana', 'tron'] as const;
export type WalletChain = (typeof SUPPORTED_CHAINS)[number];

const EVM_ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/;
const SOLANA_ADDRESS_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const TRON_ADDRESS_REGEX = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;

const ADDRESS_PATTERNS: Record<WalletChain, RegExp> = {
  evm: EVM_ADDRESS_REGEX,
  solana: SOLANA_ADDRESS_REGEX,
  tron: TRON_ADDRESS_REGEX,
};

const ADDRESS_MESSAGES: Record<WalletChain, string> = {
  evm: 'Invalid EVM address (0x + 40 hex characters)',
  solana: 'Invalid Solana address',
  tron: 'Invalid Tron address (must start with T)',
};

function IsWalletAddressForChain() {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isWalletAddressForChain',
      target: (object as { constructor: new (...args: unknown[]) => unknown })
        .constructor,
      propertyName,
      validator: {
        validate(value: unknown, args: ValidationArguments): boolean {
          const chain = (args.object as WalletEntryDto).chain;
          return (
            typeof value === 'string' &&
            (ADDRESS_PATTERNS[chain]?.test(value) ?? false)
          );
        },
        defaultMessage(args: ValidationArguments): string {
          const chain = (args.object as WalletEntryDto).chain;
          return ADDRESS_MESSAGES[chain] ?? 'Invalid wallet address';
        },
      },
    });
  };
}

export class WalletEntryDto {
  @IsEnum(SUPPORTED_CHAINS)
  chain!: WalletChain;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @IsWalletAddressForChain()
  address!: string;
}

/**
 * Identity (name + email) is taken from the authenticated user, not the
 * request body — an applicant cannot apply on behalf of someone else.
 */
export class CreateApplicationDto {
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  motivation!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(1000)
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

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  address!: string;
}
