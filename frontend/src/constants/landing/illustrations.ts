import type { Illustration } from "@constants/shared/illustration";

/**
 * Marketing illustrations. unDraw (MIT), accent recoloured to the brand.
 */
export const LANDING_ART = {
  hero: {
    src: "/assets/illustrations/hero-co-working.svg",
    width: 1121,
    height: 863,
  },
  mission: {
    src: "/assets/illustrations/mission-team-spirit.svg",
    width: 1138,
    height: 860,
  },
  feedback: {
    src: "/assets/illustrations/feedback-conversation.svg",
    width: 1161,
    height: 712,
  },
  stepApply: {
    src: "/assets/illustrations/step-apply.svg",
    width: 742,
    height: 751,
  },
  stepCohort: {
    src: "/assets/illustrations/step-cohort.svg",
    width: 781,
    height: 756,
  },
  stepTasks: {
    src: "/assets/illustrations/step-tasks.svg",
    width: 1041,
    height: 554,
  },
  stepFeedback: {
    src: "/assets/illustrations/step-feedback.svg",
    width: 1038,
    height: 693,
  },
  stepStipend: {
    src: "/assets/illustrations/step-stipend.svg",
    width: 1118,
    height: 803,
  },
  stepLevelUp: {
    src: "/assets/illustrations/step-level-up.svg",
    width: 852,
    height: 585,
  },
  roleApplicant: {
    src: "/assets/illustrations/role-applicant.svg",
    width: 1084,
    height: 759,
  },
  roleStudent: {
    src: "/assets/illustrations/role-student.svg",
    width: 1059,
    height: 789,
  },
  roleAdmin: {
    src: "/assets/illustrations/role-admin.svg",
    width: 854,
    height: 784,
  },
} as const satisfies Record<string, Illustration>;
