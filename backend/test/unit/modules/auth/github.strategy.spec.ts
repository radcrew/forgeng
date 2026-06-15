import { ConfigService } from '@nestjs/config';
import { GitHubStrategy } from '@modules/auth/strategies/github.strategy';

function makeStrategy(githubConfig: unknown): GitHubStrategy {
  const config = {
    get: jest.fn().mockReturnValue(githubConfig),
  } as unknown as ConfigService;
  return new GitHubStrategy(config);
}

describe('GitHubStrategy', () => {
  describe('isEnabled', () => {
    it('is disabled when no github config is present', () => {
      expect(makeStrategy(null).isEnabled()).toBe(false);
    });

    it('is enabled when github config is present', () => {
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
    it('prefers the primary email when several are present', () => {
      const strategy = makeStrategy(null);
      const done = jest.fn();

      strategy.validate(
        'access',
        'refresh',
        {
          id: 'gh-1',
          username: 'ada',
          displayName: 'Ada',
          emails: [
            { value: 'secondary@example.com' },
            { value: 'primary@example.com', primary: true },
          ],
          photos: [{ value: 'https://avatar' }],
        } as never,
        done,
      );

      expect(done).toHaveBeenCalledWith(
        null,
        expect.objectContaining({
          provider: 'github',
          providerAccountId: 'gh-1',
          email: 'primary@example.com',
          emailVerified: true,
        }),
      );
    });

    it('falls back to the username and marks unverified without an email', () => {
      const strategy = makeStrategy(null);
      const done = jest.fn();

      strategy.validate(
        'access',
        'refresh',
        { id: 'gh-2', username: 'grace' } as never,
        done,
      );

      expect(done).toHaveBeenCalledWith(
        null,
        expect.objectContaining({
          name: 'grace',
          email: null,
          emailVerified: false,
        }),
      );
    });
  });
});
