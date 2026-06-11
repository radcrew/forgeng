import type { Metadata } from "next";

import { ForgotPasswordPage } from "./_forgot-password-page";

export const metadata: Metadata = {
  title: "Reset Your Password",
  description: "Request a link to reset your Forgeng account password.",
  robots: {
    index: false,
    follow: false,
  },
};

const Page = () => <ForgotPasswordPage />;

export default Page;
