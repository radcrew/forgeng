"use client";

import { useState } from "react";
import { toast } from "sonner";

import { FormDialog } from "@components/common";
import { DateInput } from "@components/ui/date-input";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { Textarea } from "@components/ui/textarea";
import { ApiError } from "@lib/api-client";

import { rescheduleMeeting, scheduleMeeting } from "../api";
import {
  durationMinutes,
  fromInputs,
  localTimeZone,
  toDateInput,
  toTimeInput,
} from "../time";
import type { Meeting } from "../types";

const DURATIONS = [15, 30, 45, 60, 90] as const;
const DEFAULT_DURATION = 30;

export type MeetingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Who the meeting is with. */
  studentId: number;
  studentName: string;
  /** Set to change this meeting. Left out schedules a new one. */
  meeting?: Meeting;
  onSaved: () => void;
};

/**
 * Schedules a meeting with a student, or moves one. The form uses the
 * admin's own time zone.
 */
export const MeetingDialog = ({
  open,
  onOpenChange,
  studentId,
  studentName,
  meeting,
  onSaved,
}: MeetingDialogProps) => {
  const [title, setTitle] = useState(meeting?.title ?? "Mentoring call");
  const [date, setDate] = useState(
    meeting ? toDateInput(new Date(meeting.startsAt)) : "",
  );
  const [time, setTime] = useState(
    meeting ? toTimeInput(new Date(meeting.startsAt)) : "",
  );
  const [duration, setDuration] = useState(
    meeting
      ? durationMinutes(meeting.startsAt, meeting.endsAt)
      : DEFAULT_DURATION,
  );
  const [note, setNote] = useState(meeting?.note ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // A moved meeting may have a length that isn't in the list.
  const durations = DURATIONS.includes(duration as (typeof DURATIONS)[number])
    ? DURATIONS
    : [...DURATIONS, duration].sort((a, b) => a - b);

  const handleSubmit = async () => {
    const startsAt = fromInputs(date, time);
    if (!title.trim()) {
      setError("Enter a title.");
      return;
    }
    if (!startsAt) {
      setError("Pick a date and a start time.");
      return;
    }
    // Only a new start time must be in the future. So a meeting that has
    // started can still be made longer, or get a new note.
    const startChanged =
      !meeting || startsAt.getTime() !== new Date(meeting.startsAt).getTime();
    if (startChanged && startsAt.getTime() <= Date.now()) {
      setError("Pick a time in the future.");
      return;
    }
    setError("");

    const fields = {
      title: title.trim(),
      note: note.trim() || null,
      startsAt: startsAt.toISOString(),
      durationMinutes: duration,
    };
    setSaving(true);
    try {
      if (meeting) {
        await rescheduleMeeting(meeting.id, fields);
        toast.success(`Meeting moved. Google emailed ${studentName}.`);
      } else {
        await scheduleMeeting({ ...fields, attendeeId: studentId });
        toast.success(`Meeting scheduled. Google emailed ${studentName} the invite.`);
      }
      onOpenChange(false);
      onSaved();
    } catch (err) {
      // For example "Connect your Google Calendar first."
      toast.error(
        err instanceof ApiError ? err.message : "Failed to save the meeting.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDialog
      open={open}
      // Stays open while saving, so the admin sees whether it worked.
      onOpenChange={(next) => !saving && onOpenChange(next)}
      title={
        meeting ? "Move the meeting" : `Schedule a meeting with ${studentName}`
      }
      actions={{
        onSubmit: () => void handleSubmit(),
        submitLabel: meeting ? "Save changes" : "Schedule meeting",
        loadingLabel: "Saving...",
        isLoading: saving,
      }}
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="meetingTitle">Title</Label>
          <Input
            id="meetingTitle"
            value={title}
            maxLength={200}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="meetingDate">Date</Label>
            <DateInput
              id="meetingDate"
              value={date}
              min={toDateInput(new Date())}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="meetingTime">Start time</Label>
            <Input
              id="meetingTime"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          In your time zone ({localTimeZone()}). The student sees it in theirs.
        </p>

        <div className="space-y-1.5">
          <Label htmlFor="meetingDuration">Length</Label>
          <Select
            value={String(duration)}
            onValueChange={(v) => setDuration(Number(v))}
          >
            <SelectTrigger id="meetingDuration" aria-label="Length">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {durations.map((minutes) => (
                <SelectItem key={minutes} value={String(minutes)}>
                  {minutes} minutes
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="meetingNote">Note (optional)</Label>
          <Textarea
            id="meetingNote"
            value={note}
            maxLength={2000}
            placeholder="What you'll talk about. It goes into the invite."
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </FormDialog>
  );
};
