"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowRight, Loader2, Pencil, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Card as UiCard } from "@components/ui/card";
import { COHORT_STATUS_VARIANT } from "@constants/cohorts";
import { ApiError } from "@lib/api-client";
import { deleteCohort } from "../api";
import type { Cohort } from "@types";

export type RowProps = {
  cohort: Cohort;
  onEnrollments: (cohort: Cohort) => void;
  onEdit: (cohort: Cohort) => void;
  onDeleted?: () => void;
};

export const Row = ({ cohort, onEnrollments, onEdit, onDeleted }: RowProps) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete "${cohort.name}"? This cannot be undone.`)) return;
    setIsDeleting(true);
    try {
      await deleteCohort(cohort.id);
      toast.success("Cohort deleted");
      onDeleted?.();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Could not delete cohort. Please try again.";
      toast.error(message);
      setIsDeleting(false);
    }
  };

  return (
    <UiCard className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/cohorts/${cohort.id}`}
            className="font-medium hover:underline truncate"
          >
            {cohort.name}
          </Link>
          <Badge
            variant={COHORT_STATUS_VARIANT[cohort.status]}
            className="capitalize"
          >
            {cohort.status}
          </Badge>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {cohort.enrolledCount} / {cohort.capacity} students
          </span>
          {cohort.startDate && (
            <span>
              · {format(new Date(cohort.startDate), "MMM d, yyyy")}
              {cohort.endDate &&
                ` → ${format(new Date(cohort.endDate), "MMM d, yyyy")}`}
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/admin/cohorts/${cohort.id}`}>
            <ArrowRight className="h-3.5 w-3.5 mr-1.5" /> View
          </Link>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEnrollments(cohort)}
        >
          <Users className="h-3.5 w-3.5 mr-1.5" /> Enrollments
        </Button>
        <Button variant="outline" size="sm" onClick={() => onEdit(cohort)}>
          <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
    </UiCard>
  );
};
