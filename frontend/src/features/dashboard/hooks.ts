"use client";

import { useAsyncResource } from "@hooks/use-async-resource";

import { getAdminDashboard, getStudentDashboard } from "./api";

export const useStudentDashboard = (cohortId?: number) =>
  useAsyncResource(() => getStudentDashboard(cohortId), [cohortId]);

export const useAdminDashboard = () =>
  useAsyncResource(() => getAdminDashboard(), []);
