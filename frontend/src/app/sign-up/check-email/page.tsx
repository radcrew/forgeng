"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Mail } from "lucide-react";
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
import { resendVerification } from "@features/auth";
import { ApiError } from "@lib/api-client";

const CheckEmailInner = () => {
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const [isSending, setIsSending] = useState(false);

  const handleResend = async () => {
    if (!email) {
      toast.error("Missing email — go back to sign-up and try again.");
      return;
    }
    setIsSending(true);
    try {
      await resendVerification(email);
      toast.success("If the email is registered, a new link is on its way.");
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Could not resend right now.";
      toast.error(message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Logo size={28} priority />
            <span className="font-bold text-lg tracking-tight">Forgeng</span>
          </div>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Mail className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-2xl">Check your email</CardTitle>
            <CardDescription>
              {email
                ? `We sent a verification link to ${email}. Click it to activate your account.`
                : "We sent you a verification link. Click it to activate your account."}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleResend}
            disabled={isSending || !email}
          >
            {isSending ? "Sending…" : "Resend verification email"}
          </Button>
          <p className="text-sm text-muted-foreground">
            Already verified?{" "}
            <Link
              href="/sign-in"
              className="text-primary font-medium hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

const Page = () => (
  <Suspense fallback={null}>
    <CheckEmailInner />
  </Suspense>
);

export default Page;
