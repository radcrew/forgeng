"use client";

import { useCallback, useState } from "react";
import { useAsyncResource } from "@hooks/use-async-resource";
import { disconnectGoogleCalendar, getGoogleCalendarStatus } from "./api";

export const useGoogleCalendarStatus = () =>
  useAsyncResource(getGoogleCalendarStatus, []);

export const useDisconnectGoogleCalendar = () => {
  const [isPending, setIsPending] = useState(false);

  const disconnect = useCallback(async () => {
    setIsPending(true);
    try {
      await disconnectGoogleCalendar();
    } finally {
      setIsPending(false);
    }
  }, []);

  return { disconnect, isPending };
};
