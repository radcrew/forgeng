"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ArrowRight, XCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { Logo } from "@components/brand/logo";
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
import { resetPassword } from "@features/auth";
import { ApiError } from "@lib/api-client";

const schema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(72, "Password is too long.")
      .regex(
        /^(?=.*[A-Za-z])(?=.*\d).+$/,
        "Password must contain a letter and a digit.",
      ),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

const ResetPasswordInner = () => {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const handleSubmit = async (values: FormValues) => {
    if (!token) return;
    setIsSubmitting(true);
    try {
      await resetPassword(token, values.password);
      toast.success("Password updated. Sign in with your new password.");
      router.push("/sign-in");
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message || "Could not reset your password.");
      } else {
        toast.error("Could not reach the API. Is the backend running?");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Logo size={28} priority />
              <span className="font-bold text-lg tracking-tight">Forgeng</span>
            </div>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <XCircle className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-2xl">Invalid reset link</CardTitle>
              <CardDescription>
                This link is missing its token. Request a new one to continue.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/forgot-password">Request a new link</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/sign-in">Back to sign in</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex items-center gap-2">
            <Logo size={28} priority />
            <span className="font-bold text-lg tracking-tight">Forgeng</span>
          </div>
          <div>
            <CardTitle className="text-2xl">Set a new password</CardTitle>
            <CardDescription>
              Choose a new password for your account.
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
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        autoComplete="new-password"
                        placeholder="••••••••"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm new password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        autoComplete="new-password"
                        placeholder="••••••••"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button className="w-full" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Updating…" : "Reset password"}
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
    </div>
  );
};

const Page = () => (
  <Suspense fallback={null}>
    <ResetPasswordInner />
  </Suspense>
);

export default Page;
