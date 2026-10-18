"use client";

import { useCallback, useEffect, useState } from "react";

export interface AsyncResourceState<T> {
  data: T | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Loads async data on mount and when `deps` change.
 * Swap mock `api` implementations for live fetch without touching UI hooks.
 * With `enabled: false` it waits, for example until a value it needs is known.
 * While waiting it reports `isLoading: false`.
 */
export const useAsyncResource = <T>(
  fetcher: () => Promise<T>,
  deps: readonly unknown[],
  { enabled = true }: { enabled?: boolean } = {},
): AsyncResourceState<T> => {
  const [data, setData] = useState<T | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [version, setVersion] = useState(0);

  const refetch = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await fetcher();
        if (!cancelled) setData(result);
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller controls invalidation via deps
  }, [...deps, version, enabled]);

  // Waiting isn't loading. Reporting it as loading would keep a page on its
  // spinner when the value it waits for failed to load and never arrives.
  return { data, isLoading: enabled && isLoading, error, refetch };
};
