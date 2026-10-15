import { describe, expect, it } from "vitest";

import { telegramHref, whatsappHref } from "@utils/url";

describe("telegramHref", () => {
  it("links an @username", () => {
    expect(telegramHref("@ada_dev")).toBe("https://t.me/ada_dev");
  });

  it("keeps a t.me link", () => {
    expect(telegramHref("https://t.me/ada_dev")).toBe("https://t.me/ada_dev");
  });

  it("returns null for anything else", () => {
    expect(telegramHref("javascript:alert(1)")).toBeNull();
    expect(telegramHref("ada")).toBeNull();
  });
});

describe("whatsappHref", () => {
  it("links a number with country code", () => {
    expect(whatsappHref("+15551234567")).toBe("https://wa.me/15551234567");
  });

  it("returns null for anything else", () => {
    expect(whatsappHref("555-1234")).toBeNull();
  });
});
