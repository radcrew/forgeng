import { describe, expect, it } from "vitest";

import type { Application, UserProfile } from "@types";
import { isApplicationComplete, isProfileComplete, mapUserDto } from "@utils/user";
import type { UserDto } from "@utils/user";

const FULL_PROFILE: UserProfile = {
  id: 1,
  name: "Ada Lovelace",
  email: "ada@example.com",
  emailVerified: true,
  role: "student",
  bio: "Builder of engines.",
  githubUrl: "https://github.com/ada",
  avatarUrl: null,
  createdAt: "2026-01-15T10:30:00.000Z",
  linkedin: "https://linkedin.com/in/ada",
  twitter: "https://twitter.com/ada",
  facebook: "https://facebook.com/ada",
  github: "https://github.com/ada",
  portfolio: null,
  telegram: "https://t.me/ada",
  whatsapp: "+15551234567",
  registrationIp: null,
  registrationCountry: null,
  registrationCity: null,
};

describe("isProfileComplete", () => {
  it("returns true with a name and a contact", () => {
    expect(isProfileComplete(FULL_PROFILE)).toBe(true);
  });

  it("needs only one of Telegram or WhatsApp", () => {
    expect(isProfileComplete({ ...FULL_PROFILE, telegram: null })).toBe(true);
    expect(isProfileComplete({ ...FULL_PROFILE, whatsapp: "" })).toBe(true);
  });

  it("returns false with neither Telegram nor WhatsApp", () => {
    expect(
      isProfileComplete({ ...FULL_PROFILE, telegram: null, whatsapp: "" }),
    ).toBe(false);
  });

  it("returns false without a name", () => {
    expect(isProfileComplete({ ...FULL_PROFILE, name: null })).toBe(false);
  });

  it("ignores the optional fields", () => {
    expect(
      isProfileComplete({
        ...FULL_PROFILE,
        bio: null,
        facebook: null,
        linkedin: null,
        github: null,
        twitter: null,
        portfolio: null,
      }),
    ).toBe(true);
  });
});

const FULL_APPLICATION: Application = {
  id: 1,
  userId: 1,
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
  background: "bg",
  experience: "exp",
  motivation: "why",
  linkedin: "https://linkedin.com/in/ada",
  twitter: "https://twitter.com/ada",
  facebook: "https://facebook.com/ada",
  github: "https://github.com/ada",
  portfolio: null,
  telegram: "https://t.me/ada",
  whatsapp: "+15551234567",
  country: "US",
  videoUrl: "https://example.com/v",
  wallets: null,
  status: "pending",
  cohortId: null,
  reviewerNote: null,
  createdAt: "2026-01-15T10:30:00.000Z",
};

describe("isApplicationComplete", () => {
  it("returns true when every required social field is present", () => {
    expect(isApplicationComplete(FULL_APPLICATION)).toBe(true);
  });

  it("does not need LinkedIn or GitHub", () => {
    expect(
      isApplicationComplete({ ...FULL_APPLICATION, linkedin: null, github: null }),
    ).toBe(true);
  });

  it("returns false with neither Telegram nor WhatsApp", () => {
    expect(
      isApplicationComplete({
        ...FULL_APPLICATION,
        telegram: null,
        whatsapp: null,
      }),
    ).toBe(false);
  });
});

describe("mapUserDto", () => {
  it("maps a DTO into a UserProfile preserving fields", () => {
    const dto: UserDto = {
      id: 7,
      email: "grace@example.com",
      emailVerified: false,
      name: "Grace Hopper",
      role: "admin",
      bio: null,
      githubUrl: null,
      avatarUrl: null,
      createdAt: "2026-02-01T00:00:00.000Z",
      linkedin: null,
      twitter: null,
      facebook: null,
      github: null,
      portfolio: null,
      telegram: null,
      whatsapp: null,
      registrationIp: null,
      registrationCountry: null,
      registrationCity: null,
    };

    const profile = mapUserDto(dto);

    expect(profile.id).toBe(7);
    expect(profile.email).toBe("grace@example.com");
    expect(profile.role).toBe("admin");
    expect(profile.name).toBe("Grace Hopper");
  });
});
