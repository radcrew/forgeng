import type { Metadata } from "next";

import { SignInView } from "./sign-in-view";

export const metadata: Metadata = {
  title: "Sign In",
  description:
    "Sign in to your Forgeng account to track your application, view your cohort, and access your apprenticeship dashboard.",
};

const Page = () => <SignInView />;

export default Page;
