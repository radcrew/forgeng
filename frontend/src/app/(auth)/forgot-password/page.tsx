import type { Metadata } from "next";

import { ForgotPasswordView } from "./forgot-password-view";

export const metadata: Metadata = {
  title: "Reset Your Password",
  description: "Request a link to reset your Forgeng account password.",
  robots: {
    index: false,
    follow: false,
  },
};

const Page = () => <ForgotPasswordView />;

export default Page;
