"use client";

import { useState } from "react";
import { toast } from "sonner";

import { FormDialog, SectionTitle } from "@components/common";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { USER_ROLE_OPTIONS } from "@constants/users";
import { updateUserRole } from "@features/users/api";
import { ApiError } from "@lib/api-client";
import type { UserRole } from "@types";

const roleLabel = (role: UserRole) =>
  USER_ROLE_OPTIONS.find((o) => o.value === role)?.label ?? role;

export type RoleControlProps = {
  userId: number;
  userName: string;
  role: UserRole;
  /** Called after the role changed, so the page can load the user again. */
  onChanged: () => void;
};

export const RoleControl = ({
  userId,
  userName,
  role,
  onChanged,
}: RoleControlProps) => {
  const [nextRole, setNextRole] = useState<UserRole>(role);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleConfirm = async () => {
    setSaving(true);
    try {
      await updateUserRole(userId, nextRole);
      toast.success(`${userName} is now ${roleLabel(nextRole).toLowerCase()}.`);
      setConfirmOpen(false);
      onChanged();
    } catch (err) {
      // For example "This is the only admin…" from the server.
      toast.error(
        err instanceof ApiError ? err.message : "Could not change the role.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <SectionTitle>Role</SectionTitle>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="capitalize">
          {roleLabel(role)}
        </Badge>
        <Select
          value={nextRole}
          onValueChange={(v) => setNextRole(v as UserRole)}
        >
          <SelectTrigger className="h-8 w-36" aria-label="New role">
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
        <Button
          size="sm"
          variant="outline"
          disabled={nextRole === role}
          onClick={() => setConfirmOpen(true)}
        >
          Change role
        </Button>
      </div>

      <FormDialog
        open={confirmOpen}
        onOpenChange={(open) => !saving && setConfirmOpen(open)}
        title={`Change ${userName}'s role?`}
        size="sm"
        actions={{
          onSubmit: () => void handleConfirm(),
          submitLabel: "Change role",
          loadingLabel: "Changing...",
          isLoading: saving,
        }}
      >
        <p className="text-sm text-muted-foreground">
          From {roleLabel(role)} to {roleLabel(nextRole)}. They will be signed
          out and need to sign in again.
        </p>
      </FormDialog>
    </div>
  );
};
