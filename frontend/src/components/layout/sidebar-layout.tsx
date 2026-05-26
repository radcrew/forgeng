"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CheckSquare,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { currentMockUser } from "@/lib/mock-data";
import type { UserRole } from "@/lib/types";

interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

const NAV_ITEMS_BY_ROLE: Record<UserRole, NavItem[]> = {
  applicant: [],
  student: [
    { title: "Dashboard", href: "/student", icon: LayoutDashboard },
    { title: "Tasks", href: "/student/tasks", icon: CheckSquare },
    { title: "Submissions", href: "/student/submissions", icon: FileText },
  ],
  mentor: [
    { title: "Dashboard", href: "/mentor", icon: LayoutDashboard },
    { title: "Review Queue", href: "/mentor/reviews", icon: ClipboardList },
  ],
  admin: [
    { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { title: "Applications", href: "/admin/applications", icon: FileText },
    { title: "Cohorts", href: "/admin/cohorts", icon: Users },
    { title: "Tasks", href: "/admin/tasks", icon: CheckSquare },
    { title: "Users", href: "/admin/users", icon: Settings },
  ],
};

interface SidebarLayoutProps {
  role: UserRole;
  children: React.ReactNode;
}

export function SidebarLayout({ role, children }: SidebarLayoutProps) {
  const pathname = usePathname() ?? "";
  const user = currentMockUser[role];
  const navItems = NAV_ITEMS_BY_ROLE[role];

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden w-full bg-background">
        <Sidebar className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
          <SidebarHeader className="p-4 border-b border-sidebar-border">
            <h2 className="font-bold text-lg tracking-tight">Forgeng</h2>
            <p className="text-sm text-sidebar-foreground/70 capitalize">
              {role} Portal
            </p>
          </SidebarHeader>

          <SidebarContent className="p-4">
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.href} className="flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-4 border-t border-sidebar-border">
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {user?.name ?? "User"}
                </span>
                <span className="text-xs text-sidebar-foreground/70">
                  {user?.email}
                </span>
              </div>
            </div>
            <Button
              asChild
              variant="outline"
              className="w-full justify-start gap-2 bg-transparent text-sidebar-foreground border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <Link href="/">
                <LogOut className="h-4 w-4" />
                Sign Out
              </Link>
            </Button>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 overflow-y-auto bg-background">{children}</main>
      </div>
    </SidebarProvider>
  );
}
