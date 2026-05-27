"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";

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
import { Progress } from "@components/ui/progress";
import { Textarea } from "@components/ui/textarea";
import { createApplication } from "@features/applications";
import { ApiError } from "@lib/api-client";

const APPLICATION_SCHEMA = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Valid email is required"),
  background: z
    .string()
    .min(50, "Please provide more detail about your background"),
  experience: z.string().optional(),
  motivation: z
    .string()
    .min(50, "Please tell us why you want to join"),
});

type ApplicationFormValues = z.infer<typeof APPLICATION_SCHEMA>;

const STORAGE_KEY = "apprenticeship_application_draft";

const TOTAL_STEPS = 3;

export default function ApplyPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(APPLICATION_SCHEMA),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      background: "",
      experience: "",
      motivation: "",
    },
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as Partial<ApplicationFormValues>;
      (Object.keys(parsed) as Array<keyof ApplicationFormValues>).forEach(
        (key) => {
          const value = parsed[key];
          if (typeof value === "string") {
            form.setValue(key, value);
          }
        },
      );
    } catch {
      // Ignore malformed drafts; the user starts from scratch.
    }
  }, [form]);

  useEffect(() => {
    // React Compiler can't memoize functions returned from useForm; this
    // subscriber only writes to localStorage so it's safe to opt out here.
    // eslint-disable-next-line react-hooks/incompatible-library
    const subscription = form.watch((value) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const onSubmit = async (data: ApplicationFormValues) => {
    setIsSubmitting(true);
    try {
      await createApplication({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        background: data.background,
        motivation: data.motivation,
        experience: data.experience || undefined,
      });
      localStorage.removeItem(STORAGE_KEY);
      toast.success("Application submitted", {
        description: `Thanks ${data.firstName}, we'll be in touch soon.`,
      });
      router.push("/");
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Could not submit your application. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = async () => {
    const fieldsByStep: Record<number, Array<keyof ApplicationFormValues>> = {
      1: ["firstName", "lastName", "email"],
      2: ["background", "experience"],
    };
    const fields = fieldsByStep[step] ?? [];
    const valid = await form.trigger(fields);
    if (valid) setStep((s) => Math.min(s + 1, TOTAL_STEPS));
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
            ← Back to Home
          </Link>
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold">Apply to Forgeng</h1>
            <span className="text-sm font-medium text-muted-foreground">
              Step {step} of {TOTAL_STEPS}
            </span>
          </div>
          <Progress value={(step / TOTAL_STEPS) * 100} className="h-2" />
        </div>

        <Card className="border-border bg-card">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="pt-6 space-y-6">
                {step === 1 && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                    <h2 className="text-xl font-semibold">
                      Basic Information
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Jane" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="jane@example.com"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                    <h2 className="text-xl font-semibold">Your Background</h2>
                    <FormField
                      control={form.control}
                      name="background"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tell us about yourself</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Where are you coming from? What have you been learning?"
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
                            Technical Experience (Optional)
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Any programming languages, tools, or projects you've worked with?"
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
                    <h2 className="text-xl font-semibold">Motivation</h2>
                    <FormField
                      control={form.control}
                      name="motivation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Why do you want to join this program?
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="What are your goals? How will this apprenticeship help you achieve them?"
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
                  Back
                </Button>

                {step < TOTAL_STEPS ? (
                  <Button type="button" onClick={nextStep}>
                    Next Step
                  </Button>
                ) : (
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Submitting..." : "Submit Application"}
                  </Button>
                )}
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
}
