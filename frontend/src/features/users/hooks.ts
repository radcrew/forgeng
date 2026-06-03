"use client";

import { useAsyncResource } from "@hooks/use-async-resource";

import { listUserEnrollments, listUsers } from "./api";
import type { UserRoleFilter } from "@types";

export type { UserRoleFilter };

export const useUsers = (role: UserRoleFilter = "all") =>
  useAsyncResource(
    () => listUsers(role === "all" ? undefined : role),
    [role],
  );

export const useUserEnrollments = (userId: number | null) =>
  useAsyncResource(
    () => (userId == null ? Promise.resolve([]) : listUserEnrollments(userId)),
    [userId],
  );
