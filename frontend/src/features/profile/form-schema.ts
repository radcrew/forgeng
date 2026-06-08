import { z } from "zod";

import {
  FACEBOOK_PROFILE_RE,
  GITHUB_PROFILE_RE,
  LINKEDIN_PROFILE_RE,
  optionalMatching,
  optionalUrl,
  SOCIAL_PROFILE_MESSAGES,
  TELEGRAM_RE,
  TWITTER_PROFILE_RE,
  WHATSAPP_RE,
} from "@constants/shared/social-profiles";

// Every field is optional to save — students can fill their profile in over
// time — but any social link that is provided must be a real profile URL, the
// same rules the application form enforces.
export const PROFILE_FORM_SCHEMA = z.object({
  name: z.string().trim().max(120, "Name must be under 120 characters"),
  bio: z.string().max(2000, "Bio must be under 2000 characters"),
  github: optionalMatching(GITHUB_PROFILE_RE, SOCIAL_PROFILE_MESSAGES.github),
  linkedin: optionalMatching(LINKEDIN_PROFILE_RE, SOCIAL_PROFILE_MESSAGES.linkedin),
  twitter: optionalMatching(TWITTER_PROFILE_RE, SOCIAL_PROFILE_MESSAGES.twitter),
  facebook: optionalMatching(FACEBOOK_PROFILE_RE, SOCIAL_PROFILE_MESSAGES.facebook),
  telegram: optionalMatching(TELEGRAM_RE, SOCIAL_PROFILE_MESSAGES.telegram),
  whatsapp: optionalMatching(WHATSAPP_RE, SOCIAL_PROFILE_MESSAGES.whatsapp),
  portfolio: optionalUrl,
});

export type ProfileFormValues = z.infer<typeof PROFILE_FORM_SCHEMA>;
