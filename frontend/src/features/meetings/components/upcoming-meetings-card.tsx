"use client";

import { CalendarClock, Video } from "lucide-react";

import { Button } from "@components/ui/button";
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
 * The student's upcoming meetings with mentors, with a link to join each
 * call. Shows nothing when there are none, or when they can't be loaded:
 * the calendar invite in the student's email has the same details.
 */
export const UpcomingMeetingsCard = () => {
  const { data: meetings } = useMeetings();
  if (!meetings || meetings.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarClock className="h-4 w-4" />
          Upcoming meetings
        </CardTitle>
        <CardDescription>
          Times are in your time zone. The invite is also in your email.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {meetings.map((meeting) => (
          <div key={meeting.id} className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{meeting.title}</p>
              <p className="text-xs text-muted-foreground">
                {formatMeetingTime(meeting.startsAt, meeting.endsAt)}
                {" · with "}
                {meeting.host.name ?? "your mentor"}
              </p>
              {meeting.note && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {meeting.note}
                </p>
              )}
            </div>
            {meeting.meetUrl && isSafeHref(meeting.meetUrl) && (
              <Button asChild size="sm" variant="outline">
                <a
                  href={meeting.meetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Join ${meeting.title}`}
                >
                  <Video className="mr-1.5 h-3.5 w-3.5" />
                  Join
                </a>
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
