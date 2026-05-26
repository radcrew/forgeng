import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { RoleGuard } from "@/lib/auth";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["student"]}>
      <SidebarLayout>{children}</SidebarLayout>
    </RoleGuard>
  );
}
