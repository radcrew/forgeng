export type FeedbackVerdict = "approved" | "needs-work";

export interface FeedbackSample {
  mentorInitial: string;
  mentorName: string;
  mentorTitle: string;
  verdict: FeedbackVerdict;
  comment: string;
  /** Optional task footer for the approved sample only. */
  taskFooter?: string;
}

export const FEEDBACK_BULLETS: string[] = [
  "Written feedback on every submission",
  "Approve or Needs Work verdict",
  "Resubmit after revisions",
  "Full history preserved for review",
];

export const SAMPLE_FEEDBACK: FeedbackSample[] = [
  {
    mentorInitial: "S",
    mentorName: "Mentor Sarah",
    mentorTitle: "Senior Engineer",
    verdict: "approved",
    comment:
      "Great job handling the edge case in your sort function. Extracting the comparison logic into its own function would make this much easier to unit-test. Really clean solution overall!",
    taskFooter: "Task: Implement a Binary Search Tree",
  },
  {
    mentorInitial: "J",
    mentorName: "Mentor James",
    mentorTitle: "Staff Engineer",
    verdict: "needs-work",
    comment:
      "The core logic is right but error handling is missing. What happens on a 500? Add a try/catch and surface a user-friendly message.",
    taskFooter: "Task: Build a REST API Endpoint",
  },
];

export const FEEDBACK_TESTIMONIAL = {
  quote:
    "The best part of this program is that you get feedback from engineers who actually ship code every day — not automated tests that just check if your output matches.",
  attribution: "— Former Apprentice, now Mid-level Engineer",
} as const;
