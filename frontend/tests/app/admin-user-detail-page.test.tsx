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

const idle = {
  data: undefined,
  isLoading: false,
  error: null,
  refetch: vi.fn(),
};

vi.mock("@features/users/hooks", () => ({
  useUser: () => ({ ...userState, refetch: refetchUser }),
  useUserEnrollments: () => ({ ...idle, data: [] }),
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

  it("still shows the loading message while the user loads", async () => {
    userState = { data: undefined, isLoading: true, error: null };
    await renderPage();

    expect(await screen.findByText("Loading user…")).toBeInTheDocument();
  });
});
