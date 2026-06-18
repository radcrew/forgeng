import type { Metadata } from "next";

import { SidebarLayout } from "@components/layout/sidebar-layout";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

const Layout = ({ children }: { children: React.ReactNode }) => (
  <SidebarLayout>{children}</SidebarLayout>
);

export default Layout;
