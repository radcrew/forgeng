"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { toast } from "sonner";

import { Card } from "@components/ui/card";
import { useCurrentUser } from "@contexts";
import { AuthCardContent, AuthCardHeader } from "@features/auth";
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

  const handleSubmit = async (values: FormValues) => {
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
    }
  };

  return (
    <Card className="w-full max-w-md">
      <AuthCardHeader
        title="Welcome back"
        description="Sign in to continue to your portal."
      />
      <AuthCardContent<FormValues>
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
    </Card>
  );
};

export default Page;
