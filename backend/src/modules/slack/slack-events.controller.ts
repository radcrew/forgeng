import { Controller, HttpCode, Logger, Post, Req } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiExcludeController } from '@nestjs/swagger';
import { waitUntil } from '@vercel/functions';
import type { Request } from 'express';

import type { AppConfiguration } from '../../config';
import { Public } from '../../core/auth/public.decorator';
import { SlackMembersService, type SlackMember } from './slack-members.service';
import { assertFromSlack } from './slack-signature';

interface SlackEnvelope {
  type?: string;
  challenge?: string;
  event?: { type?: string; user?: SlackMember };
}

/**
 * Slack's Events API sends events here, for example when someone joins the
 * workspace. Set the app's "Request URL" to `<backend>/api/slack/events`.
 * Slack waits only 3 seconds, so slow work runs after the answer.
 */
@ApiExcludeController()
@Controller('slack')
export class SlackEventsController {
  private readonly logger = new Logger(SlackEventsController.name);
  private readonly signingSecret: string | null;

  constructor(
    private readonly members: SlackMembersService,
    config: ConfigService<AppConfiguration, true>,
  ) {
    this.signingSecret =
      config.get('slack', { infer: true })?.signingSecret ?? null;
  }

  // Public: Slack calls it without a Forgeng login. The signature proves the
  // call comes from Slack.
  @Public()
  @Post('events')
  @HttpCode(200)
  receive(
    @Req() req: RawBodyRequest<Request>,
  ): { challenge: string } | undefined {
    assertFromSlack(req, this.signingSecret);

    const envelope = req.body as SlackEnvelope;
    // Slack checks the Request URL once, when it is saved in the app.
    if (envelope.type === 'url_verification') {
      return { challenge: envelope.challenge ?? '' };
    }
    // Slack waits only 3 seconds, so the work runs after the answer.
    // waitUntil keeps a Vercel function alive until it finishes.
    if (envelope.event?.type === 'team_join' && envelope.event.user) {
      const member = envelope.event.user;
      waitUntil(
        this.members.handleTeamJoin(member).catch((err: unknown) => {
          this.logger.error(
            `Failed to handle Slack member ${member.id ?? '(unknown)'}`,
            err instanceof Error ? err.stack : String(err),
          );
        }),
      );
    }
    // Every event is answered with an empty 200, even one Forgeng ignores,
    // so Slack doesn't send it again.
    return undefined;
  }
}
