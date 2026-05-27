import { z } from "zod";

export const APPLICATION_FORM_SCHEMA = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Valid email is required"),
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
  1: ["firstName", "lastName", "email"],
  2: ["background", "experience"],
};
