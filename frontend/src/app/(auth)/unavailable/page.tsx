import type { Metadata } from "next";

import { UnavailablePage } from "./_unavailable-page";

export const metadata: Metadata = {
  title: "Unavailable",
  robots: {
    index: false,
    follow: false,
  },
};

const Page = () => <UnavailablePage />;

export default Page;
