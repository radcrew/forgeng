import { SidebarLayout } from "@/components/layout/sidebar-layout";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SidebarLayout role="admin">{children}</SidebarLayout>;
}
