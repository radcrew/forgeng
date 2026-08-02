import type { Illustration } from "@constants/shared/illustration";

/**
 * Illustrations for zero-data states inside the signed-in app.
 */
export const APP_ART = {
  tasks: {
    src: "/assets/illustrations/app-tasks.svg",
    width: 1155,
    height: 796,
  },
  cohort: {
    src: "/assets/illustrations/app-cohort.svg",
    width: 1114,
    height: 844,
  },
  noResults: {
    src: "/assets/illustrations/app-no-results.svg",
    width: 857,
    height: 759,
  },
  notFoundItem: {
    src: "/assets/illustrations/app-not-found-item.svg",
    width: 842,
    height: 779,
  },
  submissions: {
    src: "/assets/illustrations/app-submissions.svg",
    width: 1133,
    height: 839,
  },
  notifications: {
    src: "/assets/illustrations/app-notifications.svg",
    width: 1000,
    height: 842,
  },
  cohorts: {
    src: "/assets/illustrations/app-cohorts.svg",
    width: 729,
    height: 695,
  },
  reviews: {
    src: "/assets/illustrations/app-reviews.svg",
    width: 1010,
    height: 790,
  },
  applications: {
    src: "/assets/illustrations/app-applications.svg",
    width: 820,
    height: 781,
  },
  history: {
    src: "/assets/illustrations/app-history.svg",
    width: 836,
    height: 660,
  },
  pageNotFound: {
    src: "/assets/illustrations/app-page-not-found.svg",
    width: 1097,
    height: 811,
  },
  progress: {
    src: "/assets/illustrations/app-progress.svg",
    width: 1010,
    height: 750,
  },
  onboarding: {
    src: "/assets/illustrations/app-onboarding.svg",
    width: 990,
    height: 758,
  },
} as const satisfies Record<string, Illustration>;
