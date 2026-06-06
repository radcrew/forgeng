"use client";

import { useAsyncResource } from "@hooks/use-async-resource";

import { getUser, getUserPaymentStats, listUserEnrollments, listUsers } from "./api";
import type { UserRoleFilter } from "@types";

export type { UserRoleFilter };

export const useUser = (id: number) =>
  useAsyncResource(() => getUser(id), [id]);

export const useUserPaymentStats = (id: number) =>
  useAsyncResource(() => getUserPaymentStats(id), [id]);

export const useUsers = (
  role: UserRoleFilter = "all",
  page = 1,
  pageSize?: number,
) =>
  useAsyncResource(
    () => listUsers({ role: role === "all" ? undefined : role, page, pageSize }),
    [role, page, pageSize],
  );

export const useUserEnrollments = (userId: number | null) =>
  useAsyncResource(
    () => (userId == null ? Promise.resolve([]) : listUserEnrollments(userId)),
    [userId],
  );
