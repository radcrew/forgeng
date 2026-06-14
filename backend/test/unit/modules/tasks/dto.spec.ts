import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

import { CreateTaskDto } from '@modules/tasks/dto/create-task.dto';

function failingProps(obj: Record<string, unknown>): string[] {
  const instance = plainToInstance(CreateTaskDto, obj);
  return validateSync(instance).map((e) => e.property);
}

describe('CreateTaskDto', () => {
  const valid = {
    cohortId: 1,
    title: 'Build a CLI',
    type: 'project',
  };

  it('accepts a minimal valid task', () => {
    expect(failingProps(valid)).toEqual([]);
  });

  it('rejects a cohortId below 1', () => {
    expect(failingProps({ ...valid, cohortId: 0 })).toContain('cohortId');
  });

  it('rejects an empty title', () => {
    expect(failingProps({ ...valid, title: '' })).toContain('title');
  });

  it('rejects an unknown task type', () => {
    expect(failingProps({ ...valid, type: 'nonsense' })).toContain('type');
  });

  it('rejects a non-ISO dueDate', () => {
    expect(failingProps({ ...valid, dueDate: 'next tuesday' })).toContain(
      'dueDate',
    );
  });

  it('accepts an ISO dueDate', () => {
    expect(
      failingProps({ ...valid, dueDate: '2026-02-01T00:00:00.000Z' }),
    ).toEqual([]);
  });

  it('rejects a description over the max length', () => {
    expect(failingProps({ ...valid, description: 'a'.repeat(8001) })).toContain(
      'description',
    );
  });
});
