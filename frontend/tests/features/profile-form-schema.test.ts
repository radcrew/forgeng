import { PROFILE_FORM_SCHEMA } from "@features/profile/form-schema";

const blank = {
  name: "Ada",
  github: "",
  linkedin: "",
  twitter: "",
  telegram: "",
  whatsapp: "",
  portfolio: "",
};

describe("PROFILE_FORM_SCHEMA", () => {
  it("accepts a profile with only a name (every link optional to save)", () => {
    expect(PROFILE_FORM_SCHEMA.safeParse(blank).success).toBe(true);
  });

  it("asks for a name when it is empty or only spaces", () => {
    for (const name of ["", "   "]) {
      const result = PROFILE_FORM_SCHEMA.safeParse({ ...blank, name });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe("Enter your name.");
    }
  });

  it("accepts a fully-populated valid profile", () => {
    const result = PROFILE_FORM_SCHEMA.safeParse({
      ...blank,
      name: "Ada Lovelace",
      github: "https://github.com/ada",
      linkedin: "https://linkedin.com/in/ada",
      twitter: "https://x.com/ada",
      telegram: "@ada_lovelace",
      whatsapp: "+1234567890",
      portfolio: "https://ada.dev",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a name over 120 characters", () => {
    const result = PROFILE_FORM_SCHEMA.safeParse({
      ...blank,
      name: "a".repeat(121),
    });
    expect(result.success).toBe(false);
  });

  it("rejects a github value that is not a profile URL", () => {
    const result = PROFILE_FORM_SCHEMA.safeParse({
      ...blank,
      github: "https://github.com/ada/some-repo",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid whatsapp number", () => {
    const result = PROFILE_FORM_SCHEMA.safeParse({
      ...blank,
      whatsapp: "12345",
    });
    expect(result.success).toBe(false);
  });

  it("accepts and trims a portfolio URL with surrounding whitespace", () => {
    const result = PROFILE_FORM_SCHEMA.safeParse({
      ...blank,
      portfolio: "  https://ada.dev  ",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.portfolio).toBe("https://ada.dev");
  });
});
