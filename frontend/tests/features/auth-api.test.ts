import { beforeEach, describe, expect, it, vi } from "vitest";

const get = vi.fn();
const post = vi.fn();
vi.mock("@lib/api-client", () => ({
  apiClient: {
    get: (...args: unknown[]) => get(...args),
    post: (...args: unknown[]) => post(...args),
  },
}));

const writeSession = vi.fn();
const clearAuth = vi.fn();
vi.mock("@lib/session", () => ({
  writeSession: (...args: unknown[]) => writeSession(...args),
  clearAuth: (...args: unknown[]) => clearAuth(...args),
}));

import {
  forgotPassword,
  login,
  logout,
  oauthStartUrl,
  refresh,
  register,
} from "@features/auth/api";

const SESSION = {
  user: {
    id: 1,
    email: "ada@example.com",
    role: "student",
    createdAt: "2026-01-15T10:30:00.000Z",
  },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("login", () => {
  it("normalizes the email and persists the session and token", async () => {
    post.mockResolvedValue(SESSION);

    await login("  Ada@Example.com ", "pw");

    const [path, body] = post.mock.calls[0] as [string, { email: string }];
    expect(path).toBe("/auth/login");
    expect(body.email).toBe("ada@example.com");
    expect(writeSession).toHaveBeenCalledTimes(1);
  });
});

describe("register", () => {
  it("normalizes the email and includes the name when provided", async () => {
    post.mockResolvedValue({ user: SESSION.user });

    await register("Ada@Example.com", "pw", "Ada");

    const [, body] = post.mock.calls[0] as [
      string,
      { email: string; name?: string },
    ];
    expect(body.email).toBe("ada@example.com");
    expect(body.name).toBe("Ada");
  });

  it("omits the name when not provided", async () => {
    post.mockResolvedValue({ user: SESSION.user });

    await register("ada@example.com", "pw");

    const [, body] = post.mock.calls[0] as [
      string,
      { name?: string },
    ];
    expect(body.name).toBeUndefined();
  });
});

describe("forgotPassword", () => {
  it("normalizes the email before sending", async () => {
    post.mockResolvedValue(undefined);

    await forgotPassword("  ADA@EXAMPLE.com");

    const [path, body] = post.mock.calls[0] as [string, { email: string }];
    expect(path).toBe("/auth/forgot-password");
    expect(body.email).toBe("ada@example.com");
  });
});

describe("refresh", () => {
  it("persists the session on success", async () => {
    post.mockResolvedValue(SESSION);

    const result = await refresh();

    expect(result).not.toBeNull();
    expect(writeSession).toHaveBeenCalledTimes(1);
  });

  it("clears auth and returns null on failure", async () => {
    post.mockRejectedValue(new Error("401"));

    const result = await refresh();

    expect(result).toBeNull();
    expect(clearAuth).toHaveBeenCalledTimes(1);
  });
});

describe("logout", () => {
  it("clears auth even when the server call fails", async () => {
    post.mockRejectedValue(new Error("already revoked"));

    await logout();

    expect(clearAuth).toHaveBeenCalledTimes(1);
  });
});

describe("oauthStartUrl", () => {
  it("builds the provider start URL from the API base", () => {
    expect(oauthStartUrl("google")).toMatch(/\/auth\/google$/);
    expect(oauthStartUrl("github")).toMatch(/\/auth\/github$/);
  });
});
