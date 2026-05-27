"use client";

import { useAsyncResource } from "@hooks/use-async-resource";

import { listUsers } from "./api";
import type { UserRole } from "./types";

export type UserRoleFilter = UserRole | "all";

export const useUsers = (role: UserRoleFilter = "all") =>
  useAsyncResource(
    () => listUsers(role === "all" ? undefined : role),
    [role],
  );
