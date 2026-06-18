import type { User } from '@prisma/client';

import { toUserDto } from './index';

const makeUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 1,
    clerkId: null,
    email: 'ada@example.com',
    emailVerified: true,
    name: 'Ada',
    role: 'student',
    bio: null,
    githubUrl: null,
    avatarUrl: null,
    registrationIp: null,
    registrationCountry: null,
    registrationCity: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  }) as unknown as User;

describe('toUserDto', () => {
  it('serializes createdAt to an ISO string', () => {
    const dto = toUserDto(makeUser());
    expect(dto.createdAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('copies scalar fields straight through', () => {
    const dto = toUserDto(
      makeUser({ email: 'grace@example.com', name: 'Grace' }),
    );
    expect(dto.email).toBe('grace@example.com');
    expect(dto.name).toBe('Grace');
  });

  it('defaults social links to null when no application socials are given', () => {
    const dto = toUserDto(makeUser());
    expect(dto.linkedin).toBeNull();
    expect(dto.github).toBeNull();
    expect(dto.whatsapp).toBeNull();
  });

  it('pulls social links from the provided application socials', () => {
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
  });
});
