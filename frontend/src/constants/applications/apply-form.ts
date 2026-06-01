import { z } from "zod";

// Identity (name + email) comes from the signed-in account, so it is not part
// of the form schema — only the application content is collected here.
export const APPLICATION_FORM_SCHEMA = z.object({
  background: z
    .string()
    .min(50, "Please provide more detail about your background"),
  experience: z.string().optional(),
  motivation: z.string().min(50, "Please tell us why you want to join"),
});

export type ApplicationFormValues = z.infer<typeof APPLICATION_FORM_SCHEMA>;

export const APPLICATION_DRAFT_STORAGE_KEY = "apprenticeship_application_draft";

export const APPLICATION_FORM_TOTAL_STEPS = 3;

export const APPLICATION_FORM_FIELDS_BY_STEP: Record<
  number,
  Array<keyof ApplicationFormValues>
> = {
  // Step 1 confirms identity (read-only, no validated fields).
  1: [],
  2: ["background", "experience"],
};
