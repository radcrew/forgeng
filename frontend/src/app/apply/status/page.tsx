import type { Metadata } from "next";

import { ApplicationStatusPage } from "./_status-page";

export const metadata: Metadata = {
  title: "Application Status",
  robots: {
    index: false,
    follow: false,
  },
};

const Page = () => <ApplicationStatusPage />;

export default Page;
