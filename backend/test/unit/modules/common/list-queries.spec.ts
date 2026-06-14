// Query DTOs use @Type/@Transform coercion, which needs reflect-metadata.
import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

import { ListApplicationsQuery } from '@modules/applications/dto/list-applications.query';
import { ListUsersQuery } from '@modules/users/dto/list-users.query';
import { ListTasksQuery } from '@modules/tasks/dto/list-tasks.query';
import { ListSubmissionsQuery } from '@modules/submissions/dto/list-submissions.query';
import { ListNotificationsQuery } from '@modules/notifications/dto/list-notifications.query';

function validate<T extends object>(
  cls: new () => T,
  obj: Record<string, unknown>,
): { instance: T; props: string[] } {
  const instance = plainToInstance(cls, obj);
  const props = validateSync(instance).map((e) => e.property);
  return { instance, props };
}

describe('ListApplicationsQuery', () => {
  it('accepts an empty query', () => {
    expect(validate(ListApplicationsQuery, {}).props).toEqual([]);
  });

  it('coerces numeric strings for page and pageSize', () => {
    const { instance, props } = validate(ListApplicationsQuery, {
      page: '2',
      pageSize: '50',
    });
    expect(props).toEqual([]);
    expect(instance.page).toBe(2);
    expect(instance.pageSize).toBe(50);
  });

  it('rejects a pageSize over 100', () => {
    expect(
      validate(ListApplicationsQuery, { pageSize: '101' }).props,
    ).toContain('pageSize');
  });

  it('rejects an unknown status', () => {
    expect(
      validate(ListApplicationsQuery, { status: 'archived' }).props,
    ).toContain('status');
  });
});

describe('ListUsersQuery', () => {
  it('rejects an unknown role', () => {
    expect(validate(ListUsersQuery, { role: 'superuser' }).props).toContain(
      'role',
    );
  });

  it('rejects page below 1', () => {
    expect(validate(ListUsersQuery, { page: '0' }).props).toContain('page');
  });
});

describe('ListTasksQuery', () => {
  it('coerces cohortId from a string', () => {
    const { instance, props } = validate(ListTasksQuery, { cohortId: '3' });
    expect(props).toEqual([]);
    expect(instance.cohortId).toBe(3);
  });
});

describe('ListSubmissionsQuery', () => {
  it('rejects an unknown status', () => {
    expect(validate(ListSubmissionsQuery, { status: 'nope' }).props).toContain(
      'status',
    );
  });

  it('accepts valid taskId and cohortId strings', () => {
    expect(
      validate(ListSubmissionsQuery, { taskId: '5', cohortId: '3' }).props,
    ).toEqual([]);
  });
});

describe('ListNotificationsQuery', () => {
  it('transforms the string "true" into a boolean', () => {
    const { instance, props } = validate(ListNotificationsQuery, {
      unread: 'true',
    });
    expect(props).toEqual([]);
    expect(instance.unread).toBe(true);
  });

  it('transforms any other value to false', () => {
    const { instance } = validate(ListNotificationsQuery, { unread: 'false' });
    expect(instance.unread).toBe(false);
  });
});
