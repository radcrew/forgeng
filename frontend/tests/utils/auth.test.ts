import { describe, expect, it } from "vitest";

import { homeForRole, normalizeEmail } from "@utils/auth";

describe("homeForRole", () => {
  it("routes a student to /student", () => {
    expect(homeForRole("student")).toBe("/student");
  });

  it("routes an admin to /admin", () => {
    expect(homeForRole("admin")).toBe("/admin");
  });

  it("routes an applicant to /apply", () => {
    expect(homeForRole("applicant")).toBe("/apply");
  });

  it("falls back to /apply for an unknown role", () => {
    expect(homeForRole("guest" as never)).toBe("/apply");
  });
});

describe("normalizeEmail", () => {
  it("lowercases the address", () => {
    expect(normalizeEmail("Ada@Example.COM")).toBe("ada@example.com");
  });

  it("trims surrounding whitespace", () => {
    expect(normalizeEmail("  ada@example.com  ")).toBe("ada@example.com");
  });

  it("trims and lowercases together", () => {
    expect(normalizeEmail("  Ada@Example.com ")).toBe("ada@example.com");
  });
});
