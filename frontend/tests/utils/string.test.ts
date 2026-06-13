import { formatStatusLabel, initials } from "@utils/string";

describe("formatStatusLabel", () => {
  it("replaces underscores with spaces", () => {
    expect(formatStatusLabel("in_review")).toBe("in review");
  });

  it("replaces every underscore, not just the first", () => {
    expect(formatStatusLabel("waiting_for_payment")).toBe(
      "waiting for payment",
    );
  });

  it("leaves a single-word status unchanged", () => {
    expect(formatStatusLabel("pending")).toBe("pending");
  });

  it("returns an empty string unchanged", () => {
    expect(formatStatusLabel("")).toBe("");
  });
});

describe("initials", () => {
  it("takes the first two characters of a name, uppercased", () => {
    expect(initials("Ada Lovelace", "ada@example.com")).toBe("AD");
  });

  it("trims surrounding whitespace before taking initials", () => {
    expect(initials("  Grace", "g@example.com")).toBe("GR");
  });

  it("falls back to the email when the name is null", () => {
    expect(initials(null, "katherine@example.com")).toBe("KA");
  });

  it("falls back to the email when the name is blank", () => {
    expect(initials("   ", "linus@example.com")).toBe("LI");
  });

  it("uppercases a lowercase name", () => {
    expect(initials("bob", "b@example.com")).toBe("BO");
  });
});
