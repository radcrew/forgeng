"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";

import { Card } from "@components/ui/card";
import {
  AuthCardContent,
  AuthCardHeader,
  forgotPassword,
} from "@features/auth";
import { ApiError } from "@lib/api-client";

const schema = z.object({
  email: z.email("Enter a valid email."),
});

type FormValues = z.infer<typeof schema>;

const backToSignIn = {
  text: "Remembered it?",
  linkText: "Back to sign in",
  href: "/sign-in",
} as const;

const Page = () => {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const handleSubmit = async (values: FormValues) => {
    try {
      await forgotPassword(values.email);
      setSubmittedEmail(values.email);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message || "Could not send the reset link.");
      } else {
        toast.error("Could not reach the API. Is the backend running?");
      }
    }
  };

  if (submittedEmail) {
    return (
      <Card className="w-full max-w-md text-center">
        <AuthCardHeader
          icon={Mail}
          title="Check your email"
          description={`If an account exists for ${submittedEmail}, we sent a link to reset your password. The link expires soon.`}
        />
        <AuthCardContent prompt={backToSignIn} />
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <AuthCardHeader
        title="Forgot your password?"
        description="Enter your email and we'll send you a link to reset it."
      />
      <AuthCardContent<FormValues>
        schema={schema}
        defaultValues={{ email: "" }}
        onSubmit={handleSubmit}
        submitLabel="Send reset link"
        pendingLabel="Sending…"
        prompt={backToSignIn}
        fields={[
          {
            name: "email",
            label: "Email",
            type: "email",
            autoComplete: "email",
            placeholder: "you@example.com",
          },
        ]}
      />
    </Card>
  );
};

export default Page;
