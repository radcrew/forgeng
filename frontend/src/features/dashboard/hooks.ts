"use client";

import { useAsyncResource } from "@hooks/use-async-resource";

import * as dashboardApi from "./api";

export function useStudentDashboard() {
  return useAsyncResource(() => dashboardApi.getStudentDashboard(), []);
}

export function useMentorDashboard() {
  return useAsyncResource(() => dashboardApi.getMentorDashboard(), []);
}

export function useAdminDashboard() {
  return useAsyncResource(() => dashboardApi.getAdminDashboard(), []);
}
