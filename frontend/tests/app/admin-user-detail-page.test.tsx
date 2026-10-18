import { Suspense } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
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

let statsState: { data?: unknown } = {};
const record = vi.fn();
let recordPending = false;
let settingsState: { data?: unknown } = {};

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
  useUserPaymentStats: () => ({ ...idle, ...statsState }),
  useRecordPayment: () => ({ record, isPending: recordPending }),
  useNotifyWalletMissing: () => ({ notify: vi.fn(), isPending: false }),
}));

vi.mock("@features/settings", () => ({
  useSettings: () => ({ ...idle, ...settingsState }),
}));

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
  statsState = {};
  settingsState = {};
  record.mockReset();
  recordPending = false;
  record.mockResolvedValue({});
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

  it("records a payment for the stipend month picked, last month by default", async () => {
    userState = { data: sampleUser, isLoading: false, error: null };
    statsState = {
      data: {
        wallets: [{ chain: "evm", address: "0xabc" }],
        monthlyStats: [],
      },
    };
    await renderPage();

    await userEvent.click(
      await screen.findByRole("button", {
        name: /Record payment & notify student/,
      }),
    );

    const now = new Date();
    const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonth = `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, "0")}`;
    const monthInput = screen.getByLabelText("Stipend for");
    expect(monthInput).toHaveValue(lastMonth);

    // Two months ago is always inside the months the chart shows.
    const earlier = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const twoMonthsAgo = `${earlier.getFullYear()}-${String(earlier.getMonth() + 1).padStart(2, "0")}`;
    await userEvent.clear(monthInput);
    await userEvent.type(monthInput, twoMonthsAgo);
    await userEvent.type(screen.getByLabelText("Amount"), "50");
    await userEvent.click(
      screen.getByRole("button", { name: "Confirm & notify" }),
    );

    expect(record).toHaveBeenCalledWith(
      7,
      expect.objectContaining({ amount: 50, forMonth: twoMonthsAgo }),
    );
  });

  it("refuses a stipend month that the payment chart doesn't show", async () => {
    userState = { data: sampleUser, isLoading: false, error: null };
    statsState = {
      data: {
        wallets: [{ chain: "evm", address: "0xabc" }],
        monthlyStats: [],
      },
    };
    await renderPage();

    await userEvent.click(
      await screen.findByRole("button", {
        name: /Record payment & notify student/,
      }),
    );
    // Next month: saved but never shown, so it could be paid twice.
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextMonth = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
    const monthInput = screen.getByLabelText("Stipend for");
    await userEvent.clear(monthInput);
    await userEvent.type(monthInput, nextMonth);
    await userEvent.type(screen.getByLabelText("Amount"), "50");
    await userEvent.click(
      screen.getByRole("button", { name: "Confirm & notify" }),
    );

    expect(record).not.toHaveBeenCalled();
  });

  it("fills in a stipend amount without changing the currency", async () => {
    userState = { data: sampleUser, isLoading: false, error: null };
    statsState = {
      data: {
        wallets: [{ chain: "evm", address: "0xabc" }],
        monthlyStats: [],
      },
    };
    settingsState = {
      data: { stipendMonth1: "30", stipendMonth2: "50", stipendMonth3: "100" },
    };
    await renderPage();

    await userEvent.click(
      await screen.findByRole("button", {
        name: /Record payment & notify student/,
      }),
    );
    // The label shows the currency that will really be used.
    await userEvent.click(
      screen.getByRole("button", { name: "Month 1 (30 USDT)" }),
    );
    expect(screen.getByLabelText("Amount")).toHaveValue(30);

    await userEvent.click(
      screen.getByRole("button", { name: "Confirm & notify" }),
    );
    expect(record).toHaveBeenCalledWith(
      7,
      expect.objectContaining({ amount: 30, currency: "USDT" }),
    );
  });

  it("keeps the payment dialog open while the payment is saving", async () => {
    userState = { data: sampleUser, isLoading: false, error: null };
    statsState = {
      data: {
        wallets: [{ chain: "evm", address: "0xabc" }],
        monthlyStats: [],
      },
    };
    // A payment is being saved.
    recordPending = true;
    await renderPage();
    await userEvent.click(
      await screen.findByRole("button", {
        name: /Record payment & notify student/,
      }),
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await userEvent.keyboard("{Escape}");

    // Esc doesn't close it while saving.
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("closes the payment dialog with Esc when nothing is saving", async () => {
    userState = { data: sampleUser, isLoading: false, error: null };
    statsState = {
      data: {
        wallets: [{ chain: "evm", address: "0xabc" }],
        monthlyStats: [],
      },
    };
    await renderPage();
    await userEvent.click(
      await screen.findByRole("button", {
        name: /Record payment & notify student/,
      }),
    );

    await userEvent.keyboard("{Escape}");

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("still shows the loading message while the user loads", async () => {
    userState = { data: undefined, isLoading: true, error: null };
    await renderPage();

    expect(await screen.findByText("Loading user…")).toBeInTheDocument();
  });
});
