import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  readStorageJson,
  removeStorageItem,
  writeStorageJson,
} from "@utils/storage";

// The vitest environment is node, so there is no window/localStorage by
// default. Stub a minimal in-memory localStorage on globalThis for these tests.
function stubLocalStorage(): Map<string, string> {
  const store = new Map<string, string>();
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, v),
      removeItem: (k: string) => store.delete(k),
    },
  });
  return store;
}

describe("storage helpers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("with a window present", () => {
    beforeEach(() => {
      stubLocalStorage();
    });

    it("round-trips a JSON value", () => {
      writeStorageJson("draft", { step: 2, name: "Ada" });
      expect(readStorageJson("draft")).toEqual({ step: 2, name: "Ada" });
    });

    it("returns null for a missing key", () => {
      expect(readStorageJson("nope")).toBeNull();
    });

    it("returns null for malformed JSON instead of throwing", () => {
      window.localStorage.setItem("bad", "{not json");
      expect(readStorageJson("bad")).toBeNull();
    });

    it("removes a stored item", () => {
      writeStorageJson("draft", { a: 1 });
      removeStorageItem("draft");
      expect(readStorageJson("draft")).toBeNull();
    });
  });

  describe("during server-side rendering (no window)", () => {
    it("reads return null and writes are no-ops", () => {
      // No window stub here, so the SSR guards take effect.
      expect(readStorageJson("anything")).toBeNull();
      expect(() => writeStorageJson("anything", { a: 1 })).not.toThrow();
      expect(() => removeStorageItem("anything")).not.toThrow();
    });
  });
});
