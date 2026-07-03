// UpdateWalletsDto uses nested @ValidateNested + @Type, which needs
// reflect-metadata (loaded at app bootstrap, imported here for the unit test).
import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

import { UpdateProfileDto } from '@modules/account/dto/update-profile.dto';
import { UpdateWalletsDto } from '@modules/account/dto/update-wallets.dto';

function failingProps<T extends object>(
  cls: new () => T,
  obj: Record<string, unknown>,
): string[] {
  const instance = plainToInstance(cls, obj);
  return validateSync(instance).map((e) => e.property);
}

describe('UpdateProfileDto', () => {
  it('accepts an all-empty payload (every field optional)', () => {
    expect(failingProps(UpdateProfileDto, {})).toEqual([]);
  });

  it('accepts valid social profile URLs', () => {
    expect(
      failingProps(UpdateProfileDto, {
        name: 'Ada',
        linkedin: 'https://linkedin.com/in/ada',
        github: 'https://github.com/ada',
      }),
    ).toEqual([]);
  });

  it('rejects a non-profile github URL', () => {
    expect(
      failingProps(UpdateProfileDto, { github: 'https://example.com/ada' }),
    ).toContain('github');
  });

  it('rejects a name over 120 characters', () => {
    expect(failingProps(UpdateProfileDto, { name: 'a'.repeat(121) })).toContain(
      'name',
    );
  });

  it('accepts a portfolio URL with incidental surrounding whitespace', () => {
    expect(
      failingProps(UpdateProfileDto, { portfolio: '  https://ada.dev  ' }),
    ).toEqual([]);
  });
});

describe('UpdateWalletsDto', () => {
  it('accepts a single valid EVM wallet', () => {
    expect(
      failingProps(UpdateWalletsDto, {
        wallets: [{ chain: 'evm', address: '0x' + 'a'.repeat(40) }],
      }),
    ).toEqual([]);
  });

  it('accepts an empty wallet array', () => {
    expect(failingProps(UpdateWalletsDto, { wallets: [] })).toEqual([]);
  });

  it('rejects an invalid wallet address', () => {
    expect(
      failingProps(UpdateWalletsDto, {
        wallets: [{ chain: 'evm', address: 'nope' }],
      }),
    ).toContain('wallets');
  });

  it('rejects an unknown chain', () => {
    expect(
      failingProps(UpdateWalletsDto, {
        wallets: [{ chain: 'bitcoin', address: '0x' + 'a'.repeat(40) }],
      }),
    ).toContain('wallets');
  });

  it('rejects more than one wallet', () => {
    expect(
      failingProps(UpdateWalletsDto, {
        wallets: [
          { chain: 'evm', address: '0x' + 'a'.repeat(40) },
          { chain: 'tron', address: 'T' + '1'.repeat(33) },
        ],
      }),
    ).toContain('wallets');
  });
});
