import { describe, expect, it } from "vitest";

import { isCohortEnded } from "@features/cohorts/status";

const now = new Date("2026-06-10T15:00:00.000Z");

describe("isCohortEnded", () => {
  it("is ended when an admin marked the cohort completed", () => {
    expect(isCohortEnded({ status: "completed", endDate: null }, now)).toBe(true);
  });

  it("is open with no end date", () => {
    expect(isCohortEnded({ status: "active", endDate: null }, now)).toBe(false);
  });

  it("is still open on the end day itself", () => {
    expect(
      isCohortEnded(
        { status: "active", endDate: "2026-06-10T00:00:00.000Z" },
        now,
      ),
    ).toBe(false);
  });

  it("is ended the day after the end date", () => {
    expect(
      isCohortEnded(
        { status: "active", endDate: "2026-06-09T00:00:00.000Z" },
        now,
      ),
    ).toBe(true);
  });
});
