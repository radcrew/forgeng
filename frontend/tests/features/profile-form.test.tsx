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

    await userEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => expect(updateProfile).toHaveBeenCalledTimes(1));
    const payload = updateProfile.mock.calls[0][0] as Record<string, unknown>;
    expect(payload).toMatchObject({
      name: "Ada Lovelace",
      github: "https://github.com/ada",
    });
    // Bio is no longer on the form, so a save never clears it.
    expect(payload).not.toHaveProperty("bio");
    // Empty optionals are omitted, not sent as "".
    expect(payload).not.toHaveProperty("linkedin");
    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it("shows only 'Profile saved' when the save works but the reload fails", async () => {
    const onSaved = vi.fn().mockRejectedValue(new Error("network"));
    render(<ProfileForm user={makeUser()} onSaved={onSaved} />);

    await userEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    expect(toastSuccess).toHaveBeenCalledWith("Profile saved.");
    expect(toastError).not.toHaveBeenCalled();
  });

  it("shows only 'Avatar updated' when the upload works but the reload fails", async () => {
    uploadAvatar.mockResolvedValue({ avatarUrl: "https://cdn.example.com/a.png" });
    const onSaved = vi.fn().mockRejectedValue(new Error("network"));
    const { container } = render(
      <ProfileForm user={makeUser()} onSaved={onSaved} />,
    );

    const file = new File(["x"], "me.png", { type: "image/png" });
    await userEvent.upload(
      container.querySelector('input[type="file"]') as HTMLInputElement,
      file,
    );

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    expect(toastSuccess).toHaveBeenCalledWith("Avatar updated.");
    expect(toastError).not.toHaveBeenCalled();
  });

  it("keeps unsaved edits when the user reloads, e.g. after a photo upload", async () => {
    const { rerender } = render(<ProfileForm user={makeUser()} />);

    const name = screen.getByDisplayValue("Ada Lovelace");
    await userEvent.clear(name);
    await userEvent.type(name, "Ada King");

    // A photo upload reloads the user with a new avatar and maybe new data.
    rerender(
      <ProfileForm
        user={makeUser({
          avatarUrl: "https://cdn.example.com/a.png",
          github: "https://github.com/ada-king",
        })}
      />,
    );

    // The typed name stays; the untouched GitHub field updates.
    expect(screen.getByDisplayValue("Ada King")).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("https://github.com/ada-king"),
    ).toBeInTheDocument();
  });

  it("removes a saved field that was emptied", async () => {
    render(<ProfileForm user={makeUser()} />);

    await userEvent.clear(
      screen.getByPlaceholderText("https://github.com/you"),
    );
    await userEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => expect(updateProfile).toHaveBeenCalledTimes(1));
    const payload = updateProfile.mock.calls[0][0] as Record<string, unknown>;
    // GitHub was saved before, so emptying it sends null to remove it.
    expect(payload.github).toBeNull();
    // LinkedIn was already empty, so it is still left out.
    expect(payload).not.toHaveProperty("linkedin");
  });

  it("saves a pasted link that has a space at the end", async () => {
    render(<ProfileForm user={makeUser({ github: "" })} />);

    await userEvent.type(
      screen.getByPlaceholderText("https://github.com/you"),
      "https://github.com/ada ",
    );
    await userEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => expect(updateProfile).toHaveBeenCalledTimes(1));
    const payload = updateProfile.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.github).toBe("https://github.com/ada");
  });

  it("blocks submission when a social URL is invalid", async () => {
    render(<ProfileForm user={makeUser({ github: "" })} />);

    const github = screen.getByPlaceholderText("https://github.com/you");
    await userEvent.type(github, "not-a-url");
    await userEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    // Zod validation fails, so the API is never called.
    await waitFor(() =>
      expect(screen.getByText("Save Changes")).toBeInTheDocument(),
    );
    expect(updateProfile).not.toHaveBeenCalled();
  });
});
