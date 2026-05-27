import { SidebarLayout } from "@components/layout/sidebar-layout";
import { RoleGuard } from "@lib/auth";

const Layout = ({ children }: { children: React.ReactNode }) => (
  <RoleGuard allowedRoles={["student"]}>
    <SidebarLayout>{children}</SidebarLayout>
  </RoleGuard>
);

export default Layout;
