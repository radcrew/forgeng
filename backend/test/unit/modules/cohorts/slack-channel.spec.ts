import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

import { CreateCohortDto } from '@modules/cohorts/dto/create-cohort.dto';
import { UpdateCohortDto } from '@modules/cohorts/dto/update-cohort.dto';

const check = (slackChannelId: unknown) => {
  const dto = plainToInstance(UpdateCohortDto, { slackChannelId });
  return { dto, errors: validateSync(dto).map((e) => e.property) };
};

describe('cohort Slack channel', () => {
  it.each(['C0123ABCD', 'C08XYZ12345', 'G01AB2CD3'])(
    'accepts the channel ID %s',
    (id) => {
      expect(check(id).errors).toEqual([]);
    },
  );

  it('trims spaces around a pasted ID', () => {
    const { dto, errors } = check('  C0123ABCD ');

    expect(errors).toEqual([]);
    expect(dto.slackChannelId).toBe('C0123ABCD');
  });

  it.each([null, '', '   '])('removes the channel for %p', (value) => {
    const { dto, errors } = check(value);

    expect(errors).toEqual([]);
    expect(dto.slackChannelId).toBeNull();
  });

  it('keeps the channel when it is left out', () => {
    const dto = plainToInstance(UpdateCohortDto, { name: 'Spring' });

    expect(validateSync(dto)).toEqual([]);
    expect(dto.slackChannelId).toBeUndefined();
  });

  it.each([
    '#cohort-spring',
    'cohort-spring',
    'c0123abcd',
    'U0123ABCD',
    'https://forgeng.slack.com/archives/C0123ABCD',
  ])('refuses %s, which is not a channel ID', (value) => {
    expect(check(value).errors).toEqual(['slackChannelId']);
  });

  it('applies the same rule when a cohort is created', () => {
    const errors = validateSync(
      plainToInstance(CreateCohortDto, {
        name: 'Spring',
        capacity: 20,
        slackChannelId: '#spring',
      }),
    ).map((e) => e.property);

    expect(errors).toEqual(['slackChannelId']);
  });
});
