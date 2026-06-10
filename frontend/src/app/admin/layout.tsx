import { SidebarLayout } from "@components/layout/sidebar-layout";

const Layout = ({ children }: { children: React.ReactNode }) => (
  <SidebarLayout>{children}</SidebarLayout>
);

export default Layout;
