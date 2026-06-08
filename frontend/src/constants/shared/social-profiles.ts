import { z } from "zod";

// Profile-link patterns shared by the application form and the account profile
// form so both validate social URLs identically.

// A LinkedIn member profile: linkedin.com/in/<slug>, optionally on a country
// subdomain (e.g. de.linkedin.com). Rejects company pages, feeds, and other
// linkedin.com URLs that aren't a personal profile.
export const LINKEDIN_PROFILE_RE =
  /^https?:\/\/([a-z]{2,3}\.)?linkedin\.com\/in\/[\w%-]+\/?(\?.*)?$/i;

// A GitHub user profile: github.com/<username>. The username follows GitHub's
// own rules — 1–39 chars, alphanumeric or single hyphens, no leading/trailing
// or consecutive hyphens — so repo/org sub-paths are rejected.
export const GITHUB_PROFILE_RE =
  /^https?:\/\/(www\.)?github\.com\/[A-Za-z0-9](?:-?[A-Za-z0-9]){0,38}\/?(\?.*)?$/i;

// An X / Twitter profile: x.com or twitter.com followed by a handle (1–15
// chars, letters/numbers/underscore). Rejects status links and other paths.
export const TWITTER_PROFILE_RE =
  /^https?:\/\/(www\.)?(twitter|x)\.com\/[A-Za-z0-9_]{1,15}\/?(\?.*)?$/i;

// A Facebook profile: facebook.com/<username> (3+ chars, letters/numbers/dots)
// or the numeric profile.php?id=<digits> form. Also allows the fb.com and m.
// hosts.
export const FACEBOOK_PROFILE_RE =
  /^https?:\/\/(www\.|m\.)?(facebook|fb)\.com\/(profile\.php\?id=\d+|[A-Za-z0-9.]{3,})\/?$/i;

// A Telegram handle: a t.me link or an @username. Usernames are 5–32 chars,
// must start with a letter, and contain only letters, numbers, underscores.
export const TELEGRAM_RE =
  /^(https?:\/\/t\.me\/[A-Za-z][A-Za-z0-9_]{4,31}\/?|@[A-Za-z][A-Za-z0-9_]{4,31})$/;

// A WhatsApp number in E.164 form: a leading + and 7–15 digits.
export const WHATSAPP_RE = /^\+[1-9]\d{6,14}$/;

export const SOCIAL_PROFILE_MESSAGES = {
  linkedin: "Enter your LinkedIn profile URL (e.g. https://linkedin.com/in/you)",
  github: "Enter your GitHub profile URL (e.g. https://github.com/you)",
  twitter: "Enter your X/Twitter profile URL (e.g. https://x.com/you)",
  facebook: "Enter your Facebook profile URL (e.g. https://facebook.com/you)",
  telegram: "Enter a t.me URL (https://t.me/you) or a @username",
  whatsapp: "Enter a number with country code (e.g. +1234567890)",
} as const;

/** A string field that is allowed to be blank but, if filled, must match `re`. */
export const optionalMatching = (re: RegExp, message: string) =>
  z.string().refine((val) => !val || re.test(val), message);

/** A string field that is allowed to be blank but, if filled, must be a URL. */
export const optionalUrl = z
  .string()
  .refine(
    (val) => !val || z.string().url().safeParse(val).success,
    "Enter a valid URL (e.g. https://...)",
  );
