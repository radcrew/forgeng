import { apiClient } from "@lib/api-client";

import type { Cohort } from "@types";
import type { AdminUserDetail, UserRole } from "./types";

export interface UserEnrollment {
  id: number;
  enrolledAt: string;
  cohort: Cohort;
}

export interface PaginatedUsers {
  items: AdminUserDetail[];
  total: number;
  page: number;
  pageSize: number;
}

export const listUsers = async (params?: {
  role?: UserRole;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedUsers> => {
  const search = new URLSearchParams();
  if (params?.role) search.set("role", params.role);
  if (params?.page != null) search.set("page", String(params.page));
  if (params?.pageSize != null) search.set("pageSize", String(params.pageSize));
  const query = search.toString();
  return apiClient.get<PaginatedUsers>(`/users${query ? `?${query}` : ""}`);
};

export const listUserEnrollments = async (
  userId: number,
): Promise<UserEnrollment[]> =>
  apiClient.get<UserEnrollment[]>(`/users/${userId}/enrollments`);

export interface MonthlyPaymentStat {
  month: string;
  tasksTotal: number;
  tasksApproved: number;
  eligible: boolean;
  notifiedAt: string | null;
  payment: {
    amount: string;
    currency: string;
    txLink: string | null;
    paidAt: string;
  } | null;
}

export interface PaymentRecord {
  id: number;
  amount: string;
  currency: string;
  txLink: string | null;
  note: string | null;
  paidAt: string;
}

export interface UserPaymentStats {
  wallets: Array<{ chain: string; address: string }>;
  monthlyStats: MonthlyPaymentStat[];
}

export const getUser = async (id: number): Promise<AdminUserDetail> =>
  apiClient.get<AdminUserDetail>(`/users/${id}`);

export const getUserPaymentStats = async (
  id: number,
): Promise<UserPaymentStats> =>
  apiClient.get<UserPaymentStats>(`/users/${id}/payment-stats`);

export const notifyWalletMissing = async (
  id: number,
): Promise<{ sent: boolean }> =>
  apiClient.post<{ sent: boolean }>(`/users/${id}/notify-wallet-missing`, {});

export const recordPayment = async (
  id: number,
  payload: { amount: number; currency: string; txLink?: string; note?: string },
): Promise<PaymentRecord> =>
  apiClient.post<PaymentRecord>(`/users/${id}/payments`, payload);

export const updateUserRole = async (
  id: number,
  role: UserRole,
): Promise<AdminUserDetail> =>
  apiClient.patch<AdminUserDetail>(`/users/${id}/role`, { role });
