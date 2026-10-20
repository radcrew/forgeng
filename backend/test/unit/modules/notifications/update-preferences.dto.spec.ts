import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

import { UpdateNotificationPreferencesDto } from '@modules/notifications/dto/update-notification-preferences.dto';

const errorsFor = (body: Record<string, unknown>) =>
  validateSync(plainToInstance(UpdateNotificationPreferencesDto, body)).map(
    (e) => e.property,
  );

describe('UpdateNotificationPreferencesDto', () => {
  it('accepts turning the Slack messages off and on', () => {
    expect(errorsFor({ feedbackSlack: false })).toEqual([]);
    expect(errorsFor({ feedbackSlack: true })).toEqual([]);
  });

  it('refuses a Slack setting that is not true or false', () => {
    expect(errorsFor({ feedbackSlack: 'yes' })).toEqual(['feedbackSlack']);
  });
});
