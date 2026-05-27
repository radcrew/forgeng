"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";

import { Button } from "@components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";
import { Label } from "@components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { Textarea } from "@components/ui/textarea";
import { useCohorts } from "@features/cohorts";

import { useUpdateApplicationStatus } from "../hooks";
import type { Application, ApplicationStatus } from "@types";

interface ApplicationDetailDialogProps {
  application: Application;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApplicationDetailDialog({
  application,
  open,
  onOpenChange,
}: ApplicationDetailDialogProps) {
  const { data: cohorts = [] } = useCohorts();
  const { update, isPending } = useUpdateApplicationStatus();

  const [status, setStatus] = useState<ApplicationStatus>(application.status);
  const [reviewerNote, setReviewerNote] = useState(
    application.reviewerNote ?? "",
  );
  const [cohortId, setCohortId] = useState<string>(
    application.cohortId?.toString() ?? "",
  );

  const handleSave = async () => {
    try {
      await update(application.id, {
        status,
        reviewerNote: reviewerNote || null,
        cohortId:
          status === "accepted" && cohortId ? Number.parseInt(cohortId, 10) : null,
      });
      toast.success("Application updated");
      onOpenChange(false);
    } catch {
      toast.error("Failed to update application");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>
            {application.firstName} {application.lastName}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5 py-2">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Email</p>
              <p className="font-medium">{application.email}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Applied</p>
              <p className="font-medium">
                {format(new Date(application.createdAt), "MMM d, yyyy")}
              </p>
            </div>
          </div>

          {application.motivation && (
            <div>
              <p className="text-sm font-semibold mb-1">Motivation</p>
              <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                {application.motivation}
              </p>
            </div>
          )}

          {application.background && (
            <div>
              <p className="text-sm font-semibold mb-1">Background</p>
              <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                {application.background}
              </p>
            </div>
          )}

          {application.experience && (
            <div>
              <p className="text-sm font-semibold mb-1">Experience</p>
              <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                {application.experience}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as ApplicationStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="reviewing">Reviewing</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {status === "accepted" && cohorts.length > 0 && (
            <div className="space-y-2">
              <Label>Assign to Cohort</Label>
              <Select value={cohortId} onValueChange={setCohortId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a cohort..." />
                </SelectTrigger>
                <SelectContent>
                  {cohorts.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Reviewer Note</Label>
            <Textarea
              placeholder="Internal notes about this application..."
              rows={3}
              value={reviewerNote}
              onChange={(e) => setReviewerNote(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
