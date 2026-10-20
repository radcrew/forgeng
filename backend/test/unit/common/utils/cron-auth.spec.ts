import { isCronRequest } from '../../../../src/common/utils/cron-auth';

describe('isCronRequest', () => {
  it('accepts the Vercel Cron secret', () => {
    expect(isCronRequest('Bearer s3cret', 's3cret')).toBe(true);
  });

  it.each([
    ['no header', undefined],
    ['a wrong secret', 'Bearer nope'],
    ['the secret without "Bearer"', 's3cret'],
  ])('refuses %s', (_, header) => {
    expect(isCronRequest(header, 's3cret')).toBe(false);
  });

  it.each([undefined, ''])(
    'refuses everything when no secret is set (%p)',
    (secret) => {
      // Otherwise "Bearer undefined" or "Bearer " would open the route.
      expect(isCronRequest('Bearer undefined', secret)).toBe(false);
      expect(isCronRequest('Bearer ', secret)).toBe(false);
    },
  );
});
