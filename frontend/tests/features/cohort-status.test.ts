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

  it("stays open while the end day is still going on somewhere", () => {
    // June 9 ends last in UTC-12, at 12:00 UTC on June 10.
    expect(
      isCohortEnded(
        { status: "active", endDate: "2026-06-09T00:00:00.000Z" },
        new Date("2026-06-10T11:59:00.000Z"),
      ),
    ).toBe(false);
  });

  it("is ended once the end day is over everywhere", () => {
    expect(
      isCohortEnded(
        { status: "active", endDate: "2026-06-09T00:00:00.000Z" },
        now,
      ),
    ).toBe(true);
  });
});
