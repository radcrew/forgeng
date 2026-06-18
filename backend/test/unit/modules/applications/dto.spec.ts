// Nested wallet validation (@ValidateNested + @Type) needs reflect-metadata,
// which the app loads at bootstrap but a standalone unit test must import.
import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

import { CreateApplicationDto } from '@modules/applications/dto/create-application.dto';

function failingProps(obj: Record<string, unknown>): string[] {
  const instance = plainToInstance(CreateApplicationDto, obj);
  return validateSync(instance).map((e) => e.property);
}

const VALID = {
  motivation: 'I want to build great software with great people.',
  background: 'Several years of backend and systems work.',
  linkedin: 'https://linkedin.com/in/ada',
  github: 'https://github.com/ada',
  videoUrl: 'https://example.com/intro.mp4',
  country: 'US',
};

describe('CreateApplicationDto', () => {
  it('accepts a valid minimal application', () => {
    expect(failingProps(VALID)).toEqual([]);
  });

  it('rejects a non-profile linkedin URL', () => {
    expect(
      failingProps({ ...VALID, linkedin: 'https://example.com/ada' }),
    ).toContain('linkedin');
  });

  it('rejects a non-profile github URL', () => {
    expect(
      failingProps({ ...VALID, github: 'https://example.com/ada' }),
    ).toContain('github');
  });

  it('rejects an unknown country code', () => {
    expect(failingProps({ ...VALID, country: 'ZZ' })).toContain('country');
  });

  it('rejects a whatsapp number without a country code', () => {
    expect(failingProps({ ...VALID, whatsapp: '5551234' })).toContain(
      'whatsapp',
    );
  });

  it('accepts a valid EVM wallet address', () => {
    expect(
      failingProps({
        ...VALID,
        wallets: [{ chain: 'evm', address: '0x' + 'a'.repeat(40) }],
      }),
    ).toEqual([]);
  });

  it('rejects an EVM address that is not 0x + 40 hex chars', () => {
    expect(
      failingProps({
        ...VALID,
        wallets: [{ chain: 'evm', address: '0x123' }],
      }),
    ).toContain('wallets');
  });

  it('rejects more than one wallet address', () => {
    expect(
      failingProps({
        ...VALID,
        wallets: [
          { chain: 'evm', address: '0x' + 'a'.repeat(40) },
          { chain: 'tron', address: 'T' + '1'.repeat(33) },
        ],
      }),
    ).toContain('wallets');
  });
});
