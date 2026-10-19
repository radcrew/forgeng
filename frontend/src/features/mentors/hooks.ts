"use client";

import { useCallback, useState } from "react";
import { useAsyncResource } from "@hooks/use-async-resource";
import { getMyBookingUrl, updateMyBookingUrl } from "./api";

export const useMyBookingUrl = () => useAsyncResource(getMyBookingUrl, []);

export const useUpdateBookingUrl = () => {
  const [isPending, setIsPending] = useState(false);

  const save = useCallback(async (bookingUrl: string | null) => {
    setIsPending(true);
    try {
      return await updateMyBookingUrl(bookingUrl);
    } finally {
      setIsPending(false);
    }
  }, []);

  return { save, isPending };
};
