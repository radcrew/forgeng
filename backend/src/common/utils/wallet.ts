import { createHash } from 'crypto';
import { registerDecorator, type ValidationArguments } from 'class-validator';

export const SUPPORTED_CHAINS = ['evm', 'solana', 'tron'] as const;
export type WalletChain = (typeof SUPPORTED_CHAINS)[number];

// Students see the "evm" network as BSC (BNB Smart Chain), so the message
// names it the same way.
const ADDRESS_MESSAGES: Record<WalletChain, string> = {
  evm: 'Invalid BSC address (0x + 40 hex characters)',
  solana: 'Invalid Solana address',
  tron: 'Invalid Tron address (must start with T)',
};

const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

/** Decodes a base58 string to bytes, or returns null if it isn't base58. */
export function base58Decode(value: string): Uint8Array | null {
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
    if (char !== '1') break;
    bytes.push(0);
  }
  return Uint8Array.from(bytes.reverse());
}

const sha256 = (data: Uint8Array): Buffer =>
  createHash('sha256').update(data).digest();

/**
 * True when the address is a real address on the given chain. Patterns alone
 * overlap (a Tron address also looks like Solana base58), so Solana and Tron
 * addresses are decoded and checked by their bytes.
 */
export function isWalletAddressForChain(
  chain: string,
  address: string,
): boolean {
  switch (chain) {
    case 'evm':
      return /^0x[0-9a-fA-F]{40}$/.test(address);
    case 'solana':
      // A Solana address is a 32-byte public key.
      return base58Decode(address)?.length === 32;
    case 'tron': {
      // A Tron address is 25 bytes: 0x41, a 20-byte account, and a 4-byte
      // checksum of the first 21 bytes.
      const bytes = base58Decode(address);
      if (!bytes || bytes.length !== 25 || bytes[0] !== 0x41) return false;
      const checksum = sha256(sha256(bytes.subarray(0, 21))).subarray(0, 4);
      return checksum.equals(Buffer.from(bytes.subarray(21)));
    }
    default:
      return false;
  }
}

/** Validates an `address` property against the `chain` on the same object. */
export function IsWalletAddressForChain() {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isWalletAddressForChain',
      target: object.constructor,
      propertyName,
      validator: {
        validate(value: unknown, args: ValidationArguments): boolean {
          const { chain } = args.object as { chain: string };
          return (
            typeof value === 'string' && isWalletAddressForChain(chain, value)
          );
        },
        defaultMessage(args: ValidationArguments): string {
          const { chain } = args.object as { chain: string };
          return (
            ADDRESS_MESSAGES[chain as WalletChain] ?? 'Invalid wallet address'
          );
        },
      },
    });
  };
}
