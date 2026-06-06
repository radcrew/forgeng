"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  APPLICATION_STEP_SLUGS,
  isApplicationStepSlug,
} from "@constants/applications";
import { WizardStep } from "@features/applications";

const Page = () => {
  const params = useParams<{ step: string }>();
  const router = useRouter();
  const isValid = isApplicationStepSlug(params.step);

  // Unknown slugs (typos, stale links) fall back to the first step.
  useEffect(() => {
    if (!isValid) router.replace(`/apply/${APPLICATION_STEP_SLUGS[0]}`);
  }, [isValid, router]);

  if (!isApplicationStepSlug(params.step)) return null;

  return <WizardStep slug={params.step} />;
};

export default Page;
