import { apiClient } from "@lib/api-client";
import type { BookingUrl, Mentor } from "./types";

/** Mentors who added a booking page. */
export const listMentors = (): Promise<Mentor[]> =>
  apiClient.get<Mentor[]>("/mentors");

export const getMyBookingUrl = (): Promise<BookingUrl> =>
  apiClient.get<BookingUrl>("/mentors/me/booking-url");

/** Saves the signed-in admin's booking page. `null` removes it. */
export const updateMyBookingUrl = (
  bookingUrl: string | null,
): Promise<BookingUrl> =>
  apiClient.patch<BookingUrl>("/mentors/me/booking-url", { bookingUrl });
