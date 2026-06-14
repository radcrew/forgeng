import {
  FACEBOOK_PROFILE_RE,
  GITHUB_PROFILE_RE,
  LINKEDIN_PROFILE_RE,
  TELEGRAM_RE,
  TWITTER_PROFILE_RE,
  WHATSAPP_RE,
  optionalMatching,
  optionalUrl,
} from "@constants/shared/social-profiles";

describe("LINKEDIN_PROFILE_RE", () => {
  it.each([
    "https://linkedin.com/in/jane-doe",
    "https://www.linkedin.com/in/jane-doe/",
    "https://de.linkedin.com/in/jane",
    "http://linkedin.com/in/jane?trk=x",
  ])("accepts a profile URL: %s", (url) => {
    expect(LINKEDIN_PROFILE_RE.test(url)).toBe(true);
  });

  it.each([
    "https://linkedin.com/company/acme",
    "https://linkedin.com/feed",
    "https://example.com/in/jane",
    "linkedin.com/in/jane",
  ])("rejects a non-profile URL: %s", (url) => {
    expect(LINKEDIN_PROFILE_RE.test(url)).toBe(false);
  });
});

describe("GITHUB_PROFILE_RE", () => {
  it.each([
    "https://github.com/jane",
    "https://www.github.com/jane-doe/",
    "https://github.com/a",
  ])("accepts a user profile: %s", (url) => {
    expect(GITHUB_PROFILE_RE.test(url)).toBe(true);
  });

  it.each([
    "https://github.com/jane/repo",
    "https://github.com/-jane",
    "https://github.com/jane--doe",
    "https://gitlab.com/jane",
  ])("rejects a non-profile URL: %s", (url) => {
    expect(GITHUB_PROFILE_RE.test(url)).toBe(false);
  });
});

describe("TWITTER_PROFILE_RE", () => {
  it.each([
    "https://x.com/jane",
    "https://twitter.com/jane_doe",
    "https://www.x.com/jane/",
  ])("accepts a handle URL: %s", (url) => {
    expect(TWITTER_PROFILE_RE.test(url)).toBe(true);
  });

  it.each([
    "https://x.com/jane/status/123",
    "https://x.com/this_handle_is_way_too_long",
    "https://facebook.com/jane",
  ])("rejects a non-handle URL: %s", (url) => {
    expect(TWITTER_PROFILE_RE.test(url)).toBe(false);
  });
});

describe("FACEBOOK_PROFILE_RE", () => {
  it.each([
    "https://facebook.com/jane.doe",
    "https://www.facebook.com/janedoe/",
    "https://facebook.com/profile.php?id=12345",
    "https://m.facebook.com/jane.doe",
  ])("accepts a profile URL: %s", (url) => {
    expect(FACEBOOK_PROFILE_RE.test(url)).toBe(true);
  });

  it.each(["https://facebook.com/ab", "https://example.com/jane.doe"])(
    "rejects a non-profile URL: %s",
    (url) => {
      expect(FACEBOOK_PROFILE_RE.test(url)).toBe(false);
    },
  );
});

describe("TELEGRAM_RE", () => {
  it.each(["https://t.me/jane_doe", "@jane_doe"])(
    "accepts a t.me URL or @handle: %s",
    (val) => {
      expect(TELEGRAM_RE.test(val)).toBe(true);
    },
  );

  it.each([
    "@jane", // too short (min 5)
    "@1jane", // must start with a letter
    "t.me/jane_doe", // missing scheme
    "https://t.me/x", // too short
  ])("rejects an invalid handle: %s", (val) => {
    expect(TELEGRAM_RE.test(val)).toBe(false);
  });
});

describe("WHATSAPP_RE", () => {
  it.each(["+1234567", "+12345678901234"])(
    "accepts an E.164 number: %s",
    (val) => {
      expect(WHATSAPP_RE.test(val)).toBe(true);
    },
  );

  it.each([
    "1234567", // missing +
    "+0123456", // cannot start with 0
    "+123", // too short
    "+12345678901234567", // too long
  ])("rejects an invalid number: %s", (val) => {
    expect(WHATSAPP_RE.test(val)).toBe(false);
  });
});

describe("optionalMatching", () => {
  const field = optionalMatching(GITHUB_PROFILE_RE, "bad github");

  it("passes when the value is blank", () => {
    expect(field.safeParse("").success).toBe(true);
  });

  it("passes when the value matches the pattern", () => {
    expect(field.safeParse("https://github.com/jane").success).toBe(true);
  });

  it("fails when a non-blank value does not match", () => {
    const result = field.safeParse("https://github.com/jane/repo");
    expect(result.success).toBe(false);
  });
});

describe("optionalUrl", () => {
  it("passes when blank", () => {
    expect(optionalUrl.safeParse("").success).toBe(true);
  });

  it("passes for a valid URL", () => {
    expect(optionalUrl.safeParse("https://example.com").success).toBe(true);
  });

  it("fails for a non-URL string", () => {
    expect(optionalUrl.safeParse("not a url").success).toBe(false);
  });
});
