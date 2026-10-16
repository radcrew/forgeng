import { describe, expect, it } from "vitest";

import { isNewPastDueDate, todayAsDateInput } from "@features/tasks/due-date";

const today = "2026-10-16";

describe("isNewPastDueDate", () => {
  it("warns about a new date before today", () => {
    expect(isNewPastDueDate("2026-10-15", "", today)).toBe(true);
  });

  it("doesn't warn about today or a later date", () => {
    expect(isNewPastDueDate("2026-10-16", "", today)).toBe(false);
    expect(isNewPastDueDate("2026-11-01", "", today)).toBe(false);
  });

  it("doesn't warn about a past date that was already saved", () => {
    expect(isNewPastDueDate("2026-09-01", "2026-09-01", today)).toBe(false);
  });

  it("warns when a saved date is changed to another past date", () => {
    expect(isNewPastDueDate("2026-08-01", "2026-09-01", today)).toBe(true);
  });

  it("doesn't warn when there is no due date", () => {
    expect(isNewPastDueDate("", "2026-09-01", today)).toBe(false);
  });
});

describe("todayAsDateInput", () => {
  it("formats the local date with leading zeros", () => {
    expect(todayAsDateInput(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});
