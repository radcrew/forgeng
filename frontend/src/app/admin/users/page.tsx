"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockUsers } from "@/lib/mock-data";
import type { UserProfile, UserRole } from "@/lib/types";

type RoleFilter = UserRole | "all";

function UserRow({ user }: { user: UserProfile }) {
  const handleRoleChange = (newRole: string) => {
    toast.success(`Role updated to ${newRole}`);
  };

  return (
    <Card>
      <div className="flex items-center gap-4 p-4">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
          {(user.name?.[0] ?? user.email[0]).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{user.name ?? "—"}</p>
          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
          {user.githubUrl && (
            <p className="text-xs text-muted-foreground truncate">
              {user.githubUrl}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-muted-foreground hidden sm:block">
            {format(new Date(user.createdAt), "MMM d, yyyy")}
          </span>
          <Select defaultValue={user.role} onValueChange={handleRoleChange}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="applicant">Applicant</SelectItem>
              <SelectItem value="student">Student</SelectItem>
              <SelectItem value="mentor">Mentor</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  );
}

export default function AdminUsersPage() {
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");

  const users = useMemo(() => {
    if (roleFilter === "all") return mockUsers;
    return mockUsers.filter((u) => u.role === roleFilter);
  }, [roleFilter]);

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground mt-1">
          Manage platform users and their roles.
        </p>
      </div>

      <Tabs
        value={roleFilter}
        onValueChange={(v) => setRoleFilter(v as RoleFilter)}
      >
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="applicant">Applicants</TabsTrigger>
          <TabsTrigger value="student">Students</TabsTrigger>
          <TabsTrigger value="mentor">Mentors</TabsTrigger>
          <TabsTrigger value="admin">Admins</TabsTrigger>
        </TabsList>
      </Tabs>

      <p className="text-sm text-muted-foreground">{users.length} users</p>

      <div className="space-y-2">
        {users.map((user) => (
          <UserRow key={user.id} user={user} />
        ))}
      </div>
    </div>
  );
}
