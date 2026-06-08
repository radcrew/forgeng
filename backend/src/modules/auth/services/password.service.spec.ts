import { PasswordService } from './password.service';

describe('PasswordService', () => {
  const service = new PasswordService();

  it('hashes a password to a non-plaintext bcrypt string', async () => {
    const hash = await service.hash('s3cret-pw');
    expect(hash).not.toBe('s3cret-pw');
    // bcrypt hashes start with the $2a/$2b/$2y identifier.
    expect(hash).toMatch(/^\$2[aby]\$/);
  });

  it('verifies a correct password', async () => {
    const hash = await service.hash('s3cret-pw');
    await expect(service.verify('s3cret-pw', hash)).resolves.toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const hash = await service.hash('s3cret-pw');
    await expect(service.verify('wrong-pw', hash)).resolves.toBe(false);
  });

  it('produces a different hash each call (random salt)', async () => {
    const [a, b] = await Promise.all([
      service.hash('same-input'),
      service.hash('same-input'),
    ]);
    expect(a).not.toBe(b);
  });
});
