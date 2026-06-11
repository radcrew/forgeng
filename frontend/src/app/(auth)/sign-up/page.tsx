import type { Metadata } from "next";

import { SignUpPage } from "./_sign-up-page";

export const metadata: Metadata = {
  title: "Create an Account",
  description:
    "Apply to Forgeng's mentor-led software engineering apprenticeship. Complete real projects, earn a monthly stipend, and grow into a professional engineer.",
};

const Page = () => <SignUpPage />;

export default Page;
