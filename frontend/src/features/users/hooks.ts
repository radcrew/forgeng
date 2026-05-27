"use client";

import { useAsyncResource } from "@hooks/use-async-resource";

import { listUsers } from "./api";
import type { UserRoleFilter } from "@types";

export type { UserRoleFilter };

export const useUsers = (role: UserRoleFilter = "all") =>
  useAsyncResource(
    () => listUsers(role === "all" ? undefined : role),
    [role],
  );
