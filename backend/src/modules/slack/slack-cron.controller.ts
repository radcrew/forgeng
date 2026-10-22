import {
  Controller,
  Get,
  Headers,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiExcludeController } from '@nestjs/swagger';

import { isCronRequest } from '../../common/utils/cron-auth';
import type { AppConfiguration } from '../../config';
import { Public } from '../../core/auth/public.decorator';
import { SlackChannelsService } from '../../core/slack';
import { SlackMembersService } from './slack-members.service';

/**
 * Called once a day by Vercel Cron (see `backend/vercel.json`), with the
 * CRON_SECRET env var as a bearer token, so it needs no user login.
 */
@ApiExcludeController()
@Controller('cron')
export class SlackCronController {
  private readonly logger = new Logger(SlackCronController.name);

  constructor(
    private readonly channels: SlackChannelsService,
    private readonly members: SlackMembersService,
    private readonly config: ConfigService<AppConfiguration, true>,
  ) {}

  @Public()
  @Get('sync-slack-channels')
  async syncSlackChannels(
    @Headers('authorization') authorization: string | undefined,
  ): Promise<{
    linked: number;
    channels: number;
    added: number;
    removed: number;
  }> {
    // Without a secret, nobody can call it.
    if (
      !isCronRequest(
        authorization,
        this.config.get('cronSecret', { infer: true }),
      )
    ) {
      throw new UnauthorizedException();
    }

    // First link people who were in Slack before they were linked, so the
    // channel check below also covers them.
    let linked = 0;
    try {
      linked = await this.members.linkExisting();
    } catch (err) {
      // For example a missing users:read scope. The channel check still runs.
      this.logger.error(
        'Failed to link existing Slack members',
        err instanceof Error ? err.stack : String(err),
      );
    }
    return { linked, ...(await this.channels.reconcileAll()) };
  }
}
