"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { useSelectedCohort } from "@contexts";

export interface CohortSwitcherProps {
  /** All cohorts the student is enrolled in, from the dashboard payload. */
  cohorts: { id: number; name: string }[];
  /** The cohort currently in view (the server-resolved selection). */
  activeCohortId: number;
  /** Disable while the dashboard is refetching the newly selected cohort. */
  disabled?: boolean;
}

/**
 * Lets a student in multiple cohorts switch which one the student pages show.
 * Renders nothing for students enrolled in a single cohort. The choice is held
 * in SelectedCohortContext so it persists across the student pages.
 */
export const CohortSwitcher = ({
  cohorts,
  activeCohortId,
  disabled,
}: CohortSwitcherProps) => {
  const { setSelectedCohortId } = useSelectedCohort();

  if (cohorts.length <= 1) return null;

  return (
    <Select
      value={String(activeCohortId)}
      onValueChange={(value) => setSelectedCohortId(Number(value))}
      disabled={disabled}
    >
      <SelectTrigger className="w-[220px]" aria-label="Switch cohort">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {cohorts.map((c) => (
          <SelectItem key={c.id} value={String(c.id)}>
            {c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
