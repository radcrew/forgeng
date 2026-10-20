import { Controller, HttpCode, Logger, Post, Req } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Request } from 'express';

import type { AppConfiguration } from '../../config';
import { Public } from '../../core/auth/public.decorator';
import { SLACK_ACTIONS } from '../../core/slack';
import { SlackReviewsService } from './slack-reviews.service';
import { assertFromSlack } from './slack-signature';

/** The parts of Slack's interaction payload that Forgeng reads. */
interface SlackInteraction {
  type?: string;
  trigger_id?: string;
  user?: { id?: string };
  actions?: Array<{ action_id?: string; value?: string }>;
}

/**
 * Slack sends button clicks and form submits here. Set the app's
 * Interactivity "Request URL" to `<backend>/api/slack/interactions`.
 * Slack posts a form field named `payload` with JSON inside.
 */
@ApiExcludeController()
@Controller('slack')
export class SlackInteractionsController {
  private readonly logger = new Logger(SlackInteractionsController.name);
  private readonly signingSecret: string | null;

  constructor(
    private readonly reviews: SlackReviewsService,
    config: ConfigService<AppConfiguration, true>,
  ) {
    this.signingSecret =
      config.get('slack', { infer: true })?.signingSecret ?? null;
  }

  // Public: Slack calls it without a Forgeng login. The signature proves the
  // call comes from Slack.
  @Public()
  @Post('interactions')
  @HttpCode(200)
  async receive(@Req() req: RawBodyRequest<Request>): Promise<void> {
    assertFromSlack(req, this.signingSecret);

    const interaction = parsePayload(req.body);
    const action = interaction?.actions?.[0];
    if (
      interaction?.type === 'block_actions' &&
      action?.action_id === SLACK_ACTIONS.APPROVE_SUBMISSION &&
      interaction.trigger_id &&
      interaction.user?.id &&
      action.value
    ) {
      // Not in the background: Slack's trigger id expires 3 seconds after
      // the click, so the form must open before this answers.
      try {
        await this.reviews.openApproveForm({
          triggerId: interaction.trigger_id,
          slackUserId: interaction.user.id,
          submissionId: action.value,
        });
      } catch (err) {
        // The mentor can still review in the app with the Review button.
        this.logger.error(
          'Failed to open the approve form in Slack',
          err instanceof Error ? err.stack : String(err),
        );
      }
    }
    // An empty 200 for everything else, so Slack shows no error.
  }
}

function parsePayload(body: unknown): SlackInteraction | null {
  const raw =
    body && typeof body === 'object'
      ? (body as Record<string, unknown>).payload
      : undefined;
  if (typeof raw !== 'string') return null;
  try {
    return JSON.parse(raw) as SlackInteraction;
  } catch {
    return null;
  }
}
