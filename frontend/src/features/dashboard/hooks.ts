"use client";

import { useAsyncResource } from "@hooks/use-async-resource";

import { getAdminDashboard, getStudentDashboard } from "./api";

export const useStudentDashboard = () =>
  useAsyncResource(() => getStudentDashboard(), []);

export const useAdminDashboard = () =>
  useAsyncResource(() => getAdminDashboard(), []);
