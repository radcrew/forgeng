import { SidebarLayout } from "@/components/layout/sidebar-layout";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SidebarLayout role="student">{children}</SidebarLayout>;
}
