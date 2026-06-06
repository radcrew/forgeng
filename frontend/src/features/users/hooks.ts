"use client";

import { useCallback, useState } from "react";

import { useAsyncResource } from "@hooks/use-async-resource";

import { getUser, getUserPaymentStats, listUserEnrollments, listUsers, notifyWalletMissing, recordPayment } from "./api";
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

export const useRecordPayment = () => {
  const [isPending, setIsPending] = useState(false);

  const record = useCallback(
    async (userId: number, payload: Parameters<typeof recordPayment>[1]) => {
      setIsPending(true);
      try {
        return await recordPayment(userId, payload);
      } finally {
        setIsPending(false);
      }
    },
    [],
  );

  return { record, isPending };
};

export const useNotifyWalletMissing = () => {
  const [isPending, setIsPending] = useState(false);

  const notify = useCallback(async (userId: number) => {
    setIsPending(true);
    try {
      return await notifyWalletMissing(userId);
    } finally {
      setIsPending(false);
    }
  }, []);

  return { notify, isPending };
};
