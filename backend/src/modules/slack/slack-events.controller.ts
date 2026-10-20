import {
  Controller,
  Headers,
  HttpCode,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Request } from 'express';

import type { AppConfiguration } from '../../config';
import { Public } from '../../core/auth/public.decorator';
import { verifySlackSignature } from './slack-signature';

interface SlackEnvelope {
  type?: string;
  challenge?: string;
  event?: { type?: string };
}

/**
 * Slack's Events API sends events here, for example when someone joins the
 * workspace. Set the app's "Request URL" to `<backend>/api/slack/events`.
 * Slack waits only 3 seconds, so slow work runs after the answer.
 */
@ApiExcludeController()
@Controller('slack')
export class SlackEventsController {
  private readonly signingSecret: string | null;

  constructor(config: ConfigService<AppConfiguration, true>) {
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
    @Headers('x-slack-request-timestamp') timestamp: string | undefined,
    @Headers('x-slack-signature') signature: string | undefined,
  ): { challenge: string } | undefined {
    if (
      !this.signingSecret ||
      !verifySlackSignature({
        rawBody: req.rawBody,
        timestamp,
        signature,
        signingSecret: this.signingSecret,
      })
    ) {
      throw new UnauthorizedException();
    }

    const envelope = req.body as SlackEnvelope;
    // Slack checks the Request URL once, when it is saved in the app.
    if (envelope.type === 'url_verification') {
      return { challenge: envelope.challenge ?? '' };
    }
    // Other events are answered with an empty 200, so Slack doesn't send
    // them again. They are handled in the next step.
    return undefined;
  }
}
