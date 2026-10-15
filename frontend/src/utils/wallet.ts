const BASE58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

/** Decodes a base58 string to bytes, or returns null if it isn't base58. */
const base58Decode = (value: string): number[] | null => {
  if (!value) return null;
  const bytes: number[] = [];
  for (const char of value) {
    let carry = BASE58.indexOf(char);
    if (carry < 0) return null;
    for (let i = 0; i < bytes.length; i++) {
      carry += bytes[i] * 58;
      bytes[i] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  // Each leading "1" stands for a leading zero byte.
  for (const char of value) {
    if (char !== "1") break;
    bytes.push(0);
  }
  return bytes.reverse();
};

/**
 * True when the address fits the given chain. Patterns alone overlap (a Tron
 * address also looks like Solana base58), so Solana and Tron addresses are
 * decoded and checked by their bytes. The server also checks Tron checksums.
 */
export const isWalletAddressForChain = (
  chain: string,
  address: string,
): boolean => {
  switch (chain) {
    case "evm":
      return /^0x[0-9a-fA-F]{40}$/.test(address);
    case "solana":
      // A Solana address is a 32-byte public key.
      return base58Decode(address)?.length === 32;
    case "tron": {
      // A Tron address is 25 bytes and starts with 0x41.
      const bytes = base58Decode(address);
      return bytes?.length === 25 && bytes[0] === 0x41;
    }
    default:
      return false;
  }
};
