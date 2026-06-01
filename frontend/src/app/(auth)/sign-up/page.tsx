"use client";

import { useRouter } from "next/navigation";
import { z } from "zod";
import { toast } from "sonner";

import { Card } from "@components/ui/card";
import { useCurrentUser } from "@contexts";
import { AuthCardContent, AuthCardHeader } from "@features/auth";
import { ApiError } from "@lib/api-client";

const schema = z.object({
  firstName: z.string().trim().min(1, "First name is required.").max(80),
  lastName: z.string().trim().min(1, "Last name is required.").max(80),
  email: z.email("Enter a valid email.").max(254),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(72, "Password is too long.")
    .regex(/[A-Za-z]/, "Password must contain a letter.")
    .regex(/\d/, "Password must contain a digit."),
});

type FormValues = z.infer<typeof schema>;

const Page = () => {
  const router = useRouter();
  const { register } = useCurrentUser();

  const handleSubmit = async (values: FormValues) => {
    try {
      const name = `${values.firstName} ${values.lastName}`.trim();
      await register({
        email: values.email,
        password: values.password,
        name,
      });
      toast.success("Account created. Check your email to verify.");
      router.push(
        `/sign-up/check-email?email=${encodeURIComponent(values.email)}`,
      );
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        toast.error("That email is already registered. Try signing in.");
      } else if (err instanceof ApiError) {
        toast.error(err.message || "Could not create account.");
      } else {
        toast.error("Could not reach the API. Is the backend running?");
      }
    }
  };

  return (
    <Card className="w-full max-w-md">
      <AuthCardHeader
        title="Create your account"
        description="Already applied? Sign in to track your status."
      />
      <AuthCardContent<FormValues>
        oauthLabel="Sign up"
        schema={schema}
        defaultValues={{ firstName: "", lastName: "", email: "", password: "" }}
        onSubmit={handleSubmit}
        submitLabel="Create Account"
        pendingLabel="Creating account…"
        prompt={{
          text: "Already have an account?",
          linkText: "Sign in",
          href: "/sign-in",
        }}
        fields={[
          [
            {
              name: "firstName",
              label: "First name",
              autoComplete: "given-name",
              placeholder: "Jane",
            },
            {
              name: "lastName",
              label: "Last name",
              autoComplete: "family-name",
              placeholder: "Doe",
            },
          ],
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
            autoComplete: "new-password",
            placeholder: "••••••••",
          },
        ]}
      />
    </Card>
  );
};

export default Page;
