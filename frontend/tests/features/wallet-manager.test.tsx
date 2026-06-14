import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getWallets = vi.fn();
const updateWallets = vi.fn();
vi.mock("@features/profile/api", () => ({
  getWallets: (...args: unknown[]) => getWallets(...args),
  updateWallets: (...args: unknown[]) => updateWallets(...args),
}));

const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}));

import { WalletManager } from "@features/profile/components/wallet-manager";

const EVM_ADDRESS = "0x" + "a".repeat(40);

beforeEach(() => {
  vi.clearAllMocks();
  getWallets.mockResolvedValue([]);
  updateWallets.mockResolvedValue([{ chain: "evm", address: EVM_ADDRESS }]);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("WalletManager", () => {
  it("requires an address before saving", async () => {
    render(<WalletManager />);
    await waitFor(() => expect(getWallets).toHaveBeenCalled());

    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByText("Address is required.")).toBeInTheDocument();
    expect(updateWallets).not.toHaveBeenCalled();
  });

  it("rejects an address that fails the chain pattern", async () => {
    render(<WalletManager />);
    await waitFor(() => expect(getWallets).toHaveBeenCalled());

    await userEvent.type(screen.getByPlaceholderText("0x…"), "0x123");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByText("Invalid BSC address.")).toBeInTheDocument();
    expect(updateWallets).not.toHaveBeenCalled();
  });

  it("saves a valid EVM address", async () => {
    render(<WalletManager />);
    await waitFor(() => expect(getWallets).toHaveBeenCalled());

    await userEvent.type(screen.getByPlaceholderText("0x…"), EVM_ADDRESS);
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(updateWallets).toHaveBeenCalledWith([
        { chain: "evm", address: EVM_ADDRESS },
      ]),
    );
    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());
  });

  it("loads and displays an existing wallet", async () => {
    getWallets.mockResolvedValue([{ chain: "evm", address: EVM_ADDRESS }]);
    render(<WalletManager />);

    await waitFor(() =>
      expect(screen.getByText("Your withdrawal address")).toBeInTheDocument(),
    );
    expect(screen.getByDisplayValue(EVM_ADDRESS)).toBeInTheDocument();
  });

  it("removes an existing wallet", async () => {
    getWallets.mockResolvedValue([{ chain: "evm", address: EVM_ADDRESS }]);
    updateWallets.mockResolvedValue([]);
    render(<WalletManager />);

    await waitFor(() =>
      expect(screen.getByDisplayValue(EVM_ADDRESS)).toBeInTheDocument(),
    );

    // The remove button is the icon-only button after Save.
    const buttons = screen.getAllByRole("button");
    await userEvent.click(buttons[buttons.length - 1]);

    await waitFor(() => expect(updateWallets).toHaveBeenCalledWith([]));
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith("Wallet removed."));
  });
});
