"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { Textarea } from "@components/ui/textarea";
import { APPLICATION_STATUS_OPTIONS } from "@constants/applications";
import { ApiError } from "@lib/api-client";
import type { ApplicationStatus } from "../types";
import { useUpdateApplicationStatus } from "../hooks";

export type ApplicationReviewPanelProps = {
  applicationId: number;
  initialStatus: ApplicationStatus;
  initialNote: string;
};

export function ApplicationReviewPanel({
  applicationId,
  initialStatus,
  initialNote,
}: ApplicationReviewPanelProps) {
  const [status, setStatus] = useState<ApplicationStatus>(initialStatus);
  const [savedStatus, setSavedStatus] =
    useState<ApplicationStatus>(initialStatus);
  const [note, setNote] = useState(initialNote);
  const { update, isPending } = useUpdateApplicationStatus();
  // Accepting or rejecting is final; only the note can change afterwards.
  const isDecided = savedStatus !== "pending";

  const handleSave = async () => {
    try {
      await update(applicationId, {
        status,
        reviewerNote: note || null,
      });
      setSavedStatus(status);
      toast.success("Application updated");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to update application",
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Review</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <p className="text-sm font-medium">Status</p>
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as ApplicationStatus)}
            disabled={isDecided}
          >
            <SelectTrigger aria-label="Status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {APPLICATION_STATUS_OPTIONS.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {isDecided
              ? "This application has been decided, so its status can't be changed."
              : "Accepting or rejecting is final and can't be undone."}
          </p>
        </div>

        <div className="space-y-1.5">
          <p className="text-sm font-medium">Reviewer Note</p>
          <Textarea
            placeholder="Internal notes…"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <Button className="w-full" onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving…" : "Save"}
        </Button>
      </CardContent>
    </Card>
  );
}
