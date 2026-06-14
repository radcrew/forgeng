import { describe, expect, it } from "vitest";

import { cn } from "@utils/cn";

describe("cn", () => {
  it("joins multiple class names", () => {
    expect(cn("px-2", "font-bold")).toBe("px-2 font-bold");
  });

  it("drops falsy values", () => {
    expect(cn("px-2", false, null, undefined, "py-1")).toBe("px-2 py-1");
  });

  it("lets a later tailwind class win over a conflicting earlier one", () => {
    // tailwind-merge resolves px-2 vs px-4 to the last one.
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("supports conditional object syntax", () => {
    expect(cn("base", { active: true, hidden: false })).toBe("base active");
  });

  it("returns an empty string when given nothing", () => {
    expect(cn()).toBe("");
  });
});
