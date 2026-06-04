import { z } from "zod";

const optionalUrl = z
  .string()
  .refine(
    (val) => !val || z.string().url().safeParse(val).success,
    "Enter a valid URL (e.g. https://...)",
  );

// Identity (name + email) comes from the signed-in account, so it is not part
// of the form schema — only the application content is collected here.
export const APPLICATION_FORM_SCHEMA = z.object({
  background: z
    .string()
    .min(50, "Please provide more detail about your background"),
  experience: z.string().optional(),
  motivation: z.string().min(50, "Please tell us why you want to join"),
  linkedin: z
    .string()
    .min(1, "LinkedIn profile is required")
    .url("Enter a valid LinkedIn URL (e.g. https://linkedin.com/in/you)"),
  twitter: optionalUrl,
  facebook: optionalUrl,
  github: optionalUrl,
  portfolio: optionalUrl,
});

export type ApplicationFormValues = z.infer<typeof APPLICATION_FORM_SCHEMA>;

export const APPLICATION_DRAFT_STORAGE_KEY = "apprenticeship_application_draft";

export const APPLICATION_FORM_TOTAL_STEPS = 4;

export const APPLICATION_FORM_FIELDS_BY_STEP: Record<
  number,
  Array<keyof ApplicationFormValues>
> = {
  // Step 1 confirms identity (read-only, no validated fields).
  1: [],
  2: ["background", "experience"],
  3: ["motivation"],
  4: ["linkedin", "twitter", "facebook", "github", "portfolio"],
};
