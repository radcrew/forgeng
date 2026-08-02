export interface RhythmItem {
  label: string;
  description: string;
}

/**
 * The recurring shape of a week in the program. Deliberately not numbered —
 * these repeat, unlike the one-way arc in `STEPS`.
 */
export const DAILY_RHYTHM: RhythmItem[] = [
  {
    label: "Intake Interview",
    description:
      "A conversation before you start, so your mentor knows what you already know.",
  },
  {
    label: "Cohort Sync",
    description:
      "Your cohort meets to unblock each other and compare approaches to the same task.",
  },
  {
    label: "Pair Programming",
    description:
      "Scheduled sessions where you and a peer build the same thing at one keyboard.",
  },
  {
    label: "Code Review",
    description:
      "Every submission gets read line by line and comes back with a verdict.",
  },
  {
    label: "1-on-1 Mentoring",
    description:
      "A standing slot with your mentor to go deep on whatever is hardest right now.",
  },
];
