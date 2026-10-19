import { Transform } from 'class-transformer';
import { IsString, Matches, MaxLength, ValidateIf } from 'class-validator';

/**
 * Google Calendar booking pages. Anything else is refused, so a mentor's
 * link can't send students to another site.
 */
export const BOOKING_URL_RE =
  /^https:\/\/(calendar\.google\.com|calendar\.app\.google)\/\S+$/;

export class UpdateBookingUrlDto {
  // A blank link clears it, the same as null.
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() || null : value,
  )
  @ValidateIf((o: { bookingUrl?: unknown }) => o.bookingUrl !== null)
  @IsString()
  @MaxLength(500)
  @Matches(BOOKING_URL_RE, {
    message:
      'Use a Google Calendar booking page link. It starts with https://calendar.app.google/ or https://calendar.google.com/.',
  })
  bookingUrl!: string | null;
}
