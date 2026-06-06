"use client";

import { useState } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { toast } from "sonner";

import { USER_ROLE_OPTIONS } from "@constants/users";
import { updateUserRole } from "@features/users";
import { ApiError } from "@lib/api-client";
import { Card } from "@components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import type { UserProfile, UserRole } from "@types";

export type RowProps = { user: UserProfile };

export const Row = ({ user }: RowProps) => {
  const [role, setRole] = useState<UserRole>(user.role);
  const [isSaving, setIsSaving] = useState(false);

  const handleRoleChange = async (next: string) => {
    const newRole = next as UserRole;
    if (newRole === role) return;

    const previous = role;
    setRole(newRole); // optimistic
    setIsSaving(true);
    try {
      await updateUserRole(user.id, newRole);
      toast.success(`Role updated to ${newRole}`);
    } catch (err) {
      setRole(previous); // revert on failure
      const message =
        err instanceof ApiError
          ? err.message
          : "Could not update role. Please try again.";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <div className="flex items-center gap-4 p-4">
        <Link
          href={`/admin/users/${user.id}`}
          className="flex flex-1 items-center gap-4 min-w-0 rounded-md text-left transition-colors hover:bg-accent/40 -m-1 p-1"
          aria-label={`View details for ${user.name ?? user.email}`}
        >
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
            {(user.name?.[0] ?? user.email[0]).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{user.name ?? "—"}</p>
            <p className="text-sm text-muted-foreground truncate">
              {user.email}
            </p>
            {user.githubUrl && (
              <p className="text-xs text-muted-foreground truncate">
                {user.githubUrl}
              </p>
            )}
          </div>
        </Link>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-muted-foreground hidden sm:block">
            {format(new Date(user.createdAt), "MMM d, yyyy")}
          </span>
          <Select
            value={role}
            onValueChange={handleRoleChange}
            disabled={isSaving}
          >
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
