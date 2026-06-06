/** Frontend route paths used for in-app notification links and email CTAs. */
export const STUDENT_ROUTES = {
  DASHBOARD: '/student/dashboard',
  PROFILE: '/student/profile',
  SUBMISSIONS: '/student/submissions',
  TASK: (id: number) => `/student/tasks/${id}`,
} as const;

export const ADMIN_ROUTES = {
  REVIEWS: '/admin/reviews',
  APPLICATIONS: '/admin/applications',
  USER: (id: number) => `/admin/users/${id}`,
} as const;
