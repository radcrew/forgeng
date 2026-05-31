/** Shape returned by `configuration()` — keys match top-level `ConfigService` paths. */
export interface AppConfiguration {
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
  corsOrigin: string[];
  database: {
    url: string;
  };
  auth: {
    accessSecret: string;
    accessTtl: string;
    refreshSecret: string;
    refreshTtl: string;
    refreshCookieName: string;
    refreshCookieDomain: string | undefined;
    verifyTokenTtlMinutes: number;
    passwordResetTtlMinutes: number;
    oauthSuccessRedirect: string;
    oauthFailureRedirect: string;
    emailVerifyRedirect: string;
    passwordResetRedirect: string;
    google: OAuthProviderConfig | null;
    github: OAuthProviderConfig | null;
  };
  smtp: SmtpConfig | null;
  emailFrom: string;
}

export interface OAuthProviderConfig {
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
}

export interface SmtpConfig {
  host: string;
  port: number;
  user: string | undefined;
  pass: string | undefined;
  secure: boolean;
}
