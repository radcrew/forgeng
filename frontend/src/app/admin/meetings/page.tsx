"use client";

import { PageContainer, PageHeader } from "@components/shared";
import { GoogleCalendarCard, MyMeetingsCard } from "@features/meetings";
import { BookingUrlCard } from "@features/mentors";

/**
 * Each mentor's own meetings with students: the Google Calendar connection
 * that scheduled meetings go into, the booking page students pick a time
 * on, and the meetings coming up.
 */
const Page = () => (
  <PageContainer maxWidth="reading" spacing="8">
    <PageHeader
      title="Meetings"
      description="Your meetings with students, your Google Calendar, and your booking page."
    />
    <MyMeetingsCard />
    <GoogleCalendarCard />
    <BookingUrlCard />
  </PageContainer>
);

export default Page;
