import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

import { UpdateBookingUrlDto } from '@modules/mentors/dto/update-booking-url.dto';

const check = (bookingUrl: unknown) => {
  const dto = plainToInstance(UpdateBookingUrlDto, { bookingUrl });
  return { dto, errors: validateSync(dto) };
};

describe('UpdateBookingUrlDto', () => {
  it.each([
    'https://calendar.app.google/AbCd1234',
    'https://calendar.google.com/calendar/appointments/schedules/AcZssZ1',
  ])('accepts a Google booking page: %s', (url) => {
    expect(check(url).errors).toEqual([]);
  });

  it('trims spaces around a pasted link', () => {
    const { dto, errors } = check('  https://calendar.app.google/AbCd1234 ');
    expect(errors).toEqual([]);
    expect(dto.bookingUrl).toBe('https://calendar.app.google/AbCd1234');
  });

  it.each([null, '', '   '])('clears the link for %p', (value) => {
    const { dto, errors } = check(value);
    expect(errors).toEqual([]);
    expect(dto.bookingUrl).toBeNull();
  });

  it.each([
    'https://evil.example.com/book',
    'http://calendar.app.google/AbCd1234',
    'https://calendar.google.com.evil.example/x',
    'javascript:alert(1)',
    'https://calendar.app.google/',
  ])('refuses a link that is not a Google booking page: %s', (url) => {
    expect(check(url).errors).not.toEqual([]);
  });

  it('refuses a missing link', () => {
    const dto = plainToInstance(UpdateBookingUrlDto, {});
    expect(validateSync(dto)).not.toEqual([]);
  });
});
