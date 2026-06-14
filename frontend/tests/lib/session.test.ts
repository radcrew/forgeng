import { beforeEach, describe, expect, it, vi } from "vitest";

import type { UserProfile } from "@types";
import {
  clearAuth,
  readAccessToken,
  readSession,
  subscribeSession,
  writeAccessToken,
  writeSession,
} from "@lib/session";

const USER = { id: 7, email: "ada@example.com", role: "student" } as UserProfile;

beforeEach(() => {
  window.localStorage.clear();
  // Reset the module's internal cache by writing a known empty state.
  writeSession(null);
  window.localStorage.clear();
});

describe("session storage", () => {
  it("round-trips a session user", () => {
    writeSession(USER);
    expect(readSession()?.id).toBe(7);
  });

  it("returns null when no session is stored", () => {
    expect(readSession()).toBeNull();
  });

  it("stores the active user id alongside the session", () => {
    writeSession(USER);
    expect(window.localStorage.getItem("forgeng.activeUserId")).toBe("7");
  });

  it("clears the session and active user id on writeSession(null)", () => {
    writeSession(USER);
    writeSession(null);
    expect(readSession()).toBeNull();
    expect(window.localStorage.getItem("forgeng.activeUserId")).toBeNull();
  });

  it("returns null for malformed session JSON", () => {
    window.localStorage.setItem("forgeng.session", "{not json");
    expect(readSession()).toBeNull();
  });
});

describe("access token storage", () => {
  it("round-trips an access token", () => {
    writeAccessToken("jwt.token");
    expect(readAccessToken()).toBe("jwt.token");
  });

  it("removes the token on writeAccessToken(null)", () => {
    writeAccessToken("jwt.token");
    writeAccessToken(null);
    expect(readAccessToken()).toBeNull();
  });
});

describe("clearAuth", () => {
  it("removes both the token and the session", () => {
    writeAccessToken("jwt.token");
    writeSession(USER);

    clearAuth();

    expect(readAccessToken()).toBeNull();
    expect(readSession()).toBeNull();
  });
});

describe("subscribeSession", () => {
  it("invokes the callback on a session change", () => {
    const cb = vi.fn();
    const unsubscribe = subscribeSession(cb);

    writeSession(USER); // dispatches forgeng:session-change

    expect(cb).toHaveBeenCalled();
    unsubscribe();
  });

  it("stops invoking the callback after unsubscribe", () => {
    const cb = vi.fn();
    const unsubscribe = subscribeSession(cb);
    unsubscribe();

    writeSession(USER);

    expect(cb).not.toHaveBeenCalled();
  });
});
