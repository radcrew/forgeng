import { z } from "zod";

const optionalUrl = z
  .string()
  .refine(
    (val) => !val || z.string().url().safeParse(val).success,
    "Enter a valid URL (e.g. https://...)",
  );

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

const walletEntry = z
  .object({
    chain: z.enum(["evm", "solana", "tron"] as ["evm", "solana", "tron"], { error: "Select a chain" }),
    address: z.string().min(1, "Address is required"),
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
    .url("Enter a valid LinkedIn URL (e.g. https://linkedin.com/in/you)"),
  twitter: optionalUrl,
  facebook: optionalUrl,
  github: z
    .string()
    .min(1, "GitHub profile is required")
    .url("Enter a valid GitHub URL (e.g. https://github.com/you)"),
  portfolio: optionalUrl,
  telegram: z
    .string()
    .refine(
      (val) => !val || /^(https?:\/\/t\.me\/.+|@[\w.]+)$/.test(val),
      "Enter a t.me URL (https://t.me/you) or a @username",
    ),
  whatsapp: z
    .string()
    .refine(
      (val) => !val || /^\+[1-9]\d{6,14}$/.test(val),
      "Enter a number with country code (e.g. +1234567890)",
    ),
  address: z.string().min(1, "Address is required").max(500, "Address must be under 500 characters"),
  videoUrl: z.string().min(1, "Please record and upload your video introduction"),
  wallets: z.array(walletEntry),
});

export type ApplicationFormValues = z.infer<typeof APPLICATION_FORM_SCHEMA>;

export const APPLICATION_DRAFT_STORAGE_KEY = "apprenticeship_application_draft";

export const APPLICATION_FORM_TOTAL_STEPS = 6;

export const APPLICATION_FORM_FIELDS_BY_STEP: Record<
  number,
  Array<keyof ApplicationFormValues>
> = {
  // Step 1 collects the editable name (email stays read-only).
  1: ["name"],
  2: ["background", "experience"],
  3: ["motivation"],
  4: ["linkedin", "twitter", "facebook", "github", "portfolio", "telegram", "whatsapp", "address"],
  5: ["videoUrl"],
  // Step 6 (wallets) is the submit step — validated by form.handleSubmit.
};
