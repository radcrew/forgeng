import {
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

import {
  FACEBOOK_PROFILE_REGEX,
  GITHUB_PROFILE_REGEX,
  LINKEDIN_PROFILE_REGEX,
  SOCIAL_PROFILE_MESSAGES,
  TELEGRAM_REGEX,
  TWITTER_PROFILE_REGEX,
  WHATSAPP_REGEX,
} from '@common/constants/social-profiles';

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
  @Matches(LINKEDIN_PROFILE_REGEX, {
    message: SOCIAL_PROFILE_MESSAGES.linkedin,
  })
  linkedin?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  @Matches(TWITTER_PROFILE_REGEX, { message: SOCIAL_PROFILE_MESSAGES.twitter })
  twitter?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  @Matches(FACEBOOK_PROFILE_REGEX, {
    message: SOCIAL_PROFILE_MESSAGES.facebook,
  })
  facebook?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  @Matches(GITHUB_PROFILE_REGEX, { message: SOCIAL_PROFILE_MESSAGES.github })
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

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Matches(TELEGRAM_REGEX, { message: SOCIAL_PROFILE_MESSAGES.telegram })
  telegram?: string;

  @IsOptional()
  @Matches(WHATSAPP_REGEX, { message: SOCIAL_PROFILE_MESSAGES.whatsapp })
  whatsapp?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(2000)
  avatarUrl?: string;
}
