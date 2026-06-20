/** Shape returned by `configuration()` — keys match top-level `ConfigService` paths. */
export interface AppConfiguration {
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
  corsOrigin: string[];
  /** Public base URL of the frontend, used to build absolute links in emails. */
  frontendUrl: string;
  /** Absolute directory where uploaded files (e.g. avatars) are written. */
  uploadsDir: string;
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
    accessCookieName: string;
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
  ipQualityScore: {
    apiKey: string | undefined;
  };
  /**
   * Number of trusted reverse-proxy hops in front of the server.
   * Set to 1 when behind a single nginx/load-balancer, 2 for two hops, etc.
   * 0 = no proxy (default, req.ip is the socket IP).
   */
  trustProxy: number;
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
