"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  APPLICATION_DRAFT_STORAGE_KEY,
  APPLICATION_FORM_FIELDS_BY_STEP,
  APPLICATION_FORM_SCHEMA,
  APPLICATION_FORM_TOTAL_STEPS,
  APPLICATION_WIZARD_COPY,
  type ApplicationFormValues,
} from "@constants/applications";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardFooter } from "@components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@components/ui/form";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Progress } from "@components/ui/progress";
import { Textarea } from "@components/ui/textarea";
import { useCurrentUser } from "@contexts";
import {
  readStorageJson,
  removeStorageItem,
  writeStorageJson,
} from "@utils/storage";
import { createApplication, getMyApplication } from "../api";
import { ApiError } from "@lib/api-client";

export const Wizard = () => {
  const router = useRouter();
  const { user } = useCurrentUser();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(APPLICATION_FORM_SCHEMA),
    defaultValues: {
      background: "",
      experience: "",
      motivation: "",
    },
  });

  // If the user already applied, there is nothing to fill in — send them to
  // their application status instead of showing a blank form.
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
    const parsed = readStorageJson<Partial<ApplicationFormValues>>(
      APPLICATION_DRAFT_STORAGE_KEY,
    );
    if (!parsed) return;
    (Object.keys(parsed) as Array<keyof ApplicationFormValues>).forEach(
      (key) => {
        const value = parsed[key];
        if (typeof value === "string") {
          form.setValue(key, value);
        }
      },
    );
  }, [form]);

  useEffect(() => {
    // React Compiler can't memoize functions returned from useForm; this
    // subscriber only writes to localStorage so it's safe to opt out here.
    // eslint-disable-next-line react-hooks/incompatible-library
    const subscription = form.watch((value) => {
      writeStorageJson(APPLICATION_DRAFT_STORAGE_KEY, value);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const onSubmit = async (data: ApplicationFormValues) => {
    setIsSubmitting(true);
    try {
      await createApplication({
        background: data.background,
        motivation: data.motivation,
        experience: data.experience || undefined,
      });
      removeStorageItem(APPLICATION_DRAFT_STORAGE_KEY);
      toast.success(APPLICATION_WIZARD_COPY.toast.submitSuccess, {
        description: APPLICATION_WIZARD_COPY.toast.submitSuccessDescription,
      });
      router.push("/apply/status");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        // Already applied (e.g. submitted in another tab) — show their status.
        toast.info(APPLICATION_WIZARD_COPY.toast.alreadySubmitted);
        router.replace("/apply/status");
        return;
      }
      const message =
        err instanceof ApiError
          ? err.message
          : APPLICATION_WIZARD_COPY.toast.submitError;
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = async () => {
    const fields = APPLICATION_FORM_FIELDS_BY_STEP[step] ?? [];
    const valid = await form.trigger(fields);
    if (valid) setStep((s) => Math.min(s + 1, APPLICATION_FORM_TOTAL_STEPS));
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

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
                step,
                APPLICATION_FORM_TOTAL_STEPS,
              )}
            </span>
          </div>
          <Progress value={(step / APPLICATION_FORM_TOTAL_STEPS) * 100} className="h-2" />
        </div>

        <Card className="border-border bg-card">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="pt-6 space-y-6">
                {step === 1 && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                    <h2 className="text-xl font-semibold">
                      {APPLICATION_WIZARD_COPY.steps.basicInfo.title}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {APPLICATION_WIZARD_COPY.steps.basicInfo.accountHint}
                    </p>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>
                          {APPLICATION_WIZARD_COPY.steps.basicInfo.nameLabel}
                        </Label>
                        <Input value={user?.name ?? "—"} disabled readOnly />
                      </div>
                      <div className="space-y-2">
                        <Label>
                          {APPLICATION_WIZARD_COPY.steps.basicInfo.emailLabel}
                        </Label>
                        <Input value={user?.email ?? "—"} disabled readOnly />
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                    <h2 className="text-xl font-semibold">
                      {APPLICATION_WIZARD_COPY.steps.background.title}
                    </h2>
                    <FormField
                      control={form.control}
                      name="background"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {
                              APPLICATION_WIZARD_COPY.steps.background
                                .backgroundLabel
                            }
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={
                                APPLICATION_WIZARD_COPY.steps.background
                                  .backgroundPlaceholder
                              }
                              className="min-h-[120px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="experience"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {
                              APPLICATION_WIZARD_COPY.steps.background
                                .experienceLabel
                            }
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={
                                APPLICATION_WIZARD_COPY.steps.background
                                  .experiencePlaceholder
                              }
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                    <h2 className="text-xl font-semibold">
                      {APPLICATION_WIZARD_COPY.steps.motivation.title}
                    </h2>
                    <FormField
                      control={form.control}
                      name="motivation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {
                              APPLICATION_WIZARD_COPY.steps.motivation
                                .motivationLabel
                            }
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={
                                APPLICATION_WIZARD_COPY.steps.motivation
                                  .motivationPlaceholder
                              }
                              className="min-h-[150px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between border-t p-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={step === 1}
                >
                  {APPLICATION_WIZARD_COPY.actions.back}
                </Button>

                {step < APPLICATION_FORM_TOTAL_STEPS ? (
                  <Button type="button" onClick={nextStep}>
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
