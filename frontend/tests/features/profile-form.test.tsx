import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const updateProfile = vi.fn();
const uploadAvatar = vi.fn();
vi.mock("@features/profile/api", () => ({
  updateProfile: (...args: unknown[]) => updateProfile(...args),
  uploadAvatar: (...args: unknown[]) => uploadAvatar(...args),
}));

const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}));

import type { UserProfile } from "@types";
import { ProfileForm } from "@features/profile/components/profile-form";

function makeUser(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 1,
    name: "Ada Lovelace",
    email: "ada@example.com",
    role: "student",
    bio: "Engineer",
    avatarUrl: null,
    github: "https://github.com/ada",
    linkedin: "",
    twitter: "",
    facebook: "",
    portfolio: "",
    telegram: "",
    whatsapp: "",
    createdAt: "2026-01-15T10:30:00.000Z",
    ...overrides,
  } as UserProfile;
}

beforeEach(() => {
  vi.clearAllMocks();
  updateProfile.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ProfileForm", () => {
  it("renders the email and an initials avatar fallback when none is set", () => {
    render(<ProfileForm user={makeUser()} />);
    expect(screen.getByText("ada@example.com")).toBeInTheDocument();
    // No avatar image; initials are shown instead.
    expect(screen.getByText("AD")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Upload photo" }),
    ).toBeInTheDocument();
  });

  it("shows a change-photo button when an avatar is present", () => {
    render(
      <ProfileForm
        user={makeUser({ avatarUrl: "/api/uploads/avatars/a.png" })}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Change photo" }),
    ).toBeInTheDocument();
  });

  it("submits a trimmed payload with only the filled optional fields", async () => {
    const onSaved = vi.fn();
    render(<ProfileForm user={makeUser()} onSaved={onSaved} />);

    await userEvent.click(
      screen.getByRole("button", { name: "Save Changes" }),
    );

    await waitFor(() => expect(updateProfile).toHaveBeenCalledTimes(1));
    const payload = updateProfile.mock.calls[0][0] as Record<string, unknown>;
    expect(payload).toMatchObject({
      name: "Ada Lovelace",
      bio: "Engineer",
      github: "https://github.com/ada",
    });
    // Empty optionals are omitted, not sent as "".
    expect(payload).not.toHaveProperty("linkedin");
    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it("blocks submission when a social URL is invalid", async () => {
    render(<ProfileForm user={makeUser({ github: "" })} />);

    const github = screen.getByPlaceholderText("https://github.com/you");
    await userEvent.type(github, "not-a-url");
    await userEvent.click(
      screen.getByRole("button", { name: "Save Changes" }),
    );

    // Zod validation fails, so the API is never called.
    await waitFor(() =>
      expect(screen.getByText("Save Changes")).toBeInTheDocument(),
    );
    expect(updateProfile).not.toHaveBeenCalled();
  });
});
