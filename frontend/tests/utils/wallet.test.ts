import { describe, expect, it } from "vitest";

import { isWalletAddressForChain } from "@utils/wallet";

const TRON = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
const SOLANA = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const EVM = "0x" + "a".repeat(40);

describe("isWalletAddressForChain", () => {
  it("accepts real addresses on their own chain", () => {
    expect(isWalletAddressForChain("tron", TRON)).toBe(true);
    expect(isWalletAddressForChain("solana", SOLANA)).toBe(true);
    expect(isWalletAddressForChain("evm", EVM)).toBe(true);
  });

  it("rejects a Tron address entered as Solana", () => {
    expect(isWalletAddressForChain("solana", TRON)).toBe(false);
  });

  it("rejects a Solana address entered as Tron", () => {
    expect(isWalletAddressForChain("tron", SOLANA)).toBe(false);
  });

  it("rejects a Tron address entered as EVM", () => {
    expect(isWalletAddressForChain("evm", TRON)).toBe(false);
  });
});
