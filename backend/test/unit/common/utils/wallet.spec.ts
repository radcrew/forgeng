import { isWalletAddressForChain } from '@common/utils/wallet';

const TRON = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
const SOLANA = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const EVM = '0x' + 'a'.repeat(40);

describe('isWalletAddressForChain', () => {
  it('accepts real addresses on their own chain', () => {
    expect(isWalletAddressForChain('tron', TRON)).toBe(true);
    expect(isWalletAddressForChain('solana', SOLANA)).toBe(true);
    expect(isWalletAddressForChain('evm', EVM)).toBe(true);
  });

  it('rejects a Tron address saved as Solana, even though both are base58', () => {
    expect(isWalletAddressForChain('solana', TRON)).toBe(false);
  });

  it('rejects a Tron address with a typo, because its checksum fails', () => {
    expect(isWalletAddressForChain('tron', TRON.slice(0, -1) + 'u')).toBe(
      false,
    );
  });

  it('rejects an unknown chain', () => {
    expect(isWalletAddressForChain('bitcoin', EVM)).toBe(false);
  });
});
