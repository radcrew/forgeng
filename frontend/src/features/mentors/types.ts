export interface BookingUrl {
  bookingUrl: string | null;
}

/** A mentor (an admin) that students can book a meeting with. */
export interface Mentor {
  id: number;
  name: string | null;
  avatarUrl: string | null;
  bookingUrl: string;
}
