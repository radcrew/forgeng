import { PROFILE_FORM_SCHEMA } from "@features/profile/form-schema";

const blank = {
  name: "",
  bio: "",
  github: "",
  linkedin: "",
  twitter: "",
  facebook: "",
  telegram: "",
  whatsapp: "",
  portfolio: "",
};

describe("PROFILE_FORM_SCHEMA", () => {
  it("accepts an all-blank profile (every field optional to save)", () => {
    expect(PROFILE_FORM_SCHEMA.safeParse(blank).success).toBe(true);
  });

  it("accepts a fully-populated valid profile", () => {
    const result = PROFILE_FORM_SCHEMA.safeParse({
      ...blank,
      name: "Ada Lovelace",
      bio: "Mathematician.",
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

  it("rejects a bio over 2000 characters", () => {
    const result = PROFILE_FORM_SCHEMA.safeParse({
      ...blank,
      bio: "a".repeat(2001),
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
});
