"use client";

import { format } from "date-fns";
import { toast } from "sonner";

import { USER_ROLE_OPTIONS } from "@constants/users";
import { Card } from "@components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import type { UserProfile } from "@types";

export type AdminUserRowProps = { user: UserProfile };

export const AdminUserRow = ({ user }: AdminUserRowProps) => {
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
              {USER_ROLE_OPTIONS.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  );
};
