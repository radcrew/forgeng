import {
  Controller,
  Get,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiExcludeController } from '@nestjs/swagger';

import { isCronRequest } from '../../common/utils/cron-auth';
import type { AppConfiguration } from '../../config';
import { Public } from '../../core/auth/public.decorator';
import { SlackChannelsService } from '../../core/slack';

/**
 * Called once a day by Vercel Cron (see `backend/vercel.json`), with the
 * CRON_SECRET env var as a bearer token, so it needs no user login.
 */
@ApiExcludeController()
@Controller('cron')
export class SlackCronController {
  constructor(
    private readonly channels: SlackChannelsService,
    private readonly config: ConfigService<AppConfiguration, true>,
  ) {}

  @Public()
  @Get('sync-slack-channels')
  syncSlackChannels(
    @Headers('authorization') authorization: string | undefined,
  ): Promise<{ channels: number; added: number; removed: number }> {
    // Without a secret, nobody can call it.
    if (
      !isCronRequest(
        authorization,
        this.config.get('cronSecret', { infer: true }),
      )
    ) {
      throw new UnauthorizedException();
    }
    return this.channels.reconcileAll();
  }
}
