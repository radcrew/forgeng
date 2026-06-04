import { SidebarLayout } from "@components/layout/sidebar-layout";
import { RoleGuard } from "@lib/auth";
import { SelectedCohortProvider } from "@providers";

const Layout = ({ children }: { children: React.ReactNode }) => (
  <RoleGuard allowedRoles={["student"]}>
    <SelectedCohortProvider>
      <SidebarLayout>{children}</SidebarLayout>
    </SelectedCohortProvider>
  </RoleGuard>
);

export default Layout;
