import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { RoleGuard } from "@/lib/auth";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["admin"]}>
      <SidebarLayout>{children}</SidebarLayout>
    </RoleGuard>
  );
}
