// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

// Tokens in these tests are plain role names, so "applicant" decodes to an
// applicant and "student" to a student.
vi.mock("@lib/auth/access-token", () => ({
  ACCESS_COOKIE_NAME: "forgeng_access",
  verifyAccessToken: async (token: string) => ({ sub: 1, role: token }),
}));

import { proxy } from "../../src/proxy";

const request = (path: string, accessToken: string) =>
  new NextRequest(`http://localhost${path}`, {
    headers: { cookie: `forgeng_access=${accessToken}; forgeng_refresh=r` },
  });

const refreshTo = (role: string) =>
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(null, {
      status: 200,
      headers: { "set-cookie": `forgeng_access=${role}; Path=/; HttpOnly` },
    }),
  );

afterEach(() => {
  vi.restoreAllMocks();
});

describe("proxy", () => {
  it("lets a just-accepted student into /student after refreshing the token", async () => {
    const fetchSpy = refreshTo("student");

    const res = await proxy(request("/student", "applicant"));

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(res.headers.get("location")).toBeNull();
    expect(res.headers.get("set-cookie")).toContain("forgeng_access=student");
  });

  it("still redirects when the refreshed role does not fit the page", async () => {
    refreshTo("applicant");

    const res = await proxy(request("/student", "applicant"));

    expect(res.headers.get("location")).toBe("http://localhost/apply");
  });

  it("does not refresh when the token role already fits", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const res = await proxy(request("/student", "student"));

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(res.headers.get("location")).toBeNull();
  });
});
