"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  CheckSquare,
  ClipboardList,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  User,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Logo } from "@components/brand/logo";
import { Button } from "@components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  useSidebar,
} from "@components/ui/sidebar";
import { useCurrentUser } from "@contexts";
import { NotificationBell } from "@features/notifications";
import type { UserRole } from "@types";

interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

const NAV_ITEMS_BY_ROLE: Record<UserRole, NavItem[]> = {
  applicant: [],
  student: [
    { title: "Dashboard", href: "/student", icon: LayoutDashboard },
    { title: "Cohort", href: "/student/cohort", icon: GraduationCap },
    { title: "Tasks", href: "/student/tasks", icon: CheckSquare },
    { title: "Submissions", href: "/student/submissions", icon: FileText },
    { title: "Notifications", href: "/student/notifications", icon: Bell },
    { title: "Profile", href: "/student/profile", icon: User },
  ],
  admin: [
    { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { title: "Applications", href: "/admin/applications", icon: FileText },
    { title: "Review Queue", href: "/admin/reviews", icon: ClipboardList },
    { title: "Cohorts", href: "/admin/cohorts", icon: Users },
    { title: "Tasks", href: "/admin/tasks", icon: CheckSquare },
    { title: "Users", href: "/admin/users", icon: Settings },
  ],
};

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const { user, logout } = useCurrentUser();

  // The role guard above us has already short-circuited if `user` is null.
  // This fallback keeps types honest for the rare race during navigation.
  const role: UserRole = user?.role ?? "applicant";
  const navItems = NAV_ITEMS_BY_ROLE[role];

  // Pick the most-specific matching nav item so a parent route
  // doesn't stay highlighted when the user is on a child path.
  const activeHref = navItems
    .filter(
      (item) =>
        pathname === item.href || pathname.startsWith(`${item.href}/`),
    )
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  const handleSignOut = async () => {
    await logout();
    router.push("/");
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden w-full bg-background">
        <Sidebar className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
          <SidebarHeader className="p-4 border-b border-sidebar-border">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Logo size={28} priority />
                <h2 className="font-bold text-lg tracking-tight">Forgeng</h2>
              </div>
              {role === "student" && <NotificationBell />}
            </div>
            <p className="text-sm text-sidebar-foreground/70 capitalize mt-2">
              {role} Portal
            </p>
          </SidebarHeader>

          <SidebarContent className="p-4">
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = item.href === activeHref;
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
              type="button"
              variant="outline"
              onClick={handleSignOut}
              className="w-full justify-start gap-2 bg-transparent text-sidebar-foreground border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 overflow-y-auto bg-background">
          <MobileTopBar role={role} />
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}

/**
 * Mobile-only top bar. On desktop the sidebar is always visible; below `md`
 * it collapses to an offcanvas sheet, so this exposes a hamburger to open it.
 */
function MobileTopBar({ role }: { role: UserRole }) {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Open menu"
        onClick={toggleSidebar}
      >
        <Menu className="h-5 w-5" />
      </Button>
      <div className="flex items-center gap-2">
        <Logo size={24} />
        <span className="font-bold tracking-tight">Forgeng</span>
      </div>
      {role === "student" && (
        <div className="ml-auto">
          <NotificationBell />
        </div>
      )}
    </header>
  );
}
