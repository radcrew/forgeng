import { apiClient } from "@lib/api-client";
import type { PlatformSettings } from "./types";

export interface UpdateSettingsPayload {
  stipendMonth1?: number;
  stipendMonth2?: number;
  stipendMonth3?: number;
  stipendCurrency?: string;
}

export const getSettings = (): Promise<PlatformSettings> =>
  apiClient.get<PlatformSettings>("/settings");

export const updateSettings = (
  data: UpdateSettingsPayload,
): Promise<PlatformSettings> =>
  apiClient.patch<PlatformSettings>("/settings", data);
