import { z } from "zod";

import { APPLICATION_COUNTRY_CODES } from "@constants/shared/countries";
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

export const WALLET_CHAINS = ["evm", "solana", "tron"] as const;
export type WalletChain = (typeof WALLET_CHAINS)[number];

const ADDRESS_PATTERNS: Record<WalletChain, RegExp> = {
  evm: /^0x[0-9a-fA-F]{40}$/,
  solana: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
  tron: /^T[1-9A-HJ-NP-Za-km-z]{33}$/,
};

const ADDRESS_MESSAGES: Record<WalletChain, string> = {
  evm: "Enter a valid EVM address (0x + 40 hex characters)",
  solana: "Enter a valid Solana address",
  tron: "Enter a valid Tron address (starts with T)",
};

// A student has a single, optional withdrawal address. The address may be left
// blank (skipped), but if provided it must be valid for the selected chain.
const walletEntry = z
  .object({
    chain: z.enum(["evm", "solana", "tron"] as ["evm", "solana", "tron"], { error: "Select a chain" }),
    address: z.string(),
  })
  .superRefine((entry, ctx) => {
    if (entry.address && !ADDRESS_PATTERNS[entry.chain].test(entry.address)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: ADDRESS_MESSAGES[entry.chain],
        path: ["address"],
      });
    }
  });

/** Max length for the free-text background and motivation answers. */
export const APPLICATION_TEXT_MAX_LENGTH = 1000;

// Email comes from the signed-in account (read-only), but the applicant can
// edit their name in the first step — so name is part of the form schema and
// is persisted back to their profile on submit.
export const APPLICATION_FORM_SCHEMA = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(120, "Name must be under 120 characters"),
  background: z
    .string()
    .min(20, "Please provide more detail about your background")
    .max(
      APPLICATION_TEXT_MAX_LENGTH,
      `Please keep this under ${APPLICATION_TEXT_MAX_LENGTH} characters`,
    ),
  experience: z
    .string()
    .min(1, "Please share your technical experience"),
  motivation: z
    .string()
    .min(20, "Please tell us why you want to join")
    .max(
      APPLICATION_TEXT_MAX_LENGTH,
      `Please keep this under ${APPLICATION_TEXT_MAX_LENGTH} characters`,
    ),
  linkedin: z
    .string()
    .min(1, "LinkedIn profile is required")
    .url("Enter a valid LinkedIn URL (e.g. https://linkedin.com/in/you)")
    .refine((val) => LINKEDIN_PROFILE_RE.test(val), SOCIAL_PROFILE_MESSAGES.linkedin),
  twitter: optionalMatching(TWITTER_PROFILE_RE, SOCIAL_PROFILE_MESSAGES.twitter),
  facebook: optionalMatching(FACEBOOK_PROFILE_RE, SOCIAL_PROFILE_MESSAGES.facebook),
  github: z
    .string()
    .min(1, "GitHub profile is required")
    .url("Enter a valid GitHub URL (e.g. https://github.com/you)")
    .refine((val) => GITHUB_PROFILE_RE.test(val), SOCIAL_PROFILE_MESSAGES.github),
  portfolio: optionalUrl,
  telegram: optionalMatching(TELEGRAM_RE, SOCIAL_PROFILE_MESSAGES.telegram),
  whatsapp: optionalMatching(WHATSAPP_RE, SOCIAL_PROFILE_MESSAGES.whatsapp),
  country: z
    .string()
    .refine(
      (val) => (APPLICATION_COUNTRY_CODES as readonly string[]).includes(val),
      "Select your country",
    ),
  videoUrl: z.string().min(1, "Please record and upload your video introduction"),
  wallet: walletEntry,
});

export type ApplicationFormValues = z.infer<typeof APPLICATION_FORM_SCHEMA>;

export const APPLICATION_DRAFT_STORAGE_KEY = "apprenticeship_application_draft";

// Each wizard step has its own URL segment, e.g. /apply/background. The order
// of this array is the order steps are shown in.
export const APPLICATION_STEP_SLUGS = [
  "basic-info",
  "background",
  "motivation",
  "social-profiles",
  "video",
  "wallets",
] as const;

export type ApplicationStepSlug = (typeof APPLICATION_STEP_SLUGS)[number];

export const APPLICATION_FORM_TOTAL_STEPS = APPLICATION_STEP_SLUGS.length;

export const isApplicationStepSlug = (
  value: string | undefined,
): value is ApplicationStepSlug =>
  APPLICATION_STEP_SLUGS.includes(value as ApplicationStepSlug);

// Fields validated before advancing from each step. The final step (wallets)
// is validated by form.handleSubmit, so it has no gated fields here.
export const APPLICATION_FIELDS_BY_SLUG: Record<
  ApplicationStepSlug,
  Array<keyof ApplicationFormValues>
> = {
  "basic-info": ["name"],
  background: ["background", "experience"],
  motivation: ["motivation"],
  "social-profiles": [
    "linkedin",
    "twitter",
    "facebook",
    "github",
    "portfolio",
    "telegram",
    "whatsapp",
    "country",
  ],
  video: ["videoUrl"],
  wallets: [],
};
