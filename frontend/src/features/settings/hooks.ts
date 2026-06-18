"use client";

import { useCallback, useState } from "react";
import { useAsyncResource } from "@hooks/use-async-resource";
import { getSettings, updateSettings, type UpdateSettingsPayload } from "./api";

export const useSettings = () => useAsyncResource(getSettings, []);

export const useUpdateSettings = () => {
  const [isPending, setIsPending] = useState(false);

  const save = useCallback(async (data: UpdateSettingsPayload) => {
    setIsPending(true);
    try {
      return await updateSettings(data);
    } finally {
      setIsPending(false);
    }
  }, []);

  return { save, isPending };
};
