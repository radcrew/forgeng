import type { Metadata } from "next";

import { SignInPage } from "./_sign-in-page";

export const metadata: Metadata = {
  title: "Sign In",
  description:
    "Sign in to your Forgeng account to track your application, view your cohort, and access your apprenticeship dashboard.",
};

const Page = () => <SignInPage />;

export default Page;
