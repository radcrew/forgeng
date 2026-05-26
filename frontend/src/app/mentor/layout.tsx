import { SidebarLayout } from "@/components/layout/sidebar-layout";

export default function MentorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SidebarLayout role="mentor">{children}</SidebarLayout>;
}
