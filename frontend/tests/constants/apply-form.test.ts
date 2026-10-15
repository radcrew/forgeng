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
  linkedin: "https://linkedin.com/in/ada",
  twitter: "",
  github: "https://github.com/ada",
  portfolio: "",
  telegram: "@ada_dev",
  whatsapp: "",
  country: "US",
  videoUrl: "https://example.com/intro.mp4",
  wallet: { chain: "evm" as const, address: "" },
};

describe("APPLICATION_FORM_SCHEMA", () => {
  it("accepts a valid application", () => {
    expect(APPLICATION_FORM_SCHEMA.safeParse(VALID).success).toBe(true);
  });

  it("accepts an application without LinkedIn or GitHub", () => {
    const result = APPLICATION_FORM_SCHEMA.safeParse({
      ...VALID,
      linkedin: "",
      github: "",
    });
    expect(result.success).toBe(true);
  });

  it("accepts WhatsApp instead of Telegram", () => {
    const result = APPLICATION_FORM_SCHEMA.safeParse({
      ...VALID,
      telegram: "",
      whatsapp: "+15551234567",
    });
    expect(result.success).toBe(true);
  });

  it("asks for Telegram or WhatsApp under both fields when neither is given", () => {
    const result = APPLICATION_FORM_SCHEMA.safeParse({
      ...VALID,
      telegram: "",
      whatsapp: "",
    });
    expect(result.success).toBe(false);
    const paths = result.error!.issues.map((i) => i.path.join("."));
    expect(paths).toEqual(expect.arrayContaining(["telegram", "whatsapp"]));
  });

  it("asks for a contact even while the video is still missing", () => {
    // Step 1 is checked before the video exists on step 2.
    const result = APPLICATION_FORM_SCHEMA.safeParse({
      ...VALID,
      telegram: "",
      videoUrl: "",
    });
    const paths = result.error!.issues.map((i) => i.path.join("."));
    expect(paths).toContain("telegram");
  });

  it("rejects a blank name", () => {
    const result = APPLICATION_FORM_SCHEMA.safeParse({ ...VALID, name: "" });
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
    expect(isApplicationStepSlug("social-profiles")).toBe(true);
  });

  it("rejects a removed step slug", () => {
    expect(isApplicationStepSlug("background")).toBe(false);
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
