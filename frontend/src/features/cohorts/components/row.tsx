"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Loader2, Pencil, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Card as UiCard } from "@components/ui/card";
import { COHORT_STATUS_VARIANT } from "@constants/cohorts";
import { FormDialog } from "@components/common";
import { ApiError } from "@lib/api-client";
import { deleteCohort } from "../api";
import type { Cohort } from "@types";

export type CohortRowProps = {
  cohort: Cohort;
  onEdit: (cohort: Cohort) => void;
  onDeleted?: () => void;
};

export const CohortRow = ({ cohort, onEdit, onDeleted }: CohortRowProps) => {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const detailHref = `/admin/cohorts/${cohort.id}`;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteCohort(cohort.id);
      toast.success("Cohort deleted");
      setConfirmOpen(false);
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
    <>
      <UiCard
        onClick={() => router.push(detailHref)}
        className="flex cursor-pointer flex-col gap-3 p-4 transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href={detailHref}
              onClick={(e) => e.stopPropagation()}
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
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(cohort);
            }}
            aria-label="Edit cohort"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              setConfirmOpen(true);
            }}
            disabled={isDeleting}
            aria-label="Delete cohort"
          >
            {isDeleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </UiCard>

      {/* Kept outside the card: clicks inside a dialog still reach its React
        parent, and the card opens the cohort page on click. */}
      <FormDialog
        open={confirmOpen}
        onOpenChange={(open) => !isDeleting && setConfirmOpen(open)}
        title={`Delete "${cohort.name}"?`}
        size="sm"
        actions={{
          onSubmit: () => void handleDelete(),
          submitLabel: "Delete cohort",
          loadingLabel: "Deleting...",
          isLoading: isDeleting,
          submitVariant: "destructive",
        }}
      >
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>This also deletes, for good:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              {cohort.enrolledCount === 1
                ? "1 student's enrollment"
                : `${cohort.enrolledCount} students' enrollments`}
            </li>
            <li>All of the cohort&apos;s tasks</li>
            <li>Every submission and piece of feedback for those tasks</li>
          </ul>
          <p className="font-medium text-destructive">This cannot be undone.</p>
        </div>
      </FormDialog>
    </>
  );
};
