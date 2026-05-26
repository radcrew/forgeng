import { SidebarLayout } from "@components/layout/sidebar-layout";
import { RoleGuard } from "@lib/auth";

export default function MentorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["mentor"]}>
      <SidebarLayout>{children}</SidebarLayout>
    </RoleGuard>
  );
}
