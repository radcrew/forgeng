export interface Faq {
  question: string;
  answer: string;
}

export const FAQS: Faq[] = [
  {
    question: "Do I need a CS degree or prior experience?",
    answer:
      "No. We accept self-taught developers, career switchers, and bootcamp grads alike. The application focuses on motivation and readiness — not credentials. What matters is whether you can put in the hours and you're hungry to actually get good at the craft.",
  },
  {
    question: "How much does it cost?",
    answer:
      "Applications are always free. Tuition for accepted apprentices varies by cohort length and stipend availability — we publish the exact terms in your offer letter. We don't believe in trapping people in long-term debt for short programs.",
  },
  {
    question: "How long is the program?",
    answer:
      "Typical cohorts run 3 to 6 months depending on track, with weekly task deadlines and biweekly mentor reviews. The pace is built for sustainable progress, not burnout.",
  },
  {
    question: "Can I do this while working a full-time job?",
    answer:
      "Most apprentices do. Tasks are async with flexible deadlines, and mentor feedback is asynchronous. Plan for roughly 10 to 15 hours per week to stay on pace with your cohort.",
  },
  {
    question: "Do apprentices actually get paid?",
    answer:
      "Yes. Every month you complete all your assigned tasks on time, you receive a monthly stipend. It's not a salary, but it's real money that recognises the real work you're doing. The exact amount is in your offer letter and scales with your cohort track.",
  },
  {
    question: "How is this different from a bootcamp?",
    answer:
      "Bootcamps front-load lectures and end with a capstone. Forgeng inverts that — from day one you're shipping real tasks reviewed by working engineers. Less classroom, more code review. We're not in the business of teaching syntax; we're in the business of building engineers.",
  },
  {
    question: "Who actually reviews my submissions?",
    answer:
      "Working senior or staff engineers — people writing production code at real companies today. Each cohort has a dedicated lead mentor and a small bench of reviewers, so the feedback you get is consistent and personal.",
  },
];
