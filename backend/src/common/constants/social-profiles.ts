// Profile-link patterns shared by the application form and the account profile
// form so both validate social URLs identically.
//
// A LinkedIn member profile (linkedin.com/in/<slug>), optionally on a country
// subdomain. A GitHub user profile (github.com/<username>) follows GitHub's
// username rules: 1–39 chars, alphanumeric or single non-leading/trailing
// hyphens. Both reject non-profile URLs that merely live on the right host.
export const LINKEDIN_PROFILE_REGEX =
  /^https?:\/\/([a-z]{2,3}\.)?linkedin\.com\/in\/[\w%-]+\/?(\?.*)?$/i;
export const GITHUB_PROFILE_REGEX =
  /^https?:\/\/(www\.)?github\.com\/[A-Za-z0-9](?:-?[A-Za-z0-9]){0,38}\/?(\?.*)?$/i;

// X / Twitter profile (handle: 1–15 chars), Facebook profile (username or the
// numeric profile.php?id= form), and a Telegram t.me link or @username
// (5–32 chars, starts with a letter). Each rejects non-profile URLs on-host.
export const TWITTER_PROFILE_REGEX =
  /^https?:\/\/(www\.)?(twitter|x)\.com\/[A-Za-z0-9_]{1,15}\/?(\?.*)?$/i;
export const FACEBOOK_PROFILE_REGEX =
  /^https?:\/\/(www\.|m\.)?(facebook|fb)\.com\/(profile\.php\?id=\d+|[A-Za-z0-9.]{3,})\/?$/i;
export const TELEGRAM_REGEX =
  /^(https?:\/\/t\.me\/[A-Za-z][A-Za-z0-9_]{4,31}\/?|@[A-Za-z][A-Za-z0-9_]{4,31})$/;

// A WhatsApp number in E.164 form: a leading + and 7–15 digits.
export const WHATSAPP_REGEX = /^\+[1-9]\d{6,14}$/;

export const SOCIAL_PROFILE_MESSAGES = {
  linkedin:
    'Enter your LinkedIn profile URL (e.g. https://linkedin.com/in/you)',
  github: 'Enter your GitHub profile URL (e.g. https://github.com/you)',
  twitter: 'Enter your X/Twitter profile URL (e.g. https://x.com/you)',
  facebook: 'Enter your Facebook profile URL (e.g. https://facebook.com/you)',
  telegram: 'Enter a t.me URL (https://t.me/you) or a @username',
  whatsapp: 'Enter a phone number with country code (e.g. +1234567890)',
} as const;
