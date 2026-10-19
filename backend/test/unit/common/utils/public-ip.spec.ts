import { isLoopbackIp, resolveRegistrationIp } from '@common/utils/public-ip';

describe('isLoopbackIp', () => {
  it('spots this machine in every form', () => {
    expect(isLoopbackIp('127.0.0.1')).toBe(true);
    expect(isLoopbackIp('::ffff:127.0.0.1')).toBe(true);
    expect(isLoopbackIp('::1')).toBe(true);
    expect(isLoopbackIp('203.0.113.45')).toBe(false);
  });
});

describe('resolveRegistrationIp', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock;
  });

  it('keeps a real visitor IP without any lookup', async () => {
    await expect(resolveRegistrationIp('203.0.113.45')).resolves.toBe(
      '203.0.113.45',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('keeps a missing IP missing', async () => {
    await expect(resolveRegistrationIp(undefined)).resolves.toBeUndefined();
  });

  it('uses the public IP for a local request', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('198.51.100.7\n'),
    });
    await expect(resolveRegistrationIp('::ffff:127.0.0.1')).resolves.toBe(
      '198.51.100.7',
    );
  });

  it('never looks up in production, so a proxy setup mistake stays visible', async () => {
    const before = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      await expect(resolveRegistrationIp('127.0.0.1')).resolves.toBe(
        '127.0.0.1',
      );
      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      process.env.NODE_ENV = before;
    }
  });

  it('falls back to 127.0.0.1 when offline', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'));
    await expect(resolveRegistrationIp('::1')).resolves.toBe('127.0.0.1');
  });

  it('falls back to 127.0.0.1 on a bad answer', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('<html>oops</html>'),
    });
    await expect(resolveRegistrationIp('127.0.0.1')).resolves.toBe('127.0.0.1');
  });
});
