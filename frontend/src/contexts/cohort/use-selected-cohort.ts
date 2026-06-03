"use client";

import { useContext } from "react";

import {
  SelectedCohortContext,
  type SelectedCohortContextValue,
} from "./selected-cohort-context";

export const useSelectedCohort = (): SelectedCohortContextValue => {
  const ctx = useContext(SelectedCohortContext);
  if (!ctx) {
    throw new Error(
      "useSelectedCohort must be used inside <SelectedCohortProvider />.",
    );
  }
  return ctx;
};

export type { SelectedCohortContextValue } from "./selected-cohort-context";
