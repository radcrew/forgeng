import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { WalletSection } from "../../src/app/admin/users/[id]/_components/wallet-section";

const base = {
  isLoading: false,
  error: null,
  onRetry: vi.fn(),
  onRemind: vi.fn(),
  reminding: false,
};

describe("WalletSection", () => {
  it("shows a placeholder, not 'No wallet address', while loading", () => {
    render(<WalletSection {...base} wallets={undefined} isLoading />);

    expect(screen.getByTestId("wallet-placeholder")).toBeInTheDocument();
    expect(screen.queryByText(/No wallet address/)).not.toBeInTheDocument();
  });

  it("shows an error with a retry when payment info fails to load", async () => {
    const onRetry = vi.fn();
    render(
      <WalletSection
        {...base}
        wallets={undefined}
        error={new Error("offline")}
        onRetry={onRetry}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "We couldn't load the payment info.",
    );
    expect(screen.queryByText(/No wallet address/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("says 'No wallet address' only once it knows there is none", () => {
    render(<WalletSection {...base} wallets={[]} />);

    expect(screen.getByText(/No wallet address added/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Email student to add wallet" }),
    ).toBeInTheDocument();
  });

  it("lists the wallets, and keeps them while reloading", () => {
    render(
      <WalletSection
        {...base}
        wallets={[{ chain: "evm", address: "0xabc" }]}
        isLoading
      />,
    );

    expect(screen.getByText("0xabc")).toBeInTheDocument();
    expect(screen.queryByTestId("wallet-placeholder")).not.toBeInTheDocument();
  });
});
