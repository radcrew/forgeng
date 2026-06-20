import type { Metadata } from "next";

import { SignUpView } from "./sign-up-view";

export const metadata: Metadata = {
  title: "Create an Account",
  description:
    "Apply to Forgeng's mentor-led software engineering apprenticeship. Complete real projects, earn a monthly stipend, and grow into a professional engineer.",
};

const Page = () => <SignUpView />;

export default Page;
