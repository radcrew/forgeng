import { afterEach, describe, expect, it, vi } from "vitest";

import { formatCalendarDate, isCalendarDayOver } from "@utils/date";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("formatCalendarDate", () => {
  it("shows the saved day, not the day before, west of UTC", () => {
    // A cohort starting May 1 is saved as midnight UTC on May 1. In New York
    // that moment is still April 30, which is the bug this guards against.
    vi.stubEnv("TZ", "America/New_York");
    expect(formatCalendarDate("2026-05-01T00:00:00.000Z")).toBe("May 1, 2026");
  });

  it("accepts a plain date and a custom pattern", () => {
    expect(formatCalendarDate("2026-12-31", "yyyy-MM-dd")).toBe("2026-12-31");
  });
});

describe("isCalendarDayOver", () => {
  const due = "2026-02-01T00:00:00.000Z";

  it("is not over during the day, even late in UTC", () => {
    expect(isCalendarDayOver(due, Date.parse("2026-02-01T23:59:00Z"))).toBe(false);
  });

  it("is not over while it is still Feb 1 in the last time zone", () => {
    expect(isCalendarDayOver(due, Date.parse("2026-02-02T11:59:00Z"))).toBe(false);
  });

  it("is over once Feb 1 has ended everywhere", () => {
    expect(isCalendarDayOver(due, Date.parse("2026-02-02T12:00:00Z"))).toBe(true);
  });
});
