"use client";

import Link from "next/link";
import { Video } from "lucide-react";

import { LoadingState } from "@components/common";
import { ErrorState } from "@components/shared";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@components/ui/card";
import { isSafeHref } from "@utils";

import { useMeetings } from "../hooks";
import { formatMeetingTime } from "../time";

/**
 * The signed-in admin's upcoming meetings, with every student. A meeting is
 * moved or cancelled on that student's page, so each name links there.
 */
export const MyMeetingsCard = () => {
  const { data: meetings, isLoading, error, refetch } = useMeetings();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Your upcoming meetings</CardTitle>
        <CardDescription>
          To schedule, move, or cancel a meeting, open the student&apos;s
          page.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <LoadingState message="Loading your meetings…" />
        ) : error ? (
          // A failed load must not read as "no meetings".
          <ErrorState what="your meetings" onRetry={refetch} size="compact" />
        ) : !meetings || meetings.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No upcoming meetings.
          </p>
        ) : (
          <div className="space-y-2">
            {meetings.map((meeting) => (
              <div
                key={meeting.id}
                className="flex items-start justify-between gap-3 rounded-lg bg-muted/50 p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {meeting.title}
                    {" with "}
                    <Link
                      href={`/admin/users/${meeting.attendee.id}`}
                      className="underline underline-offset-2 hover:text-foreground"
                    >
                      {meeting.attendee.name ?? meeting.attendee.email}
                    </Link>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatMeetingTime(meeting.startsAt, meeting.endsAt)}
                  </p>
                </div>
                {meeting.meetUrl && isSafeHref(meeting.meetUrl) && (
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
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
