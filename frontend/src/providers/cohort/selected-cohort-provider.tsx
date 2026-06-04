"use client";

import { useMemo, useState } from "react";

import { SelectedCohortContext } from "@contexts";

/**
 * Holds the student's currently selected cohort so the choice is shared across
 * the dashboard, tasks, and cohort pages. Kept in memory only — a hard reload
 * falls back to the server default (the most recently enrolled cohort).
 */
export const SelectedCohortProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [selectedCohortId, setSelectedCohortId] = useState<number>();

  const value = useMemo(
    () => ({ selectedCohortId, setSelectedCohortId }),
    [selectedCohortId],
  );

  return (
    <SelectedCohortContext.Provider value={value}>
      {children}
    </SelectedCohortContext.Provider>
  );
};
