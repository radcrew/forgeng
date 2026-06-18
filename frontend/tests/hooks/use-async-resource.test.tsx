import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useAsyncResource } from "@hooks/use-async-resource";

describe("useAsyncResource", () => {
  it("starts in a loading state", () => {
    const { result } = renderHook(() =>
      useAsyncResource(() => new Promise<number>(() => {}), []),
    );
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeNull();
  });

  it("resolves to data and clears loading", async () => {
    const { result } = renderHook(() =>
      useAsyncResource(() => Promise.resolve(42), []),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toBe(42);
    expect(result.current.error).toBeNull();
  });

  it("captures a thrown error", async () => {
    const { result } = renderHook(() =>
      useAsyncResource(() => Promise.reject(new Error("boom")), []),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe("boom");
    expect(result.current.data).toBeUndefined();
  });

  it("wraps a non-Error rejection in an Error", async () => {
    const { result } = renderHook(() =>
      useAsyncResource(() => Promise.reject("string failure"), []),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe("string failure");
  });

  it("refetches when refetch is called", async () => {
    const fetcher = vi
      .fn<() => Promise<number>>()
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(2);

    const { result } = renderHook(() => useAsyncResource(fetcher, []));

    await waitFor(() => expect(result.current.data).toBe(1));

    result.current.refetch();

    await waitFor(() => expect(result.current.data).toBe(2));
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("reloads when a dependency changes", async () => {
    const fetcher = vi
      .fn<(id: number) => Promise<string>>()
      .mockImplementation((id) => Promise.resolve(`item-${id}`));

    const { result, rerender } = renderHook(
      ({ id }) => useAsyncResource(() => fetcher(id), [id]),
      { initialProps: { id: 1 } },
    );

    await waitFor(() => expect(result.current.data).toBe("item-1"));

    rerender({ id: 2 });

    await waitFor(() => expect(result.current.data).toBe("item-2"));
  });

  it("ignores a resolution after unmount (no state update)", async () => {
    let resolve!: (value: number) => void;
    const fetcher = () =>
      new Promise<number>((r) => {
        resolve = r;
      });

    const { result, unmount } = renderHook(() =>
      useAsyncResource(fetcher, []),
    );

    unmount();
    resolve(99);

    // The hook was unmounted before resolving, so its last snapshot stays loading.
    expect(result.current.data).toBeUndefined();
  });
});
