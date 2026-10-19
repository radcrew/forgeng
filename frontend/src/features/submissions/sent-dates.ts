import { format } from "date-fns";

import type { Submission } from "@types";

/**
 * When the work was sent, for example "Submitted Jan 15, 2026" or
 * "Submitted Jan 15, 2026 · Resubmitted Jan 20, 2026". The first send sets
 * both dates to the same moment, so any difference means it was sent again.
 */
export const formatSentDates = (
  sub: Pick<Submission, "createdAt" | "lastSubmittedAt">,
): string => {
  const submitted = `Submitted ${format(new Date(sub.createdAt), "MMM d, yyyy")}`;
  if (sub.lastSubmittedAt === sub.createdAt) return submitted;
  return `${submitted} · Resubmitted ${format(new Date(sub.lastSubmittedAt), "MMM d, yyyy")}`;
};
