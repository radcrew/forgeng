import { describe, expect, it } from "vitest";

import {
  APPLICATION_FORM_SCHEMA,
  APPLICATION_FORM_TOTAL_STEPS,
  APPLICATION_STEP_SLUGS,
  isApplicationStepSlug,
} from "@constants/applications/apply-form";

// A valid baseline; individual tests override single fields to assert failures.
const VALID = {
  name: "Ada Lovelace",
  background: "I have been building software for several years now.",
  experience: "Backend and systems work.",
  motivation: "I want to deepen my craft alongside strong engineers.",
  linkedin: "https://linkedin.com/in/ada",
  twitter: "",
  facebook: "",
  github: "https://github.com/ada",
  portfolio: "",
  telegram: "",
  whatsapp: "",
  country: "US",
  videoUrl: "https://example.com/intro.mp4",
  wallet: { chain: "evm" as const, address: "" },
};

describe("APPLICATION_FORM_SCHEMA", () => {
  it("accepts a valid application", () => {
    expect(APPLICATION_FORM_SCHEMA.safeParse(VALID).success).toBe(true);
  });

  it("rejects a blank name", () => {
    const result = APPLICATION_FORM_SCHEMA.safeParse({ ...VALID, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a too-short background", () => {
    const result = APPLICATION_FORM_SCHEMA.safeParse({
      ...VALID,
      background: "too short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-profile github URL", () => {
    const result = APPLICATION_FORM_SCHEMA.safeParse({
      ...VALID,
      github: "https://example.com/ada",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown country code", () => {
    const result = APPLICATION_FORM_SCHEMA.safeParse({
      ...VALID,
      country: "ZZ",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a valid EVM wallet address", () => {
    const result = APPLICATION_FORM_SCHEMA.safeParse({
      ...VALID,
      wallet: { chain: "evm", address: "0x" + "a".repeat(40) },
    });
    expect(result.success).toBe(true);
  });

  it("rejects an EVM address that is not 0x + 40 hex chars", () => {
    const result = APPLICATION_FORM_SCHEMA.safeParse({
      ...VALID,
      wallet: { chain: "evm", address: "0x123" },
    });
    expect(result.success).toBe(false);
  });

  it("allows a blank wallet address (skipped withdrawal address)", () => {
    const result = APPLICATION_FORM_SCHEMA.safeParse({
      ...VALID,
      wallet: { chain: "solana", address: "" },
    });
    expect(result.success).toBe(true);
  });

  it("accepts and trims a portfolio URL with surrounding whitespace", () => {
    const result = APPLICATION_FORM_SCHEMA.safeParse({
      ...VALID,
      portfolio: "  https://ada.dev  ",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.portfolio).toBe("https://ada.dev");
  });
});

describe("isApplicationStepSlug", () => {
  it("recognizes a real step slug", () => {
    expect(isApplicationStepSlug("background")).toBe(true);
  });

  it("rejects an unknown slug", () => {
    expect(isApplicationStepSlug("not-a-step")).toBe(false);
  });

  it("rejects undefined", () => {
    expect(isApplicationStepSlug(undefined)).toBe(false);
  });

  it("counts total steps to match the slug list", () => {
    expect(APPLICATION_FORM_TOTAL_STEPS).toBe(APPLICATION_STEP_SLUGS.length);
  });
});
