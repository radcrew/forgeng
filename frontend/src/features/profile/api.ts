import { apiClient } from "@lib/api-client";
import type { UserProfile } from "@types";

import type { ProfileEnrollment, ProfileUpdate } from "./types";

export const updateProfile = async (
  input: ProfileUpdate,
): Promise<UserProfile> =>
  apiClient.patch<UserProfile>("/account/profile", input);

export const listEnrollments = async (): Promise<ProfileEnrollment[]> =>
  apiClient.get<ProfileEnrollment[]>("/account/enrollments");
