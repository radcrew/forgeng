import { afterEach, describe, expect, it, vi } from "vitest";

import { formatCalendarDate } from "@utils/date";

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
