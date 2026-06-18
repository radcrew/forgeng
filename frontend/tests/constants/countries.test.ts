import { describe, expect, it } from "vitest";

import { countryLabel } from "@constants/shared/countries";

describe("countryLabel", () => {
  it("returns the full name for a known code", () => {
    expect(countryLabel("US")).toBe("United States");
    expect(countryLabel("CA")).toBe("Canada");
  });

  it("falls back to the raw code when unknown", () => {
    expect(countryLabel("GB")).toBe("GB");
  });

  it("returns an empty string for null or undefined", () => {
    expect(countryLabel(null)).toBe("");
    expect(countryLabel(undefined)).toBe("");
  });
});
