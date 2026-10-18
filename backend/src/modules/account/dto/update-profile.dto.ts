import {
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
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
} from '../../../common/constants/social-profiles';

export class UpdateProfileDto {
  // Leaving the name out keeps it, but a sent name can't be blank: the header
  // would show nothing, since "" doesn't fall back to "Unnamed". Not
  // @IsOptional, which also lets null through and clears the name.
  @ValidateIf((o: { name?: unknown }) => o.name !== undefined)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Enter your name.' })
  @MinLength(1, { message: 'Enter your name.' })
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

  // No avatarUrl here: a photo can only change through the upload route,
  // which checks the file. Setting a link here skipped those checks and
  // could point at any outside image.
}
