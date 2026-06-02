"use client";

import { useCallback, useEffect, useState } from "react";

import { useAsyncResource } from "@hooks/use-async-resource";

import { getUnreadCount, listNotifications } from "./api";

/** The student's notifications, newest first. Refetch after marking read. */
export const useNotifications = () =>
  useAsyncResource(() => listNotifications(), []);

/**
 * Unread badge count, polled on an interval so the bell stays live without a
 * websocket. `refresh` lets callers update it immediately after marking read.
 */
export const useUnreadNotificationCount = (intervalMs = 30_000) => {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      setCount(await getUnreadCount());
    } catch {
      // Silent: a transient failure shouldn't surface as a UI error.
    }
  }, []);

  useEffect(() => {
    let active = true;
    const tick = async () => {
      try {
        const next = await getUnreadCount();
        if (active) setCount(next);
      } catch {
        // Silent: a transient failure shouldn't surface as a UI error.
      }
    };

    void tick();
    const id = setInterval(() => void tick(), intervalMs);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [intervalMs]);

  return { count, setCount, refresh };
};
