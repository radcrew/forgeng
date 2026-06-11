import type { Metadata } from "next";

import { SidebarLayout } from "@components/layout/sidebar-layout";
import { SelectedCohortProvider } from "@providers";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

const Layout = ({ children }: { children: React.ReactNode }) => (
  <SelectedCohortProvider>
    <SidebarLayout>{children}</SidebarLayout>
  </SelectedCohortProvider>
);

export default Layout;
