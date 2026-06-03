"use client";

import { createContext } from "react";

export interface SelectedCohortContextValue {
  /**
   * The cohort the student has explicitly switched to, or undefined to follow
   * the server default (their most recently enrolled cohort).
   */
  selectedCohortId: number | undefined;
  setSelectedCohortId: (id: number | undefined) => void;
}

export const SelectedCohortContext =
  createContext<SelectedCohortContextValue | null>(null);
