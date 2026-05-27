"use client";

import { useAsyncResource } from "@hooks/use-async-resource";

import {
  getAdminDashboard,
  getMentorDashboard,
  getStudentDashboard,
} from "@features/dashboard/api";

export const useStudentDashboard = () =>
  useAsyncResource(() => getStudentDashboard(), []);

export const useMentorDashboard = () =>
  useAsyncResource(() => getMentorDashboard(), []);

export const useAdminDashboard = () =>
  useAsyncResource(() => getAdminDashboard(), []);
