import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import {
  Strategy,
  type Profile,
  type VerifyCallback,
} from 'passport-google-oauth20';

import type { AppConfiguration } from '@config';

export interface OAuthProfileDto {
  provider: 'google' | 'github';
  providerAccountId: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
}

const PLACEHOLDER = {
  clientID: 'noop',
  clientSecret: 'noop',
  callbackURL: 'http://localhost/auth/google/callback',
} as const;

@Injectable()
export class GoogleStrategy
  extends PassportStrategy(Strategy, 'google')
  implements OnModuleInit
{
  private readonly enabled: boolean;

  constructor(config: ConfigService<AppConfiguration, true>) {
    const google = config.get('auth.google', { infer: true });
    super({
      clientID: google?.clientId ?? PLACEHOLDER.clientID,
      clientSecret: google?.clientSecret ?? PLACEHOLDER.clientSecret,
      callbackURL: google?.callbackUrl ?? PLACEHOLDER.callbackURL,
      scope: ['email', 'profile'],
    });
    this.enabled = google !== null;
  }

  onModuleInit(): void {
    if (!this.enabled) {
      // Strategy is registered with placeholder credentials so the module
      // boots in dev without Google OAuth env vars. The controller refuses
      // to call /auth/google when this flag is false.
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const email = profile.emails?.[0]?.value ?? null;
    const verified = profile.emails?.[0]?.verified !== false;
    const dto: OAuthProfileDto = {
      provider: 'google',
      providerAccountId: profile.id,
      email,
      name: profile.displayName ?? null,
      avatarUrl: profile.photos?.[0]?.value ?? null,
      emailVerified: verified,
    };
    done(null, dto);
  }
}
