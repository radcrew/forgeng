import type {
  Application,
  Cohort,
  Feedback,
  Notification,
  NotificationPreference,
  Submission,
  Task,
  User,
} from '@prisma/client';
import {
  profileLinksOf,
  toApplicationDto,
  toCohortDto,
  toFeedbackDto,
  toNotificationDto,
  toNotificationPreferenceDto,
  toSubmissionDto,
  toTaskDto,
  toUserDto,
} from '@common/mappers';

const ISO = '2026-01-15T10:30:00.000Z';
const DATE = new Date(ISO);

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    clerkId: null,
    email: 'ada@example.com',
    emailVerified: true,
    name: 'Ada Lovelace',
    role: 'student',
    bio: null,
    githubUrl: null,
    avatarUrl: null,
    registrationIp: null,
    registrationCountry: null,
    registrationCity: null,
    createdAt: DATE,
    ...overrides,
  } as User;
}

function makeApplication(overrides: Partial<Application> = {}): Application {
  return {
    id: 10,
    userId: 1,
    email: 'ada@example.com',
    firstName: 'Ada',
    lastName: 'Lovelace',
    status: 'pending',
    motivation: null,
    background: null,
    experience: null,
    linkedin: null,
    twitter: null,
    facebook: null,
    github: null,
    portfolio: null,
    telegram: null,
    whatsapp: null,
    country: null,
    videoUrl: null,
    wallets: null,
    reviewerNote: null,
    cohortId: null,
    createdAt: DATE,
    ...overrides,
  } as Application;
}

describe('profileLinksOf', () => {
  it('reads the stored links and fills the rest with null', () => {
    const links = profileLinksOf({
      profileLinks: { github: 'https://github.com/ada', telegram: '@ada_dev' },
    });
    expect(links.github).toBe('https://github.com/ada');
    expect(links.telegram).toBe('@ada_dev');
    expect(links.linkedin).toBeNull();
  });

  it('treats a missing or broken value as no links', () => {
    expect(profileLinksOf({ profileLinks: null }).github).toBeNull();
    expect(profileLinksOf({ profileLinks: { github: 42 } }).github).toBeNull();
  });
});

describe('toUserDto', () => {
  it('converts createdAt to an ISO string', () => {
    expect(toUserDto(makeUser()).createdAt).toBe(ISO);
  });

  it('defaults all social links to null when no application is supplied', () => {
    const dto = toUserDto(makeUser());
    expect(dto.linkedin).toBeNull();
    expect(dto.github).toBeNull();
    expect(dto.whatsapp).toBeNull();
  });

  it('sources social links from the supplied application', () => {
    const dto = toUserDto(makeUser(), {
      linkedin: 'https://linkedin.com/in/ada',
      twitter: null,
      facebook: null,
      github: 'https://github.com/ada',
      portfolio: null,
      telegram: null,
      whatsapp: null,
    });
    expect(dto.linkedin).toBe('https://linkedin.com/in/ada');
    expect(dto.github).toBe('https://github.com/ada');
    expect(dto.twitter).toBeNull();
  });
});

describe('toApplicationDto', () => {
  it('converts createdAt to an ISO string', () => {
    expect(toApplicationDto(makeApplication()).createdAt).toBe(ISO);
  });

  it('passes wallets through as-is', () => {
    const wallets = [{ chain: 'eth', address: '0xabc' }];
    const dto = toApplicationDto(
      makeApplication({
        wallets: wallets as unknown as Application['wallets'],
      }),
    );
    expect(dto.wallets).toEqual(wallets);
  });

  it('preserves a null userId for legacy anonymous rows', () => {
    expect(
      toApplicationDto(makeApplication({ userId: null })).userId,
    ).toBeNull();
  });
});

describe('toCohortDto', () => {
  const cohort = {
    id: 3,
    name: 'Cohort 1',
    description: null,
    status: 'active',
    capacity: 30,
    startDate: DATE,
    endDate: null,
    createdAt: DATE,
  } as Cohort;

  it('injects the supplied enrolledCount', () => {
    expect(toCohortDto(cohort, 12).enrolledCount).toBe(12);
  });

  it('serializes startDate and leaves a null endDate null', () => {
    const dto = toCohortDto(cohort, 0);
    expect(dto.startDate).toBe(ISO);
    expect(dto.endDate).toBeNull();
  });

  it('includes the Slack channel, or null without one', () => {
    expect(
      toCohortDto({ ...cohort, slackChannelId: 'C0123ABCD' }, 0).slackChannelId,
    ).toBe('C0123ABCD');
    expect(toCohortDto(cohort, 0).slackChannelId).toBeNull();
  });
});

describe('toTaskDto', () => {
  const task = {
    id: 5,
    cohortId: 3,
    title: 'Build a CLI',
    description: null,
    type: 'project',
    status: 'open',
    dueDate: null,
    createdAt: DATE,
  } as Task;

  it('injects the supplied submissionCount', () => {
    expect(toTaskDto(task, 7).submissionCount).toBe(7);
  });

  it('leaves a null dueDate null', () => {
    expect(toTaskDto(task, 0).dueDate).toBeNull();
  });
});

describe('toSubmissionDto', () => {
  const submission = {
    id: 8,
    taskId: 5,
    userId: 1,
    content: 'done',
    repoUrl: null,
    status: 'submitted',
    lastSubmittedAt: new Date('2026-01-20T08:00:00.000Z'),
    createdAt: DATE,
  } as Submission;

  it('sends when the work was last sent', () => {
    const dto = toSubmissionDto(submission, null, null, 0);
    expect(dto.lastSubmittedAt).toBe('2026-01-20T08:00:00.000Z');
  });

  it('maps nested task and user when present', () => {
    const task = {
      id: 5,
      cohortId: 3,
      title: 'Build a CLI',
      description: null,
      type: 'project',
      status: 'open',
      dueDate: null,
      createdAt: DATE,
    } as Task;
    const dto = toSubmissionDto(
      submission,
      {
        ...task,
        cohort: { id: 3, name: 'Cohort 1', status: 'active', endDate: null },
      },
      makeUser(),
      2,
    );
    expect(dto.task?.id).toBe(5);
    expect(dto.user?.id).toBe(1);
    expect(dto.feedbackCount).toBe(2);
    expect(dto.cohortEnded).toBe(false);
    expect(dto.cohort).toEqual({ id: 3, name: 'Cohort 1' });
  });

  it('says the cohort ended once it is completed or its end date is over', () => {
    const task = { id: 5, cohortId: 3, createdAt: DATE } as Task;
    const completed = toSubmissionDto(
      submission,
      {
        ...task,
        cohort: { id: 3, name: 'Cohort 1', status: 'completed', endDate: null },
      },
      null,
      0,
    );
    const pastEnd = toSubmissionDto(
      submission,
      {
        ...task,
        cohort: {
          id: 3,
          name: 'Cohort 1',
          status: 'active',
          endDate: new Date('2020-01-01'),
        },
      },
      null,
      0,
    );
    expect(completed.cohortEnded).toBe(true);
    expect(pastEnd.cohortEnded).toBe(true);
  });

  it('leaves task and user null when absent', () => {
    const dto = toSubmissionDto(submission, null, null, 0);
    expect(dto.task).toBeNull();
    expect(dto.user).toBeNull();
    expect(dto.cohort).toBeNull();
  });
});

describe('toFeedbackDto', () => {
  const feedback = {
    id: 9,
    submissionId: 8,
    reviewerId: 2,
    content: 'great work',
    verdict: 'approved',
    createdAt: DATE,
  } as Feedback;

  it('maps the reviewer when present', () => {
    const dto = toFeedbackDto(feedback, makeUser({ id: 2 }));
    expect(dto.reviewer?.id).toBe(2);
  });

  it('keeps the reviewer email and IP address out of the result', () => {
    const dto = toFeedbackDto(
      feedback,
      makeUser({
        id: 2,
        email: 'admin@example.com',
        registrationIp: '1.2.3.4',
      }),
    );
    expect(Object.keys(dto.reviewer ?? {})).toEqual([
      'id',
      'name',
      'avatarUrl',
    ]);
  });

  it('leaves the reviewer null when absent', () => {
    expect(toFeedbackDto(feedback, null).reviewer).toBeNull();
  });
});

describe('toNotificationDto', () => {
  const notification = {
    id: 11,
    type: 'feedback',
    title: 'New feedback',
    body: null,
    link: null,
    readAt: null,
    createdAt: DATE,
  } as Notification;

  it('leaves an unread readAt null', () => {
    expect(toNotificationDto(notification).readAt).toBeNull();
  });

  it('serializes readAt when the notification has been read', () => {
    expect(toNotificationDto({ ...notification, readAt: DATE }).readAt).toBe(
      ISO,
    );
  });
});

describe('toNotificationPreferenceDto', () => {
  it('defaults every channel to true when no row exists', () => {
    expect(toNotificationPreferenceDto(null)).toEqual({
      feedbackInApp: true,
      feedbackEmail: true,
      feedbackSlack: true,
      taskInApp: true,
      taskEmail: true,
    });
  });

  it('reflects the stored preference flags', () => {
    const pref = {
      feedbackInApp: false,
      feedbackEmail: true,
      feedbackSlack: false,
      taskInApp: false,
      taskEmail: false,
    } as NotificationPreference;
    expect(toNotificationPreferenceDto(pref)).toEqual({
      feedbackInApp: false,
      feedbackEmail: true,
      feedbackSlack: false,
      taskInApp: false,
      taskEmail: false,
    });
  });
});
