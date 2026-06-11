import type { Metadata } from "next";

import { CheckEmailPage } from "./_check-email-page";

export const metadata: Metadata = {
  title: "Check Your Email",
  robots: {
    index: false,
    follow: false,
  },
};

const Page = () => <CheckEmailPage />;

export default Page;
