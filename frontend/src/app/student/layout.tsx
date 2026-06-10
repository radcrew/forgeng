import { SidebarLayout } from "@components/layout/sidebar-layout";
import { SelectedCohortProvider } from "@providers";

const Layout = ({ children }: { children: React.ReactNode }) => (
  <SelectedCohortProvider>
    <SidebarLayout>{children}</SidebarLayout>
  </SelectedCohortProvider>
);

export default Layout;
