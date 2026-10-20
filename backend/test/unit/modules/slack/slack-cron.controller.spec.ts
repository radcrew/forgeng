import { Logger, UnauthorizedException } from '@nestjs/common';
import { SlackChannelsService } from '@core/slack';
import { SlackCronController } from '@modules/slack/slack-cron.controller';
import { SlackMembersService } from '@modules/slack/slack-members.service';

const CHECK = { channels: 2, added: 1, removed: 0 };

describe('SlackCronController', () => {
  let channels: { reconcileAll: jest.Mock };
  let members: { linkExisting: jest.Mock };
  let controller: SlackCronController;
  const run = () => controller.syncSlackChannels('Bearer cron-secret');

  beforeEach(() => {
    channels = { reconcileAll: jest.fn().mockResolvedValue(CHECK) };
    members = { linkExisting: jest.fn().mockResolvedValue(3) };
    controller = new SlackCronController(
      channels as unknown as SlackChannelsService,
      members as unknown as SlackMembersService,
      { get: () => 'cron-secret' } as never,
    );
  });

  afterEach(() => jest.restoreAllMocks());

  it('links existing members first, then checks the channels', async () => {
    await expect(run()).resolves.toEqual({ linked: 3, ...CHECK });

    expect(members.linkExisting.mock.invocationCallOrder[0]).toBeLessThan(
      channels.reconcileAll.mock.invocationCallOrder[0],
    );
  });

  it('still checks the channels when linking fails', async () => {
    const logError = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    members.linkExisting.mockRejectedValue(
      new Error('Slack refused users.list: missing_scope'),
    );

    await expect(run()).resolves.toEqual({ linked: 0, ...CHECK });
    expect(logError).toHaveBeenCalled();
  });

  it('refuses a call without the cron secret', async () => {
    await expect(controller.syncSlackChannels(undefined)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(members.linkExisting).not.toHaveBeenCalled();
  });
});
