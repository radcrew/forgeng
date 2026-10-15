import { isCalendarDayOver } from '@common/utils/date';

describe('isCalendarDayOver', () => {
  const due = new Date('2026-02-01T00:00:00.000Z');

  it('is not over while it is still Feb 1 in the last time zone', () => {
    expect(isCalendarDayOver(due, Date.parse('2026-02-02T11:59:00Z'))).toBe(
      false,
    );
  });

  it('is over once Feb 1 has ended everywhere', () => {
    expect(isCalendarDayOver(due, Date.parse('2026-02-02T12:00:00Z'))).toBe(
      true,
    );
  });
});
