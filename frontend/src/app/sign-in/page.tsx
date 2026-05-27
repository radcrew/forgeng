"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
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
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { useCurrentUser } from "@contexts";
import { homeForRole } from "@utils/auth";
import { ApiError } from "@lib/api-client";

const SignInPage = () => {
  const router = useRouter();
  const { signInWithEmail } = useCurrentUser();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      toast.error("Enter your email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await signInWithEmail(trimmed);
      toast.success(`Signed in as ${user.name ?? user.email}.`);
      router.push(homeForRole(user.role));
    } catch (err) {
      const message =
        err instanceof ApiError
          ? "Could not sign in. Check your email or try again."
          : err instanceof Error
            ? err.message
            : "Could not reach the API. Is the backend running?";
      toast.error(message);
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
              Sign in with the email on your account. Your role is loaded from
              the platform after you continue.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default SignInPage;
