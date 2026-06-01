"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Mail } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@components/ui/button";
import { AuthCard, resendVerification } from "@features/auth";
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
    <AuthCard centered>
      <AuthCard.Header
        icon={Mail}
        title="Check your email"
        description={
          email
            ? `We sent a verification link to ${email}. Click it to activate your account.`
            : "We sent you a verification link. Click it to activate your account."
        }
      />
      <AuthCard.Content
        prompt={{
          text: "Already verified?",
          linkText: "Sign in",
          href: "/sign-in",
        }}
      >
        <Button
          variant="outline"
          className="w-full"
          onClick={handleResend}
          disabled={isSending || !email}
        >
          {isSending ? "Sending…" : "Resend verification email"}
        </Button>
      </AuthCard.Content>
    </AuthCard>
  );
};

const Page = () => (
  <Suspense fallback={null}>
    <CheckEmailInner />
  </Suspense>
);

export default Page;
