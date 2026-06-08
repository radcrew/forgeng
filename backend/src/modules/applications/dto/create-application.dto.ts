import {
  ArrayMaxSize,
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

// A LinkedIn member profile (linkedin.com/in/<slug>), optionally on a country
// subdomain. A GitHub user profile (github.com/<username>) follows GitHub's
// username rules: 1–39 chars, alphanumeric or single non-leading/trailing
// hyphens. Both reject non-profile URLs that merely live on the right host.
const LINKEDIN_PROFILE_REGEX =
  /^https?:\/\/([a-z]{2,3}\.)?linkedin\.com\/in\/[\w%-]+\/?(\?.*)?$/i;
const GITHUB_PROFILE_REGEX =
  /^https?:\/\/(www\.)?github\.com\/[A-Za-z0-9](?:-?[A-Za-z0-9]){0,38}\/?(\?.*)?$/i;

// X / Twitter profile (handle: 1–15 chars), Facebook profile (username or the
// numeric profile.php?id= form), and a Telegram t.me link or @username
// (5–32 chars, starts with a letter). Each rejects non-profile URLs on-host.
const TWITTER_PROFILE_REGEX =
  /^https?:\/\/(www\.)?(twitter|x)\.com\/[A-Za-z0-9_]{1,15}\/?(\?.*)?$/i;
const FACEBOOK_PROFILE_REGEX =
  /^https?:\/\/(www\.|m\.)?(facebook|fb)\.com\/(profile\.php\?id=\d+|[A-Za-z0-9.]{3,})\/?$/i;
const TELEGRAM_REGEX =
  /^(https?:\/\/t\.me\/[A-Za-z][A-Za-z0-9_]{4,31}\/?|@[A-Za-z][A-Za-z0-9_]{4,31})$/;

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
  @Matches(LINKEDIN_PROFILE_REGEX, {
    message:
      'Enter your LinkedIn profile URL (e.g. https://linkedin.com/in/you)',
  })
  linkedin!: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  @Matches(TWITTER_PROFILE_REGEX, {
    message: 'Enter your X/Twitter profile URL (e.g. https://x.com/you)',
  })
  twitter?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  @Matches(FACEBOOK_PROFILE_REGEX, {
    message: 'Enter your Facebook profile URL (e.g. https://facebook.com/you)',
  })
  facebook?: string;

  @IsUrl()
  @MaxLength(500)
  @Matches(GITHUB_PROFILE_REGEX, {
    message: 'Enter your GitHub profile URL (e.g. https://github.com/you)',
  })
  github!: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  portfolio?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  videoUrl!: string;

  // Optional, and at most one withdrawal address per applicant.
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(1, { message: 'Only one withdrawal address is allowed' })
  @ValidateNested({ each: true })
  @Type(() => WalletEntryDto)
  wallets?: WalletEntryDto[];

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Matches(TELEGRAM_REGEX, {
    message: 'Enter a t.me URL (https://t.me/you) or a @username',
  })
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
