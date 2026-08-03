import type { Illustration } from "@constants/shared/illustration";

/**
 * Marketing illustrations. unDraw (MIT), retinted onto the bright palette: the
 * accent family is rotated per subject and its lightness compressed toward a
 * vivid mid, so the art reads as colour rather than silhouette. `tint` names
 * the panel each one sits on, which is why the two travel together.
 */
export const LANDING_ART = {
  mission: {
    src: "/assets/illustrations/mission-team-spirit.svg",
    width: 1138,
    height: 860,
    tint: "violet",
  },
  stepApply: {
    src: "/assets/illustrations/step-apply.svg",
    width: 742,
    height: 751,
    tint: "cyan",
  },
  stepCohort: {
    src: "/assets/illustrations/step-cohort.svg",
    width: 781,
    height: 756,
    tint: "violet",
  },
  stepTasks: {
    src: "/assets/illustrations/step-tasks.svg",
    width: 1041,
    height: 554,
    tint: "blue",
  },
  stepFeedback: {
    src: "/assets/illustrations/step-feedback.svg",
    width: 1038,
    height: 693,
    tint: "mint",
  },
  stepStipend: {
    src: "/assets/illustrations/step-stipend.svg",
    width: 1118,
    height: 803,
    tint: "amber",
  },
  stepLevelUp: {
    src: "/assets/illustrations/step-level-up.svg",
    width: 852,
    height: 585,
    tint: "rose",
  },
  roleApplicant: {
    src: "/assets/illustrations/role-applicant.svg",
    width: 874,
    height: 748,
    tint: "coral",
  },
  roleStudent: {
    src: "/assets/illustrations/role-student.svg",
    width: 1059,
    height: 789,
    tint: "cyan",
  },
  roleAdmin: {
    src: "/assets/illustrations/role-admin.svg",
    width: 854,
    height: 784,
    tint: "violet",
  },
} as const satisfies Record<string, Illustration>;
