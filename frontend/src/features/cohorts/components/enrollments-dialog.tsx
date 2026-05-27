"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";

import {
  ContentDialog,
  FormBody,
  FormField,
  ListRow,
} from "@components/common";
import { Button } from "@components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { Separator } from "@components/ui/separator";
import { useEnrollments, useUsers } from "@hooks";
import type { Cohort } from "@types";

export type EnrollmentsDialogProps = {
  cohort: Cohort;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const EnrollmentsDialog = ({
  cohort,
  open,
  onOpenChange,
}: EnrollmentsDialogProps) => {
  const { data: enrollments = [] } = useEnrollments(cohort.id);
  const { data: students = [] } = useUsers("student");
  const enrolledIds = new Set(enrollments.map((e) => e.userId));
  const availableStudents = students.filter((u) => !enrolledIds.has(u.id));

  const [userId, setUserId] = useState("");
  const [isEnrolling, setIsEnrolling] = useState(false);

  const handleEnroll = async () => {
    if (!userId) return;
    setIsEnrolling(true);
    await new Promise((resolve) => setTimeout(resolve, 400));
    setIsEnrolling(false);
    toast.success("Student enrolled!");
    setUserId("");
  };

  return (
    <ContentDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`${cohort.name} — Enrollments`}
    >
      <FormBody>
        <p className="text-sm text-muted-foreground">
          {enrollments.length} enrolled
        </p>

        {enrollments.length > 0 ? (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {enrollments.map((e) => (
              <ListRow
                key={e.id}
                title={e.user?.name ?? e.user?.email ?? "Unknown"}
                subtitle={`Enrolled ${format(new Date(e.enrolledAt), "MMM d, yyyy")}`}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No students enrolled yet.
          </p>
        )}

        {availableStudents.length > 0 && (
          <>
            <Separator />
            <FormField label="Enroll a Student">
              <div className="flex gap-2">
                <Select value={userId} onValueChange={setUserId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select student..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStudents.map((u) => (
                      <SelectItem key={u.id} value={u.id.toString()}>
                        {u.name ?? u.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleEnroll} disabled={!userId || isEnrolling}>
                  Enroll
                </Button>
              </div>
            </FormField>
          </>
        )}
      </FormBody>
    </ContentDialog>
  );
};
