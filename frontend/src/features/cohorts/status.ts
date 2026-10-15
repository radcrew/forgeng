import type { Cohort } from "@types";

/**
 * True once a cohort stops taking work: an admin marked it completed, or its
 * end date is over. Students can still submit on the end day itself. The
 * server applies the same rule.
 */
export const isCohortEnded = (
  cohort: Pick<Cohort, "status" | "endDate">,
  now = new Date(),
): boolean => {
  if (cohort.status === "completed") return true;
  if (!cohort.endDate) return false;
  // The end date is saved as midnight UTC, so it closes a day later.
  return now.getTime() >= new Date(cohort.endDate).getTime() + 86_400_000;
};
