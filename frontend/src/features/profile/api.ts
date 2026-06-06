import { apiClient } from "@lib/api-client";
import type { UserProfile } from "@types";

import type { ProfileEnrollment, ProfileUpdate } from "./types";

export const updateProfile = async (
  input: ProfileUpdate,
): Promise<UserProfile> =>
  apiClient.patch<UserProfile>("/account/profile", input);

export const uploadAvatar = async (file: File): Promise<UserProfile> => {
  const form = new FormData();
  form.append("file", file);
  return apiClient.postForm<UserProfile>("/account/avatar", form);
};

export const listEnrollments = async (): Promise<ProfileEnrollment[]> =>
  apiClient.get<ProfileEnrollment[]>("/account/enrollments");

export type WalletEntry = { chain: string; address: string };

export const getWallets = async (): Promise<WalletEntry[]> =>
  apiClient
    .get<{ wallets: WalletEntry[] }>("/account/wallets")
    .then((r) => r.wallets);

export const updateWallets = async (
  wallets: WalletEntry[],
): Promise<WalletEntry[]> =>
  apiClient
    .patch<{ wallets: WalletEntry[] }>("/account/wallets", { wallets })
    .then((r) => r.wallets);
