"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowRight, Loader2, Pencil, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import {
  Card as UiCard,
  CardContent,
  CardHeader,
  CardTitle,
} from "@components/ui/card";
import { COHORT_STATUS_VARIANT } from "@constants/cohorts";
import { ApiError } from "@lib/api-client";
import { deleteCohort } from "../api";
import type { Cohort } from "@types";

export type CardProps = {
  cohort: Cohort;
  onEnrollments: (cohort: Cohort) => void;
  onEdit: (cohort: Cohort) => void;
  onDeleted?: () => void;
};

export const Card = ({
  cohort,
  onEnrollments,
  onEdit,
  onDeleted,
}: CardProps) => {
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
    <UiCard>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{cohort.name}</CardTitle>
          <Badge
            variant={COHORT_STATUS_VARIANT[cohort.status]}
            className="capitalize"
          >
            {cohort.status}
          </Badge>
        </div>
        {cohort.description && (
          <p className="text-sm text-muted-foreground">{cohort.description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>
            {cohort.enrolledCount} / {cohort.capacity} students
          </span>
        </div>
        {cohort.startDate && (
          <p className="text-sm text-muted-foreground">
            {format(new Date(cohort.startDate), "MMM d, yyyy")}
            {cohort.endDate &&
              ` → ${format(new Date(cohort.endDate), "MMM d, yyyy")}`}
          </p>
        )}
        <div className="flex gap-2 pt-2">
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
      </CardContent>
    </UiCard>
  );
};
