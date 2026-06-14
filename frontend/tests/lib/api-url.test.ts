import { describe, expect, it } from "vitest";

import { buildApiBase } from "@utils/api";
import { resolveAssetUrl } from "@lib/config";

describe("buildApiBase", () => {
  it("appends the /api prefix to an origin", () => {
    expect(buildApiBase("http://localhost:3001")).toBe(
      "http://localhost:3001/api",
    );
  });

  it("strips a trailing slash before appending", () => {
    expect(buildApiBase("https://api.forgeng.dev/")).toBe(
      "https://api.forgeng.dev/api",
    );
  });
});

describe("resolveAssetUrl", () => {
  it("passes through an absolute http URL unchanged", () => {
    expect(resolveAssetUrl("https://cdn.example.com/a.png")).toBe(
      "https://cdn.example.com/a.png",
    );
  });

  it("prefixes a server-relative path with the API origin", () => {
    // API_URL defaults to http://localhost:3001 in the test environment.
    expect(resolveAssetUrl("/api/uploads/avatars/x.png")).toBe(
      "http://localhost:3001/api/uploads/avatars/x.png",
    );
  });
});
