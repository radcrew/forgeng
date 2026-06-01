"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

import { Logo } from "@components/brand/logo";
import { Button } from "@components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@components/ui/card";
import { verifyEmail } from "@features/auth";
import { ApiError } from "@lib/api-client";

type Status = "loading" | "success" | "error";

const VerifyEmailInner = () => {
  const params = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<Status>(token ? "loading" : "error");
  const [errorMessage, setErrorMessage] = useState<string>(
    token ? "" : "Missing verification token.",
  );

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void (async () => {
      try {
        await verifyEmail(token);
        if (!cancelled) setStatus("success");
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof ApiError
            ? err.message
            : "Verification failed. Please try again.";
        setErrorMessage(message);
        setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Logo size={28} priority />
            <span className="font-bold text-lg tracking-tight">Forgeng</span>
          </div>
          {status === "loading" && (
            <>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-2xl">Verifying…</CardTitle>
                <CardDescription>
                  Hang tight while we confirm your email.
                </CardDescription>
              </div>
            </>
          )}
          {status === "success" && (
            <>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl">Email verified</CardTitle>
                <CardDescription>
                  Your account is ready. Sign in to continue.
                </CardDescription>
              </div>
            </>
          )}
          {status === "error" && (
            <>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <XCircle className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl">
                  Verification failed
                </CardTitle>
                <CardDescription>{errorMessage}</CardDescription>
              </div>
            </>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {status === "success" && (
            <Button asChild className="w-full">
              <Link href="/sign-in">Sign in</Link>
            </Button>
          )}
          {status === "error" && (
            <>
              <Button asChild variant="outline" className="w-full">
                <Link href="/sign-up/check-email">Resend verification</Link>
              </Button>
              <Button asChild className="w-full">
                <Link href="/sign-in">Back to sign in</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const Page = () => (
  <Suspense fallback={null}>
    <VerifyEmailInner />
  </Suspense>
);

export default Page;
