"use client";

import { useFormContext } from "react-hook-form";

import {
  type ApplicationFormValues,
  type ApplicationStepSlug,
} from "@constants/applications";

import { StepSocialProfiles } from "./step-social-profiles";
import { StepVideoIntro } from "./step-video-intro";

/**
 * Renders the form for a single wizard step, reading the shared form instance
 * from the provider set up by the {@link Wizard} shell in the layout.
 */
export const WizardStep = ({ slug }: { slug: ApplicationStepSlug }) => {
  const { control, setValue } = useFormContext<ApplicationFormValues>();

  switch (slug) {
    case "social-profiles":
      return <StepSocialProfiles control={control} />;
    case "video":
      return (
        <StepVideoIntro
          control={control}
          onVideoUploaded={(url) =>
            setValue("videoUrl", url, { shouldValidate: true })
          }
        />
      );
  }
};
