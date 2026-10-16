import { existsSync } from 'fs';
import { join } from 'path';

import { ADMIN_ROUTES, STUDENT_ROUTES } from '@common/constants/routes';

// Emails and notifications link to these paths, so each one must match a
// page in the frontend app. A wrong path sends people to a 404 page.
const APP_DIR = join(__dirname, '../../../../../frontend/src/app');

/** True when a Next.js page exists for the path, treating ids as [id]. */
const pageExists = (path: string): boolean => {
  const segments = path
    .split('/')
    .filter(Boolean)
    .map((segment) => (/^\d+$/.test(segment) ? '[id]' : segment));
  return existsSync(join(APP_DIR, ...segments, 'page.tsx'));
};

const ROUTES: Record<string, string> = {
  'STUDENT_ROUTES.DASHBOARD': STUDENT_ROUTES.DASHBOARD,
  'STUDENT_ROUTES.PROFILE': STUDENT_ROUTES.PROFILE,
  'STUDENT_ROUTES.SUBMISSIONS': STUDENT_ROUTES.SUBMISSIONS,
  'STUDENT_ROUTES.TASK': STUDENT_ROUTES.TASK(1),
  'ADMIN_ROUTES.REVIEWS': ADMIN_ROUTES.REVIEWS,
  'ADMIN_ROUTES.APPLICATIONS': ADMIN_ROUTES.APPLICATIONS,
  'ADMIN_ROUTES.USER': ADMIN_ROUTES.USER(1),
};

describe('email and notification routes', () => {
  it.each(Object.entries(ROUTES))('%s (%s) is a real page', (_name, path) => {
    expect(pageExists(path)).toBe(true);
  });
});
