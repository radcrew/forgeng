import type { Metadata } from "next";

import { ApplicationStatusView } from "./status-view";

export const metadata: Metadata = {
  title: "Application Status",
  robots: {
    index: false,
    follow: false,
  },
};

const Page = () => <ApplicationStatusView />;

export default Page;
