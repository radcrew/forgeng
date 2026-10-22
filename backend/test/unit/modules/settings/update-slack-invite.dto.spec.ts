import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

import { UpdateSlackInviteDto } from '@modules/settings/dto/update-slack-invite.dto';

const LINK = 'https://join.slack.com/t/forgeng/shared_invite/zt-abc123';

const check = (slackInviteUrl: unknown) => {
  const dto = plainToInstance(UpdateSlackInviteDto, { slackInviteUrl });
  return { dto, errors: validateSync(dto) };
};

describe('UpdateSlackInviteDto', () => {
  it('accepts a Slack invite link', () => {
    expect(check(LINK).errors).toEqual([]);
  });

  it('trims spaces around a pasted link', () => {
    const { dto, errors } = check(`  ${LINK} `);

    expect(errors).toEqual([]);
    expect(dto.slackInviteUrl).toBe(LINK);
  });

  it.each([null, '', '   '])('clears the link for %p', (value) => {
    const { dto, errors } = check(value);

    expect(errors).toEqual([]);
    expect(dto.slackInviteUrl).toBeNull();
  });

  it.each([
    'https://evil.example.com/join',
    'http://join.slack.com/t/forgeng/shared_invite/zt-abc',
    'https://join.slack.com.evil.example/x',
    'javascript:alert(1)',
    'https://join.slack.com/',
  ])('refuses a link that is not a Slack invite: %s', (url) => {
    expect(check(url).errors).not.toEqual([]);
  });

  it('refuses a missing link', () => {
    const dto = plainToInstance(UpdateSlackInviteDto, {});

    expect(validateSync(dto)).not.toEqual([]);
  });
});
