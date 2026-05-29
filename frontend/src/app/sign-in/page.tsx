"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
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
import { useCurrentUser } from "@contexts";
import { AuthDivider, OAuthButtons } from "@features/auth";
import { ApiError } from "@lib/api-client";
import { homeForRole } from "@utils/auth";

const schema = z.object({
  email: z.email("Enter a valid email."),
  password: z.string().min(1, "Enter your password."),
});

type FormValues = z.infer<typeof schema>;

const Page = () => {
  const router = useRouter();
  const { login } = useCurrentUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const handleSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const user = await login(values.email, values.password);
      toast.success(`Signed in as ${user.name ?? user.email}.`);
      router.push(homeForRole(user.role));
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 403) {
          toast.error(
            "Please verify your email first. Check your inbox for the confirmation link.",
          );
        } else if (err.status === 401) {
          toast.error("Invalid email or password.");
        } else {
          toast.error(err.message || "Could not sign in. Please try again.");
        }
      } else {
        toast.error("Could not reach the API. Is the backend running?");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex items-center gap-2">
            <Logo size={28} priority />
            <span className="font-bold text-lg tracking-tight">Forgeng</span>
          </div>
          <div>
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>
              Sign in to continue to your portal.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <OAuthButtons disabled={isSubmitting} label="Sign in" />
          <AuthDivider />
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
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        autoComplete="current-password"
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
                {isSubmitting ? "Signing in…" : "Sign In"}
                {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                New here?{" "}
                <Link
                  href="/sign-up"
                  className="text-primary font-medium hover:underline"
                >
                  Create an account
                </Link>
              </p>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Page;
