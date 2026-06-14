import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

import { RegisterDto } from '@modules/auth/dto/register.dto';
import { LoginDto } from '@modules/auth/dto/login.dto';

/** Property names that failed validation for the given plain object. */
function failingProps<T extends object>(
  cls: new () => T,
  obj: Record<string, unknown>,
): string[] {
  const instance = plainToInstance(cls, obj);
  return validateSync(instance).map((e) => e.property);
}

describe('RegisterDto', () => {
  const valid = {
    email: 'ada@example.com',
    password: 'pass1234',
    name: 'Ada',
  };

  it('accepts a valid registration', () => {
    expect(failingProps(RegisterDto, valid)).toEqual([]);
  });

  it('rejects a malformed email', () => {
    expect(
      failingProps(RegisterDto, { ...valid, email: 'not-an-email' }),
    ).toContain('email');
  });

  it('rejects a password with no digit', () => {
    expect(
      failingProps(RegisterDto, { ...valid, password: 'onlyletters' }),
    ).toContain('password');
  });

  it('rejects a password shorter than 8 characters', () => {
    expect(failingProps(RegisterDto, { ...valid, password: 'ab1' })).toContain(
      'password',
    );
  });

  it('allows an omitted name (optional)', () => {
    expect(
      failingProps(RegisterDto, {
        email: valid.email,
        password: valid.password,
      }),
    ).toEqual([]);
  });

  it('rejects a name over 120 characters', () => {
    expect(
      failingProps(RegisterDto, { ...valid, name: 'a'.repeat(121) }),
    ).toContain('name');
  });
});

describe('LoginDto', () => {
  const valid = { email: 'ada@example.com', password: 'whatever' };

  it('accepts a valid login', () => {
    expect(failingProps(LoginDto, valid)).toEqual([]);
  });

  it('rejects a malformed email', () => {
    expect(failingProps(LoginDto, { ...valid, email: 'nope' })).toContain(
      'email',
    );
  });

  it('rejects an empty password', () => {
    expect(failingProps(LoginDto, { ...valid, password: '' })).toContain(
      'password',
    );
  });
});
