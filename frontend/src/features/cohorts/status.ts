import type { Cohort } from "@types";
import { isCalendarDayOver } from "@utils/date";

/**
 * True once a cohort stops taking work: an admin marked it completed, or its
 * end date is over everywhere on Earth. The server applies the same rule.
 */
export const isCohortEnded = (
  cohort: Pick<Cohort, "status" | "endDate">,
  now = new Date(),
): boolean => {
  if (cohort.status === "completed") return true;
  if (!cohort.endDate) return false;
  return isCalendarDayOver(cohort.endDate, now.getTime());
};
