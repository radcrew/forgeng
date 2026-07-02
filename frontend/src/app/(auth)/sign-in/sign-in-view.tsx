"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { toast } from "sonner";

import { useCurrentUser } from "@contexts";
import { AuthCard } from "@features/auth";
import { ApiError } from "@lib/api-client";
import { accessRestrictionReason, homeForRole } from "@utils/auth";

const schema = z.object({
  email: z.email("Enter a valid email."),
  password: z.string().min(1, "Enter your password."),
});

type FormValues = z.infer<typeof schema>;

export const SignInView = () => {
  const router = useRouter();
  const { login, user } = useCurrentUser();

  // OAuth (Google/GitHub) lands back here via a server-side redirect chain
  // (/api/auth/exchange -> /auth/callback) that can bounce to /sign-in if its
  // own cookie check misses, even though the session is actually valid. The
  // rehydrate in CurrentUserProvider then confirms it via /account/me, which
  // updates `user` — so once that happens, finish the job client-side.
  useEffect(() => {
    if (user) {
      router.replace(homeForRole(user.role));
    }
  }, [user, router]);

  const handleSubmit = async (values: FormValues) => {
    try {
      const user = await login(values.email, values.password);
      toast.success(`Signed in as ${user.name ?? user.email}.`);
      router.push(homeForRole(user.role));
    } catch (err) {
      const restriction = accessRestrictionReason(err);
      if (restriction) {
        router.push(`/unavailable?reason=${restriction}`);
        return;
      }
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
    }
  };

  return (
    <AuthCard>
      <AuthCard.Header
        title="Welcome back"
        description="Sign in to continue to your portal."
      />
      <AuthCard.Content
        oauthLabel="Sign in"
        schema={schema}
        defaultValues={{ email: "", password: "" }}
        onSubmit={handleSubmit}
        submitLabel="Sign In"
        pendingLabel="Signing in…"
        prompt={{
          text: "New here?",
          linkText: "Create an account",
          href: "/sign-up",
        }}
        fields={[
          {
            name: "email",
            label: "Email",
            type: "email",
            autoComplete: "email",
            placeholder: "you@example.com",
          },
          {
            name: "password",
            label: "Password",
            type: "password",
            autoComplete: "current-password",
            placeholder: "••••••••",
            labelAction: (
              <Link
                href="/forgot-password"
                className="text-sm text-primary font-medium hover:underline"
              >
                Forgot password?
              </Link>
            ),
          },
        ]}
      />
    </AuthCard>
  );
};
