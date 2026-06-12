import type { Metadata } from "next";

import { CheckEmailView } from "./check-email-view";

export const metadata: Metadata = {
  title: "Check Your Email",
  robots: {
    index: false,
    follow: false,
  },
};

const Page = () => <CheckEmailView />;

export default Page;
