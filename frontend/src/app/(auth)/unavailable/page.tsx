import type { Metadata } from "next";

import { UnavailableView } from "./unavailable-view";

export const metadata: Metadata = {
  title: "Unavailable",
  robots: {
    index: false,
    follow: false,
  },
};

const Page = () => <UnavailableView />;

export default Page;
