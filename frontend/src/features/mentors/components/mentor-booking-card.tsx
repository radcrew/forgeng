"use client";

import { CalendarDays } from "lucide-react";

import { Avatar } from "@components/ui/avatar";
import { Button } from "@components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@components/ui/card";

import { isBookingUrl } from "../booking-url";
import { useMentors } from "../hooks";

/**
 * Lets a student book a meeting with a mentor on the mentor's Google
 * Calendar booking page. Shows nothing until at least one mentor has added a
 * booking page, or when the list can't be loaded: the rest of the dashboard
 * doesn't depend on it.
 */
export const MentorBookingCard = () => {
  const { data: mentors } = useMentors();
  // The server only saves Google links. Checking again here means a bad
  // row can never become a link on the page.
  const bookable = (mentors ?? []).filter((m) => isBookingUrl(m.bookingUrl));
  if (bookable.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarDays className="h-4 w-4" />
          Book a meeting with a mentor
        </CardTitle>
        <CardDescription>
          Pick a free time on a mentor&apos;s calendar. You get a calendar
          invite with a video call link.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {bookable.map((mentor) => {
          const name = mentor.name ?? "Mentor";
          return (
            <div key={mentor.id} className="flex items-center gap-3">
              <Avatar src={mentor.avatarUrl} name={name} email="" />
              <p className="flex-1 min-w-0 truncate font-medium">{name}</p>
              <Button asChild size="sm" variant="outline">
                <a
                  href={mentor.bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Book a meeting with ${name}`}
                >
                  Book a time
                </a>
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
