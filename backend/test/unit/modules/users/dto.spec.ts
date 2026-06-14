import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

import { RecordPaymentDto } from '@modules/users/dto/record-payment.dto';
import { ResetPasswordDto } from '@modules/auth/dto/reset-password.dto';

function failingProps<T extends object>(
  cls: new () => T,
  obj: Record<string, unknown>,
): string[] {
  const instance = plainToInstance(cls, obj);
  return validateSync(instance).map((e) => e.property);
}

describe('RecordPaymentDto', () => {
  const valid = { amount: 250, currency: 'USDC' };

  it('accepts a valid payment', () => {
    expect(failingProps(RecordPaymentDto, valid)).toEqual([]);
  });

  it('rejects an amount of zero', () => {
    expect(failingProps(RecordPaymentDto, { ...valid, amount: 0 })).toContain(
      'amount',
    );
  });

  it('rejects a non-numeric amount', () => {
    expect(
      failingProps(RecordPaymentDto, { ...valid, amount: 'lots' }),
    ).toContain('amount');
  });

  it('rejects an empty currency', () => {
    expect(
      failingProps(RecordPaymentDto, { ...valid, currency: '' }),
    ).toContain('currency');
  });
});

describe('ResetPasswordDto', () => {
  const valid = { token: 'raw-token', password: 'pass1234' };

  it('accepts a valid reset', () => {
    expect(failingProps(ResetPasswordDto, valid)).toEqual([]);
  });

  it('rejects an empty token', () => {
    expect(failingProps(ResetPasswordDto, { ...valid, token: '' })).toContain(
      'token',
    );
  });

  it('rejects a password failing the policy', () => {
    expect(
      failingProps(ResetPasswordDto, { ...valid, password: 'short' }),
    ).toContain('password');
  });
});
