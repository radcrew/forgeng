import { Suspense } from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@lib/api-client";

let userState: {
  data: unknown;
  isLoading: boolean;
  error: Error | null;
};
const refetchUser = vi.fn();

let enrollmentsState: {
  data: unknown[] | undefined;
  isLoading: boolean;
  error: Error | null;
} = { data: [], isLoading: false, error: null };
const refetchEnrollments = vi.fn();

const sampleUser = {
  id: 7,
  name: "Ada Lovelace",
  email: "ada@example.com",
  emailVerified: true,
  role: "student",
  bio: null,
  githubUrl: null,
  avatarUrl: null,
  createdAt: "2026-01-15T10:30:00.000Z",
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

const idle = {
  data: undefined,
  isLoading: false,
  error: null,
  refetch: vi.fn(),
};

vi.mock("@features/users/hooks", () => ({
  useUser: () => ({ ...userState, refetch: refetchUser }),
  useUserEnrollments: () => ({
    ...enrollmentsState,
    refetch: refetchEnrollments,
  }),
  useUserPaymentStats: () => idle,
  useRecordPayment: () => ({ record: vi.fn(), isPending: false }),
  useNotifyWalletMissing: () => ({ notify: vi.fn(), isPending: false }),
}));

vi.mock("@features/settings", () => ({ useSettings: () => idle }));

import UserDetailPage from "../../src/app/admin/users/[id]/page";

// The page reads its id from a promise, so wait for it inside Suspense.
const renderPage = async (id = "7") => {
  await act(async () => {
    render(
      <Suspense fallback={null}>
        <UserDetailPage params={Promise.resolve({ id })} />
      </Suspense>,
    );
  });
};

beforeEach(() => {
  refetchUser.mockClear();
  enrollmentsState = { data: [], isLoading: false, error: null };
});

describe("admin user detail page", () => {
  it("says the user doesn't exist when the server answers 404", async () => {
    userState = {
      data: undefined,
      isLoading: false,
      error: new ApiError(404, "User not found."),
    };
    await renderPage();

    expect(
      await screen.findByText(
        "This user doesn't exist. They may have been deleted.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("Loading user…")).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "← Back to Users" }),
    ).toHaveAttribute("href", "/admin/users");
  });

  it("shows an error with a retry for other failures", async () => {
    userState = {
      data: undefined,
      isLoading: false,
      error: new Error("offline"),
    };
    await renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "We couldn't load this user.",
    );
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(refetchUser).toHaveBeenCalledTimes(1);
  });

  it("shows an error, not 'Not enrolled', when enrollments fail to load", async () => {
    userState = { data: sampleUser, isLoading: false, error: null };
    enrollmentsState = {
      data: undefined,
      isLoading: false,
      error: new Error("offline"),
    };
    await renderPage();

    expect(
      await screen.findByText(/We couldn't load the enrollments/),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Not enrolled in any cohort."),
    ).not.toBeInTheDocument();
  });

  it("says 'Not enrolled' once it knows there are no enrollments", async () => {
    userState = { data: sampleUser, isLoading: false, error: null };
    enrollmentsState = { data: [], isLoading: false, error: null };
    await renderPage();

    expect(
      await screen.findByText("Not enrolled in any cohort."),
    ).toBeInTheDocument();
  });

  it("still shows the loading message while the user loads", async () => {
    userState = { data: undefined, isLoading: true, error: null };
    await renderPage();

    expect(await screen.findByText("Loading user…")).toBeInTheDocument();
  });
});
