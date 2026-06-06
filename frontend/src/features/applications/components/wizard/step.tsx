"use client";

import { useFormContext } from "react-hook-form";

import {
  type ApplicationFormValues,
  type ApplicationStepSlug,
} from "@constants/applications";
import { useCurrentUser } from "@contexts";

import { StepBasicInfo } from "./step-basic-info";
import { StepBackground } from "./step-background";
import { StepMotivation } from "./step-motivation";
import { StepSocialProfiles } from "./step-social-profiles";
import { StepVideoIntro } from "./step-video-intro";
import { StepWallets } from "./step-wallets";

/**
 * Renders the form for a single wizard step, reading the shared form instance
 * from the provider set up by the {@link Wizard} shell in the layout.
 */
export const WizardStep = ({ slug }: { slug: ApplicationStepSlug }) => {
  const { control, setValue } = useFormContext<ApplicationFormValues>();
  const { user } = useCurrentUser();

  switch (slug) {
    case "basic-info":
      return <StepBasicInfo control={control} user={user} />;
    case "background":
      return <StepBackground control={control} />;
    case "motivation":
      return <StepMotivation control={control} />;
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
    case "wallets":
      return <StepWallets control={control} />;
  }
};
