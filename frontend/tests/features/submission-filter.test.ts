import { describe, expect, it } from "vitest";

import { filterSubmissions } from "@features/submissions/filter";
import type { Submission } from "@types";

function makeSubmission(
  id: number,
  title: string,
  status: Submission["status"],
): Submission {
  return {
    id,
    taskId: id,
    task: { id, title, type: "coding" },
    content: "My work",
    repoUrl: null,
    status,
    feedbackCount: 0,
    createdAt: "2026-01-15T10:30:00.000Z",
  };
}

const subs = [
  makeSubmission(1, "Build a CLI", "approved"),
  makeSubmission(2, "Read the docs", "needs_work"),
  makeSubmission(3, "Build an API", "submitted"),
];

const ids = (list: Submission[]) => list.map((s) => s.id);

describe("filterSubmissions", () => {
  it("keeps everything on the All tab with no search", () => {
    expect(ids(filterSubmissions(subs, "all", ""))).toEqual([1, 2, 3]);
  });

  it("keeps only the chosen status", () => {
    expect(ids(filterSubmissions(subs, "needs_work", ""))).toEqual([2]);
  });

  it("searches task titles without caring about case or outer spaces", () => {
    expect(ids(filterSubmissions(subs, "all", "  BUILD "))).toEqual([1, 3]);
  });

  it("combines the status and the search", () => {
    expect(ids(filterSubmissions(subs, "submitted", "build"))).toEqual([3]);
  });
});
