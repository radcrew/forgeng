import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const today = Date.now();
const daysFromNow = (days: number): Date =>
  new Date(today + days * 86_400_000);

async function main(): Promise<void> {
  // Users — mirror the frontend mock so a fresh seed lights up every screen.
  const [avery, jordan, sarah, james, riley, sam] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'avery@example.com' },
      update: {},
      create: {
        email: 'avery@example.com',
        name: 'Avery Chen',
        role: 'student',
        githubUrl: 'https://github.com/averychen',
      },
    }),
    prisma.user.upsert({
      where: { email: 'jordan@example.com' },
      update: {},
      create: {
        email: 'jordan@example.com',
        name: 'Jordan Reyes',
        role: 'student',
      },
    }),
    prisma.user.upsert({
      where: { email: 'sarah@example.com' },
      update: {},
      create: {
        email: 'sarah@example.com',
        name: 'Sarah Patel',
        role: 'admin',
        githubUrl: 'https://github.com/sarahp',
      },
    }),
    prisma.user.upsert({
      where: { email: 'james@example.com' },
      update: {},
      create: {
        email: 'james@example.com',
        name: 'James Okafor',
        role: 'admin',
      },
    }),
    prisma.user.upsert({
      where: { email: 'riley@example.com' },
      update: {},
      create: {
        email: 'riley@example.com',
        name: 'Riley Park',
        role: 'admin',
      },
    }),
    prisma.user.upsert({
      where: { email: 'sam@example.com' },
      update: {},
      create: {
        email: 'sam@example.com',
        name: 'Sam Diaz',
        role: 'applicant',
      },
    }),
  ]);

  // Cohorts.
  const spring = await prisma.cohort.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Spring 2026 Cohort',
      description: 'Full-stack engineering apprenticeship — 16 weeks.',
      capacity: 20,
      status: 'active',
      startDate: daysFromNow(-30),
      endDate: daysFromNow(80),
    },
  });
  const summer = await prisma.cohort.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: 'Summer 2026 Cohort',
      description:
        'Frontend specialization — React, accessibility, design systems.',
      capacity: 16,
      status: 'draft',
      startDate: daysFromNow(45),
      endDate: daysFromNow(150),
    },
  });
  await prisma.cohort.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      name: 'Fall 2025 Cohort',
      description: 'Graduated batch — backend track.',
      capacity: 18,
      status: 'completed',
      startDate: daysFromNow(-220),
      endDate: daysFromNow(-30),
    },
  });

  // Enroll the two students in the active cohort.
  await prisma.enrollment.upsert({
    where: { userId_cohortId: { userId: avery.id, cohortId: spring.id } },
    update: {},
    create: { userId: avery.id, cohortId: spring.id },
  });
  await prisma.enrollment.upsert({
    where: { userId_cohortId: { userId: jordan.id, cohortId: spring.id } },
    update: {},
    create: { userId: jordan.id, cohortId: spring.id },
  });

  // Tasks for the active cohort + one draft for the summer cohort.
  const bstTask = await prisma.task.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      cohortId: spring.id,
      title: 'Implement a Binary Search Tree',
      description:
        'Build a generic BST with insert, lookup, delete, and in-order traversal.',
      type: 'coding',
      status: 'published',
      dueDate: daysFromNow(3),
    },
  });
  const readingTask = await prisma.task.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      cohortId: spring.id,
      title: 'Read: Designing Data-Intensive Applications, Ch. 1',
      description:
        'Reliability, scalability, and maintainability. Write a one-page summary.',
      type: 'reading',
      status: 'published',
      dueDate: daysFromNow(7),
    },
  });
  const projectTask = await prisma.task.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      cohortId: spring.id,
      title: 'Project: Build a Realtime Chat App',
      description:
        'Two-week project using WebSockets, with persistence and basic auth.',
      type: 'project',
      status: 'published',
      dueDate: daysFromNow(14),
    },
  });
  await prisma.task.upsert({
    where: { id: 4 },
    update: {},
    create: {
      id: 4,
      cohortId: spring.id,
      title: 'Quiz: HTTP, REST, and Idempotency',
      type: 'quiz',
      status: 'published',
    },
  });
  await prisma.task.upsert({
    where: { id: 5 },
    update: {},
    create: {
      id: 5,
      cohortId: summer.id,
      title: 'Refactor: Extract Pure Functions',
      description:
        'Take an existing endpoint and isolate the business logic from the IO.',
      type: 'coding',
      status: 'draft',
    },
  });

  // Submissions and feedback.
  const sub101 = await prisma.submission.upsert({
    where: { id: 101 },
    update: {},
    create: {
      id: 101,
      taskId: bstTask.id,
      userId: avery.id,
      content:
        'Used recursion for insertion and an iterative approach for lookup. Tests cover all edge cases.',
      repoUrl: 'https://github.com/averychen/bst-apprentice',
      status: 'approved',
    },
  });
  await prisma.submission.upsert({
    where: { id: 102 },
    update: {},
    create: {
      id: 102,
      taskId: readingTask.id,
      userId: avery.id,
      content:
        'Summary attached. Most interesting takeaway: maintainability is about people, not just code.',
      status: 'submitted',
    },
  });
  const sub103 = await prisma.submission.upsert({
    where: { id: 103 },
    update: {},
    create: {
      id: 103,
      taskId: bstTask.id,
      userId: jordan.id,
      content: 'First pass — would appreciate notes on the delete operation.',
      repoUrl: 'https://github.com/jordanr/bst',
      status: 'needs_work',
    },
  });
  await prisma.submission.upsert({
    where: { id: 104 },
    update: {},
    create: {
      id: 104,
      taskId: projectTask.id,
      userId: jordan.id,
      repoUrl: 'https://github.com/jordanr/chat-mvp',
      status: 'submitted',
    },
  });

  await prisma.feedback.upsert({
    where: { id: 201 },
    update: {},
    create: {
      id: 201,
      submissionId: sub101.id,
      reviewerId: sarah.id,
      verdict: 'approved',
      content:
        "Great job handling the edge case in your sort function. Extracting the comparison logic into its own function would make this easier to unit-test. Really clean solution overall!",
    },
  });
  await prisma.feedback.upsert({
    where: { id: 202 },
    update: {},
    create: {
      id: 202,
      submissionId: sub103.id,
      reviewerId: james.id,
      verdict: 'needs_work',
      content:
        'The core logic is right but error handling is missing. What happens on a 500? Add a try/catch and surface a user-friendly message.',
    },
  });

  // Applications — one per pipeline status.
  await prisma.application.upsert({
    where: { id: 301 },
    update: {},
    create: {
      id: 301,
      firstName: 'Sam',
      lastName: 'Diaz',
      email: 'sam@example.com',
      background:
        'Self-taught for two years, currently a QA analyst looking to move into engineering.',
      experience:
        'JavaScript, Node, a bit of Python. Built a side project Slack bot.',
      motivation: 'I want structured feedback, not another video course.',
      status: 'pending',
    },
  });
  await prisma.application.upsert({
    where: { id: 302 },
    update: {},
    create: {
      id: 302,
      firstName: 'Morgan',
      lastName: 'Lee',
      email: 'morgan@example.com',
      background: 'Career switcher from finance. Completed CS50 and a bootcamp.',
      experience: 'Python, SQL, basic React.',
      motivation:
        'I keep getting stuck on the gap between tutorials and real engineering.',
      status: 'reviewing',
      reviewerNote: 'Strong written communication.',
    },
  });
  await prisma.application.upsert({
    where: { id: 303 },
    update: {},
    create: {
      id: 303,
      firstName: 'Taylor',
      lastName: 'Nguyen',
      email: 'taylor@example.com',
      background: 'CS undergrad, looking for project depth before graduation.',
      experience: 'Java, TypeScript, several school group projects.',
      motivation: 'Want mentorship before my first internship.',
      status: 'accepted',
      cohortId: spring.id,
      reviewerNote: 'Accepted into Spring 2026.',
    },
  });
  await prisma.application.upsert({
    where: { id: 304 },
    update: {},
    create: {
      id: 304,
      firstName: 'Quinn',
      lastName: 'Adler',
      email: 'quinn@example.com',
      background: 'Hobbyist for years.',
      experience: 'HTML/CSS only.',
      motivation: 'I want to be a hacker.',
      status: 'rejected',
      reviewerNote:
        'Not enough programming foundation yet — encouraged to reapply next cycle.',
    },
  });

  // Touch the auxiliary user variables so unused-var rules stay happy.
  void riley;
  void sam;

  console.log('Seed complete.');
}

main()
  .catch((e: unknown) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
