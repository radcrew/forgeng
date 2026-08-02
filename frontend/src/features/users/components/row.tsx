"use client";

import { format } from "date-fns";
import Link from "next/link";

import { Avatar } from "@components/ui/avatar";
import { Card } from "@components/ui/card";
import type { UserProfile } from "@types";

export type UserRowProps = { user: UserProfile };

export const UserRow = ({ user }: UserRowProps) => {
  return (
    <Card>
      <div className="flex items-center gap-4 p-4">
        <Link
          href={`/admin/users/${user.id}`}
          className="flex flex-1 items-center gap-4 min-w-0"
          aria-label={`View details for ${user.name ?? user.email}`}
        >
          <Avatar src={user.avatarUrl} name={user.name} email={user.email} />
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
        <span className="text-xs text-muted-foreground hidden shrink-0 sm:block">
          {format(new Date(user.createdAt), "MMM d, yyyy")}
        </span>
      </div>
    </Card>
  );
};
