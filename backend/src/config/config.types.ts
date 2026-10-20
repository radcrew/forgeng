/** Shape returned by `configuration()` — keys match top-level `ConfigService` paths. */
export interface AppConfiguration {
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
  corsOrigin: string[];
  /** Public base URL of the frontend, used to build absolute links in emails. */
  frontendUrl: string;
  /** Absolute directory where uploaded files (e.g. avatars) are written. */
  uploadsDir: string;
  /** Supabase Storage for uploads; null falls back to `uploadsDir` on disk. */
  storage: { supabaseUrl: string; serviceRoleKey: string } | null;
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
  /**
   * Secret that Vercel Cron sends as `Authorization: Bearer <secret>` when it
   * calls the email retry route. Unset means the route refuses every call.
   */
  cronSecret: string | undefined;
  /**
   * The Forgeng Slack app. Null when the bot token is missing: nothing is
   * posted to Slack then.
   */
  slack: SlackConfig | null;
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

export interface SlackConfig {
  /** The bot's token, starting with "xoxb-". */
  botToken: string;
  /** The private channel for mentors' alerts. Null: those aren't posted. */
  mentorsChannelId: string | null;
}

export interface SmtpConfig {
  host: string;
  port: number;
  user: string | undefined;
  pass: string | undefined;
  secure: boolean;
}
