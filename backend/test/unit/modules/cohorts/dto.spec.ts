import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

import { CreateCohortDto } from '@modules/cohorts/dto/create-cohort.dto';
import { CreateSubmissionDto } from '@modules/submissions/dto/create-submission.dto';

function failingProps<T extends object>(
  cls: new () => T,
  obj: Record<string, unknown>,
): string[] {
  const instance = plainToInstance(cls, obj);
  return validateSync(instance).map((e) => e.property);
}

describe('CreateCohortDto', () => {
  const valid = { name: 'Spring 2026', capacity: 30 };

  it('accepts a minimal valid cohort', () => {
    expect(failingProps(CreateCohortDto, valid)).toEqual([]);
  });

  it('rejects an empty name', () => {
    expect(failingProps(CreateCohortDto, { ...valid, name: '' })).toContain(
      'name',
    );
  });

  it('rejects a capacity below 1', () => {
    expect(failingProps(CreateCohortDto, { ...valid, capacity: 0 })).toContain(
      'capacity',
    );
  });

  it('rejects an unknown status', () => {
    expect(
      failingProps(CreateCohortDto, { ...valid, status: 'archived?' }),
    ).toContain('status');
  });

  it('rejects a non-ISO startDate', () => {
    expect(
      failingProps(CreateCohortDto, { ...valid, startDate: 'soon' }),
    ).toContain('startDate');
  });
});

describe('CreateSubmissionDto', () => {
  const valid = { taskId: 1 };

  it('accepts a minimal valid submission', () => {
    expect(failingProps(CreateSubmissionDto, valid)).toEqual([]);
  });

  it('rejects a taskId below 1', () => {
    expect(failingProps(CreateSubmissionDto, { taskId: 0 })).toContain(
      'taskId',
    );
  });

  it('rejects an invalid repoUrl', () => {
    expect(
      failingProps(CreateSubmissionDto, { ...valid, repoUrl: 'not a url' }),
    ).toContain('repoUrl');
  });

  it('accepts a valid repoUrl', () => {
    expect(
      failingProps(CreateSubmissionDto, {
        ...valid,
        repoUrl: 'https://github.com/ada/project',
      }),
    ).toEqual([]);
  });
});
