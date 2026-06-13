import { PasswordService } from './password.service';

describe('PasswordService', () => {
  const service = new PasswordService();

  it('produces a bcrypt hash that differs from the plaintext', async () => {
    const hash = await service.hash('s3cret-password');
    expect(hash).not.toBe('s3cret-password');
    expect(hash).toMatch(/^\$2[aby]\$/);
  });

  it('produces a different hash each time (random salt)', async () => {
    const [a, b] = await Promise.all([
      service.hash('same-password'),
      service.hash('same-password'),
    ]);
    expect(a).not.toBe(b);
  });

  it('verifies a password against its own hash', async () => {
    const hash = await service.hash('correct horse battery staple');
    await expect(
      service.verify('correct horse battery staple', hash),
    ).resolves.toBe(true);
  });

  it('rejects a password that does not match the hash', async () => {
    const hash = await service.hash('correct horse battery staple');
    await expect(service.verify('wrong password', hash)).resolves.toBe(false);
  });
});
