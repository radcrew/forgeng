"use client";

import { useAsyncResource } from "@hooks/use-async-resource";

import * as usersApi from "./api";
import type { UserRole } from "./types";

export type UserRoleFilter = UserRole | "all";

export function useUsers(role: UserRoleFilter = "all") {
  return useAsyncResource(
    () => usersApi.listUsers(role === "all" ? undefined : role),
    [role],
  );
}
