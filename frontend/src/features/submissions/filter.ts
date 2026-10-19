import type { Submission, SubmissionStatusFilter } from "@types";

/** The submissions that match a status tab and a task title search. */
export const filterSubmissions = (
  submissions: Submission[],
  status: SubmissionStatusFilter,
  search: string,
): Submission[] => {
  const query = search.trim().toLowerCase();
  return submissions.filter(
    (sub) =>
      (status === "all" || sub.status === status) &&
      (!query || (sub.task?.title ?? "").toLowerCase().includes(query)),
  );
};
