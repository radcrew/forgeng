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
import { useUsers } from "@features/users";
import { ApiError } from "@lib/api-client";
import { enrollStudent } from "../api";
import { useEnrollments } from "../hooks";
import type { Cohort } from "@types";

export type EnrollmentsProps = {
  cohort: Cohort;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEnrolled?: () => void;
};

export const Enrollments = ({
  cohort,
  open,
  onOpenChange,
  onEnrolled,
}: EnrollmentsProps) => {
  const { data: enrollments = [], refetch } = useEnrollments(cohort.id);
  // Pull a large page so the enrollment picker lists every student to choose
  // from, not just the first page of the paginated users endpoint.
  const { data: studentPage } = useUsers("student", 1, 100);
  const students = studentPage?.items ?? [];
  const enrolledIds = new Set(enrollments.map((e) => e.userId));
  const availableStudents = students.filter((u) => !enrolledIds.has(u.id));

  const [userId, setUserId] = useState("");
  const [isEnrolling, setIsEnrolling] = useState(false);

  const handleEnroll = async () => {
    if (!userId) return;
    setIsEnrolling(true);
    try {
      await enrollStudent(cohort.id, Number(userId));
      toast.success("Student enrolled!");
      setUserId("");
      refetch();
      onEnrolled?.();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Could not enroll student. Please try again.";
      toast.error(message);
    } finally {
      setIsEnrolling(false);
    }
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
