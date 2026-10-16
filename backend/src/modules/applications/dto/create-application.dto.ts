import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

import { APPLICATION_COUNTRY_CODES } from '../../../common/constants/countries';
import {
  IsWalletAddressForChain,
  SUPPORTED_CHAINS,
  type WalletChain,
} from '../../../common/utils/wallet';
import {
  FACEBOOK_PROFILE_REGEX,
  GITHUB_PROFILE_REGEX,
  LINKEDIN_PROFILE_REGEX,
  TELEGRAM_REGEX,
  TWITTER_PROFILE_REGEX,
} from '../../../common/constants/social-profiles';

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
  // No longer asked for by the apply wizard; kept optional so older clients
  // and existing rows still validate.
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  motivation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  background?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  experience?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  @Matches(LINKEDIN_PROFILE_REGEX, {
    message:
      'Enter your LinkedIn profile URL (e.g. https://linkedin.com/in/you)',
  })
  linkedin?: string;

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

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  @Matches(GITHUB_PROFILE_REGEX, {
    message: 'Enter your GitHub profile URL (e.g. https://github.com/you)',
  })
  github?: string;

  @IsOptional()
  // Leading/trailing whitespace (e.g. from a copy-paste) parses fine as a URL
  // but fails @IsUrl(), which doesn't tolerate it — trim before validating.
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
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

  @IsIn(APPLICATION_COUNTRY_CODES, { message: 'Select your country' })
  country!: string;
}
