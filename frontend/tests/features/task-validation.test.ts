import { describe, expect, it } from "vitest";

import {
  TASK_DESCRIPTION_MAX,
  TASK_TITLE_MAX,
  validateTask,
} from "@features/tasks/validation";

const valid = {
  title: "Build a CLI",
  description: "",
  cohortId: "3",
  status: "draft" as const,
  dueDate: "",
};

describe("validateTask", () => {
  it("accepts a valid draft", () => {
    expect(validateTask(valid)).toEqual({});
  });

  it("asks for a title when it is empty or only spaces", () => {
    expect(validateTask({ ...valid, title: "   " }).title).toBe(
      "Enter a title.",
    );
  });

  it("refuses a title that is too long", () => {
    const title = "a".repeat(TASK_TITLE_MAX + 1);
    expect(validateTask({ ...valid, title }).title).toMatch(/under 200/);
  });

  it("refuses a description that is too long", () => {
    const description = "a".repeat(TASK_DESCRIPTION_MAX + 1);
    expect(validateTask({ ...valid, description }).description).toMatch(
      /under 8000/,
    );
  });

  it("asks for a cohort", () => {
    expect(validateTask({ ...valid, cohortId: "" }).cohortId).toBe(
      "Select a cohort.",
    );
  });

  it("asks for a due date only when the task is published", () => {
    expect(validateTask({ ...valid, status: "published" }).dueDate).toBe(
      "Add a due date before publishing.",
    );
    expect(
      validateTask({ ...valid, status: "published", dueDate: "2026-02-01" }),
    ).toEqual({});
  });

  it("lets an already published task with no due date be edited", () => {
    // Tasks published before the rule may have no date. A typo fix must work.
    expect(
      validateTask({ ...valid, status: "published", wasPublished: true }),
    ).toEqual({});
  });
});
