import { z } from "zod";

import { APPLICATION_COUNTRY_CODES } from "@constants/shared/countries";
import { isWalletAddressForChain } from "@utils/wallet";
import {
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
    if (entry.address && !isWalletAddressForChain(entry.chain, entry.address)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: ADDRESS_MESSAGES[entry.chain],
        path: ["address"],
      });
    }
  });

export const CONTACT_REQUIRED_MESSAGE = "Add a Telegram or WhatsApp contact";

// The applicant can edit their name on the social profiles step (prefilled
// from their account), so name is part of the form schema and is persisted
// back to their profile on submit.
export const APPLICATION_FORM_SCHEMA = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(120, "Name must be under 120 characters"),
  linkedin: optionalMatching(LINKEDIN_PROFILE_RE, SOCIAL_PROFILE_MESSAGES.linkedin),
  twitter: optionalMatching(TWITTER_PROFILE_RE, SOCIAL_PROFILE_MESSAGES.twitter),
  github: optionalMatching(GITHUB_PROFILE_RE, SOCIAL_PROFILE_MESSAGES.github),
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
}).superRefine(
  (values, ctx) => {
    // At least one way to reach the applicant. Shown under both fields.
    if (values.telegram.trim() || values.whatsapp.trim()) return;
    for (const path of ["telegram", "whatsapp"]) {
      ctx.addIssue({ code: "custom", message: CONTACT_REQUIRED_MESSAGE, path: [path] });
    }
  },
  // Run even while other fields (such as the video on the next step) are
  // still invalid, so the error shows on the step that has these fields.
  { when: () => true },
);

export type ApplicationFormValues = z.infer<typeof APPLICATION_FORM_SCHEMA>;

// Lives under the `forgeng.` prefix so sign-out clears it (see lib/session.ts).
export const APPLICATION_DRAFT_STORAGE_KEY = "forgeng.applicationDraft";

// Each wizard step has its own URL segment, e.g. /apply/video. The order of
// this array is the order steps are shown in.
export const APPLICATION_STEP_SLUGS = ["social-profiles", "video"] as const;

export type ApplicationStepSlug = (typeof APPLICATION_STEP_SLUGS)[number];

export const APPLICATION_FORM_TOTAL_STEPS = APPLICATION_STEP_SLUGS.length;

export const isApplicationStepSlug = (
  value: string | undefined,
): value is ApplicationStepSlug =>
  APPLICATION_STEP_SLUGS.includes(value as ApplicationStepSlug);

// Fields validated before advancing from each step. form.handleSubmit also
// validates everything again on the final step.
export const APPLICATION_FIELDS_BY_SLUG: Record<
  ApplicationStepSlug,
  Array<keyof ApplicationFormValues>
> = {
  "social-profiles": [
    "name",
    "linkedin",
    "twitter",
    "github",
    "portfolio",
    "telegram",
    "whatsapp",
    "country",
    "wallet",
  ],
  video: ["videoUrl"],
};
