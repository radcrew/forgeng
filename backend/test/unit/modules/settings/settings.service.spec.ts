import { PrismaService } from '@core/database/prisma.service';
import { SettingsService } from '@modules/settings/settings.service';

const LINK = 'https://join.slack.com/t/forgeng/shared_invite/zt-abc123';

describe('SettingsService', () => {
  let prisma: {
    platformSetting: { findUnique: jest.Mock; upsert: jest.Mock };
  };
  let service: SettingsService;

  beforeEach(() => {
    prisma = {
      platformSetting: { findUnique: jest.fn(), upsert: jest.fn() },
    };
    service = new SettingsService(prisma as unknown as PrismaService);
  });

  describe('Slack invite', () => {
    it('reads the saved link', async () => {
      prisma.platformSetting.findUnique.mockResolvedValue({
        slackInviteUrl: LINK,
      });

      await expect(service.getSlackInvite()).resolves.toEqual({
        slackInviteUrl: LINK,
      });
    });

    it('reads no link before the settings row exists', async () => {
      prisma.platformSetting.findUnique.mockResolvedValue(null);

      await expect(service.getSlackInvite()).resolves.toEqual({
        slackInviteUrl: null,
      });
    });

    it('saves the link, creating the settings row if needed', async () => {
      prisma.platformSetting.upsert.mockResolvedValue({ slackInviteUrl: LINK });

      await expect(service.updateSlackInvite(LINK)).resolves.toEqual({
        slackInviteUrl: LINK,
      });
      expect(prisma.platformSetting.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          update: { slackInviteUrl: LINK },
          create: { id: 1, slackInviteUrl: LINK },
        }),
      );
    });

    it('keeps the link out of the settings everyone can read', async () => {
      prisma.platformSetting.upsert.mockResolvedValue({
        id: 1,
        stipendMonth1: 30,
        stipendMonth2: 50,
        stipendMonth3: 100,
        slackInviteUrl: LINK,
      });

      const settings = await service.get();

      expect(settings).not.toHaveProperty('slackInviteUrl');
    });
  });
});
