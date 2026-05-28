import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, type Profile } from 'passport-github2';

import type { AppConfiguration } from '@config';
import type { OAuthProfileDto } from './google.strategy';

const PLACEHOLDER = {
  clientID: 'noop',
  clientSecret: 'noop',
  callbackURL: 'http://localhost/auth/github/callback',
} as const;

type VerifyDone = (error: Error | null, user?: OAuthProfileDto) => void;

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  private readonly enabled: boolean;

  constructor(config: ConfigService<AppConfiguration, true>) {
    const github = config.get('auth.github', { infer: true });
    super({
      clientID: github?.clientId ?? PLACEHOLDER.clientID,
      clientSecret: github?.clientSecret ?? PLACEHOLDER.clientSecret,
      callbackURL: github?.callbackUrl ?? PLACEHOLDER.callbackURL,
      scope: ['user:email'],
    });
    this.enabled = github !== null;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyDone,
  ): void {
    const primaryEmail =
      profile.emails?.find((e) => (e as { primary?: boolean }).primary)
        ?.value ??
      profile.emails?.[0]?.value ??
      null;
    const dto: OAuthProfileDto = {
      provider: 'github',
      providerAccountId: profile.id,
      email: primaryEmail,
      name: profile.displayName ?? profile.username ?? null,
      avatarUrl: profile.photos?.[0]?.value ?? null,
      // GitHub does not expose verified flag in profile; we trust primary email.
      emailVerified: primaryEmail !== null,
    };
    done(null, dto);
  }
}
