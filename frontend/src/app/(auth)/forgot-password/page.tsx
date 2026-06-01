"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@components/ui/form";
import { Input } from "@components/ui/input";
import { AuthBrand, forgotPassword } from "@features/auth";
import { ApiError } from "@lib/api-client";

const schema = z.object({
  email: z.email("Enter a valid email."),
});

type FormValues = z.infer<typeof schema>;

const Page = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const handleSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      await forgotPassword(values.email);
      setSubmittedEmail(values.email);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message || "Could not send the reset link.");
      } else {
        toast.error("Could not reach the API. Is the backend running?");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedEmail) {
    return (
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-4">
          <AuthBrand centered />
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Mail className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-2xl">Check your email</CardTitle>
            <CardDescription>
              If an account exists for {submittedEmail}, we sent a link to reset
              your password. The link expires soon.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Remembered it?{" "}
            <Link
              href="/sign-in"
              className="text-primary font-medium hover:underline"
            >
              Back to sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-4">
        <AuthBrand />
        <div>
          <CardTitle className="text-2xl">Forgot your password?</CardTitle>
          <CardDescription>
            Enter your email and we&apos;ll send you a link to reset it.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
            noValidate
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Sending…" : "Send reset link"}
              {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Remembered it?{" "}
              <Link
                href="/sign-in"
                className="text-primary font-medium hover:underline"
              >
                Back to sign in
              </Link>
            </p>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default Page;
