import { describe, expect, it } from "vitest";

import { formatSentDates } from "@features/submissions/sent-dates";

describe("formatSentDates", () => {
  it("shows only the first send when the work was sent once", () => {
    expect(
      formatSentDates({
        createdAt: "2026-01-15T12:00:00.000Z",
        lastSubmittedAt: "2026-01-15T12:00:00.000Z",
      }),
    ).toBe("Submitted Jan 15, 2026");
  });

  it("adds the resubmit date when the work was sent again", () => {
    expect(
      formatSentDates({
        createdAt: "2026-01-15T12:00:00.000Z",
        lastSubmittedAt: "2026-01-20T12:00:00.000Z",
      }),
    ).toBe("Submitted Jan 15, 2026 · Resubmitted Jan 20, 2026");
  });

  it("counts a resubmit within the same minute", () => {
    expect(
      formatSentDates({
        createdAt: "2026-01-15T12:00:00.000Z",
        lastSubmittedAt: "2026-01-15T12:00:30.000Z",
      }),
    ).toBe("Submitted Jan 15, 2026 · Resubmitted Jan 15, 2026");
  });
});
