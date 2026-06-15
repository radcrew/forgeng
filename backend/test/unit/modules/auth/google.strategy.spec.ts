import { ConfigService } from '@nestjs/config';
import { GoogleStrategy } from '@modules/auth/strategies/google.strategy';

function makeStrategy(googleConfig: unknown): GoogleStrategy {
  const config = {
    get: jest.fn().mockReturnValue(googleConfig),
  } as unknown as ConfigService;
  return new GoogleStrategy(config);
}

describe('GoogleStrategy', () => {
  describe('isEnabled', () => {
    it('is disabled when no google config is present', () => {
      expect(makeStrategy(null).isEnabled()).toBe(false);
    });

    it('is enabled when google config is present', () => {
      expect(
        makeStrategy({
          clientId: 'id',
          clientSecret: 'secret',
          callbackUrl: 'https://cb',
        }).isEnabled(),
      ).toBe(true);
    });
  });

  describe('validate', () => {
    it('maps a Google profile into the OAuth DTO', () => {
      const strategy = makeStrategy(null);
      const done = jest.fn();

      strategy.validate(
        'access',
        'refresh',
        {
          id: 'g-123',
          displayName: 'Ada Lovelace',
          emails: [{ value: 'ada@example.com', verified: true }],
          photos: [{ value: 'https://avatar' }],
        } as never,
        done,
      );

      expect(done).toHaveBeenCalledWith(null, {
        provider: 'google',
        providerAccountId: 'g-123',
        email: 'ada@example.com',
        name: 'Ada Lovelace',
        avatarUrl: 'https://avatar',
        emailVerified: true,
      });
    });

    it('handles a profile with no email or photo', () => {
      const strategy = makeStrategy(null);
      const done = jest.fn();

      strategy.validate(
        'access',
        'refresh',
        { id: 'g-1', displayName: 'X' } as never,
        done,
      );

      const [, dto] = done.mock.calls[0] as [
        unknown,
        { email: string | null; avatarUrl: string | null },
      ];
      expect(dto.email).toBeNull();
      expect(dto.avatarUrl).toBeNull();
    });
  });
});
