"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  APPLICATION_DRAFT_STORAGE_KEY,
  APPLICATION_FIELDS_BY_SLUG,
  APPLICATION_FORM_SCHEMA,
  APPLICATION_FORM_TOTAL_STEPS,
  APPLICATION_STEP_SLUGS,
  APPLICATION_WIZARD_COPY,
  isApplicationStepSlug,
  type ApplicationFormValues,
  type ApplicationStepSlug,
} from "@constants/applications";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardFooter } from "@components/ui/card";
import { Form } from "@components/ui/form";
import { Progress } from "@components/ui/progress";
import { useCurrentUser } from "@contexts";
import {
  readStorageJson,
  removeStorageItem,
  writeStorageJson,
} from "@utils/storage";
import { ApiError } from "@lib/api-client";
import { updateProfile } from "@features/profile";
import { createApplication, getMyApplication } from "../../api";

const stepHref = (slug: ApplicationStepSlug) => `/apply/${slug}`;

interface WizardProps {
  /** The current step's form, rendered inside the shared form provider. */
  children: ReactNode;
}

export const Wizard = ({ children }: WizardProps) => {
  const router = useRouter();
  const params = useParams<{ step: string }>();
  const { user, refreshUser } = useCurrentUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // The current step is taken from the URL segment; an unknown slug falls back
  // to the first step (the page itself redirects unknown slugs there too).
  const slug: ApplicationStepSlug = isApplicationStepSlug(params.step)
    ? params.step
    : APPLICATION_STEP_SLUGS[0];
  const stepIndex = APPLICATION_STEP_SLUGS.indexOf(slug);
  const isFirstStep = stepIndex <= 0;
  const isLastStep = stepIndex === APPLICATION_STEP_SLUGS.length - 1;

  // Scope the draft key to the current user so different accounts on the
  // same browser never share draft data.
  const draftKey = user?.id
    ? `${APPLICATION_DRAFT_STORAGE_KEY}_${user.id}`
    : null;

  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(APPLICATION_FORM_SCHEMA),
    defaultValues: {
      name: "",
      background: "",
      experience: "",
      motivation: "",
      linkedin: "",
      twitter: "",
      facebook: "",
      github: "",
      portfolio: "",
      telegram: "",
      whatsapp: "",
      country: "",
      videoUrl: "",
      wallet: { chain: "evm" as const, address: "" },
    },
  });

  // If the user already applied, send them to their status page.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const existing = await getMyApplication();
        if (!cancelled && existing) router.replace("/apply/status");
      } catch {
        // Non-fatal: fall through and let them try to apply.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (!draftKey) return;
    const parsed = readStorageJson<Partial<ApplicationFormValues>>(draftKey);
    if (!parsed) return;
    (Object.keys(parsed) as Array<keyof ApplicationFormValues>).forEach(
      (key) => {
        const value = parsed[key];
        if (typeof value === "string") form.setValue(key, value);
      },
    );
  }, [form, draftKey]);

  // Prefill the editable name from the signed-in account, unless the user has
  // already typed one (e.g. restored from a draft above).
  useEffect(() => {
    if (user?.name && !form.getValues("name")) {
      form.setValue("name", user.name);
    }
  }, [form, user?.name]);

  useEffect(() => {
    if (!draftKey) return;
    // React Compiler can't memoize functions returned from useForm; this
    // subscriber only writes to localStorage so it's safe to opt out here.
    // eslint-disable-next-line react-hooks/incompatible-library
    const subscription = form.watch((value) => {
      writeStorageJson(draftKey, value);
    });
    return () => subscription.unsubscribe();
  }, [form, draftKey]);

  const onSubmit = async (data: ApplicationFormValues) => {
    setIsSubmitting(true);
    try {
      // Persist the (possibly edited) name back to the account before applying.
      const trimmedName = data.name.trim();
      if (trimmedName && trimmedName !== (user?.name ?? "")) {
        await updateProfile({ name: trimmedName });
        await refreshUser();
      }
      await createApplication({
        background: data.background,
        motivation: data.motivation,
        experience: data.experience,
        linkedin: data.linkedin,
        twitter: data.twitter || undefined,
        facebook: data.facebook || undefined,
        github: data.github,
        portfolio: data.portfolio || undefined,
        telegram: data.telegram || undefined,
        whatsapp: data.whatsapp || undefined,
        country: data.country,
        videoUrl: data.videoUrl,
        // Send the single withdrawal address as a one-element array (or none).
        wallets: data.wallet.address.trim()
          ? [{ chain: data.wallet.chain, address: data.wallet.address.trim() }]
          : [],
      });
      if (draftKey) removeStorageItem(draftKey);
      toast.success(APPLICATION_WIZARD_COPY.toast.submitSuccess, {
        description: APPLICATION_WIZARD_COPY.toast.submitSuccessDescription,
      });
      router.push("/apply/status");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        toast.info(APPLICATION_WIZARD_COPY.toast.alreadySubmitted);
        router.replace("/apply/status");
        return;
      }
      toast.error(
        err instanceof ApiError
          ? err.message
          : APPLICATION_WIZARD_COPY.toast.submitError,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // If a deep-linked submit fails validation, the offending fields may live on
  // an earlier step the user never visited — send them to the first one.
  const onInvalid = (errors: FieldErrors<ApplicationFormValues>) => {
    const firstInvalidSlug = APPLICATION_STEP_SLUGS.find((stepSlug) =>
      APPLICATION_FIELDS_BY_SLUG[stepSlug].some((field) => errors[field]),
    );
    if (firstInvalidSlug && firstInvalidSlug !== slug) {
      router.push(stepHref(firstInvalidSlug));
    }
  };

  const goToNextStep = async () => {
    const valid = await form.trigger(APPLICATION_FIELDS_BY_SLUG[slug]);
    if (valid && !isLastStep) {
      router.push(stepHref(APPLICATION_STEP_SLUGS[stepIndex + 1]));
    }
  };

  const goToPrevStep = () => {
    if (!isFirstStep) {
      router.push(stepHref(APPLICATION_STEP_SLUGS[stepIndex - 1]));
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm font-medium text-muted-foreground hover:text-foreground mb-4 inline-block"
          >
            {APPLICATION_WIZARD_COPY.backToHome}
          </Link>
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold">
              {APPLICATION_WIZARD_COPY.pageTitle}
            </h1>
            <span className="text-sm font-medium text-muted-foreground">
              {APPLICATION_WIZARD_COPY.stepIndicator(
                stepIndex + 1,
                APPLICATION_FORM_TOTAL_STEPS,
              )}
            </span>
          </div>
          <Progress
            value={((stepIndex + 1) / APPLICATION_FORM_TOTAL_STEPS) * 100}
            className="h-2"
          />
        </div>

        <Card className="border-border bg-card">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, onInvalid)}>
              <CardContent className="pt-6 space-y-6">{children}</CardContent>
              <CardFooter className="flex justify-between border-t p-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={goToPrevStep}
                  disabled={isFirstStep}
                >
                  {APPLICATION_WIZARD_COPY.actions.back}
                </Button>
                {!isLastStep ? (
                  <Button type="button" onClick={goToNextStep}>
                    {APPLICATION_WIZARD_COPY.actions.next}
                  </Button>
                ) : (
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting
                      ? APPLICATION_WIZARD_COPY.actions.submitting
                      : APPLICATION_WIZARD_COPY.actions.submit}
                  </Button>
                )}
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
};
