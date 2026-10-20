import { describe, expect, it } from "vitest";

import {
  durationMinutes,
  fromInputs,
  toDateInput,
  toTimeInput,
} from "@features/meetings/time";

describe("meeting time helpers", () => {
  it("reads a local date and time back into the same moment", () => {
    const moment = new Date(2030, 10, 4, 15, 30);

    const read = fromInputs(toDateInput(moment), toTimeInput(moment));

    expect(read?.getTime()).toBe(moment.getTime());
  });

  it("treats the fields as local time, not UTC", () => {
    const read = fromInputs("2030-11-04", "15:30");

    expect(read?.getHours()).toBe(15);
    expect(read?.getMinutes()).toBe(30);
  });

  it.each([
    ["", "15:00"],
    ["2030-11-04", ""],
    ["not-a-date", "15:00"],
  ])("gives null for %p and %p", (date, time) => {
    expect(fromInputs(date, time)).toBeNull();
  });

  it("measures the length in minutes", () => {
    expect(
      durationMinutes("2030-11-04T15:00:00.000Z", "2030-11-04T15:45:00.000Z"),
    ).toBe(45);
  });
});
