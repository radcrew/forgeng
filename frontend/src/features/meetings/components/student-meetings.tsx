"use client";

import { useState } from "react";
import Link from "next/link";
import { Video } from "lucide-react";
import { toast } from "sonner";

import { FormDialog, LoadingState, SectionTitle } from "@components/common";
import { ErrorState } from "@components/shared";
import { Button } from "@components/ui/button";
import { useCurrentUser } from "@contexts";
import { ApiError } from "@lib/api-client";

import { cancelMeeting } from "../api";
import { useGoogleCalendarStatus, useMeetings } from "../hooks";
import { formatMeetingTime } from "../time";
import type { Meeting } from "../types";
import { MeetingDialog } from "./meeting-dialog";

export type StudentMeetingsProps = {
  studentId: number;
  studentName: string;
};

/**
 * Upcoming meetings with one student, from every mentor, on the admin's
 * student page. Only the mentor who scheduled a meeting can move or cancel
 * it, because the event lives in their own Google Calendar.
 */
export const StudentMeetings = ({
  studentId,
  studentName,
}: StudentMeetingsProps) => {
  const { user: me } = useCurrentUser();
  const meetings = useMeetings(studentId);
  const calendar = useGoogleCalendarStatus();

  // A new dialog, or the meeting being moved.
  const [editing, setEditing] = useState<Meeting | "new" | null>(null);
  const [cancelling, setCancelling] = useState<Meeting | null>(null);
  const [cancelPending, setCancelPending] = useState(false);

  const canSchedule =
    !!calendar.data?.connected && !calendar.data.broken;

  const handleCancel = async () => {
    if (!cancelling) return;
    setCancelPending(true);
    try {
      await cancelMeeting(cancelling.id);
      toast.success(`Meeting cancelled. Google emailed ${studentName}.`);
      setCancelling(null);
      meetings.refetch();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to cancel the meeting.",
      );
    } finally {
      setCancelPending(false);
    }
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <SectionTitle className="mb-0">Meetings</SectionTitle>
        {canSchedule && (
          <Button size="sm" variant="outline" onClick={() => setEditing("new")}>
            Schedule a meeting
          </Button>
        )}
      </div>

      {/* Why there is no schedule button. Hidden while the status loads. */}
      {calendar.data && !canSchedule && (
        <p className="mb-2 text-xs text-muted-foreground">
          {!calendar.data.configured ? (
            "Google Calendar is not set up on this server, so meetings can't be scheduled yet."
          ) : (
            <>
              {calendar.data.broken
                ? "Your Google Calendar connection stopped working. "
                : "To schedule a meeting, connect your Google Calendar first. "}
              <Link
                href="/admin/settings"
                className="underline underline-offset-2 hover:text-foreground"
              >
                Open Settings
              </Link>
            </>
          )}
        </p>
      )}

      {meetings.isLoading ? (
        <LoadingState message="Loading meetings…" />
      ) : meetings.error ? (
        // A failed load must not read as "no meetings".
        <ErrorState
          what="the meetings"
          onRetry={meetings.refetch}
          size="compact"
        />
      ) : !meetings.data || meetings.data.length === 0 ? (
        <p className="text-sm text-muted-foreground">No upcoming meetings.</p>
      ) : (
        <div className="space-y-2">
          {meetings.data.map((meeting) => {
            const mine = meeting.host.id === me?.id;
            return (
              <div key={meeting.id} className="rounded-lg bg-muted/50 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {meeting.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatMeetingTime(meeting.startsAt, meeting.endsAt)}
                      {" · "}
                      {mine ? "You" : (meeting.host.name ?? "Another mentor")}
                    </p>
                  </div>
                  {meeting.meetUrl && (
                    <a
                      href={meeting.meetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                    >
                      <Video className="h-3.5 w-3.5" />
                      Meet link
                    </a>
                  )}
                </div>
                {mine && (
                  <div className="mt-2 flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditing(meeting)}
                    >
                      Reschedule
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setCancelling(meeting)}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <MeetingDialog
          // A new key fills the form again for each meeting.
          key={editing === "new" ? "new" : editing.id}
          open
          onOpenChange={(open) => !open && setEditing(null)}
          studentId={studentId}
          studentName={studentName}
          meeting={editing === "new" ? undefined : editing}
          onSaved={meetings.refetch}
        />
      )}

      <FormDialog
        open={!!cancelling}
        onOpenChange={(open) => !cancelPending && !open && setCancelling(null)}
        title="Cancel this meeting?"
        size="sm"
        actions={{
          onSubmit: () => void handleCancel(),
          submitLabel: "Cancel meeting",
          // Not "Cancel", which would read like the other button.
          cancelLabel: "Keep meeting",
          loadingLabel: "Cancelling...",
          isLoading: cancelPending,
          submitVariant: "destructive",
        }}
      >
        <p className="text-sm text-muted-foreground">
          It is removed from your Google Calendar, and Google emails{" "}
          {studentName} that it was cancelled.
        </p>
      </FormDialog>
    </div>
  );
};
