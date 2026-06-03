# Student Portal — Feature Proposals

Ideas for fleshing out the student experience. Grounded in the current code
(`frontend/src/app/student/*`, `frontend/src/features/{dashboard,tasks,submissions}`)
and the existing data model (`backend/prisma/schema.prisma`).

## Where things stand today

The student portal currently has three thin pages:

| Page | Route | What it does |
| --- | --- | --- |
| Dashboard | `/student` | Read-only stat cards: progress %, pending count, next deadline, 5 recent submissions |
| Tasks | `/student/tasks` | Flat list of published tasks; a Submit button per task |
| Submissions | `/student/submissions` | List of own submissions with a detail sheet |

**The gap:** everything is a snapshot. A student can submit work and watch a
status badge change, but there's no way to read feedback, resubmit, take a quiz,
see the cohort, or manage their own profile — even though the schema already
models most of this.

---

## Tier 1 — Close the loops that already exist

These use data the backend already stores; mostly frontend + thin endpoints.

### 1. Feedback & resubmission flow
The `Feedback` model (content + `approved`/`needs_work` verdict) is captured by
admins but **never shown to students**. When a submission is `needs_work`, the
student hits a dead end.
- Show reviewer feedback inside the submission detail sheet.
- When status is `needs_work`, allow editing/resubmitting against the same task
  (the Tasks page currently only offers Submit when no submission exists).
- Surface a "X submissions need your attention" callout on the dashboard.

### 2. Task detail page (`/student/tasks/[id]`)
Task cards truncate the title and description (`truncate` in `tasks/page.tsx`).
A reading or project task with real instructions has nowhere to live.
- Full description, due date, type, and this task's submission history + feedback.
- Submit/resubmit from the detail view.

### 3. Quiz tasks
`TaskType.quiz` exists in the schema but there is no quiz UI — quizzes currently
behave like every other "submit a link/text" task.
- Decide on a question model (likely a new `Question`/`QuizAttempt` table) and a
  take-quiz flow with auto-grading for the `quiz` type.

### 4. Filtering, sorting & search on Tasks
The list is unsorted and unfiltered. As cohorts accumulate tasks this gets noisy.
- Filter by type (coding/reading/project/quiz) and status (todo / submitted /
  approved / needs work).
- Sort by due date; highlight overdue tasks (no overdue treatment exists today).

---

## Tier 2 — Give the student a richer picture

### 5. Profile page (`/student/profile`)
`User.bio`, `githubUrl`, and `avatarUrl` exist but students can't edit them, and
the sidebar only shows name/email.
- Edit profile (name, bio, GitHub, avatar).
- Show enrollment history.

### 6. Cohort overview (`/student/cohort`)
`Cohort` has `description`, `startDate`, `endDate`, `capacity`, and `status`,
none of which the student sees beyond the cohort name.
- Cohort details, timeline/schedule, and optionally cohort-mates.

### 7. Richer progress & analytics on the dashboard
Progress is a single `approved / total` percentage today.
- Break down by task type, show a submitted-vs-approved split, completion trend
  over time, and a streak / activity indicator.

### 8. Empty-state onboarding for unenrolled students
A student with no enrollment sees "You are not enrolled in a cohort yet." and a
dead end. Add guidance / next steps (or a path back to application status).

---

## Tier 3 — Engagement & polish

### 9. Notifications
No notification system exists. Students aren't told when feedback arrives, a new
task is published, or a deadline is near.
- In-app notification center (new tables) and/or email via the existing mail
  setup used for auth verification.

### 10. Deadline reminders / calendar
Surface upcoming due dates as a list or calendar; "due soon" badges on tasks.

### 11. Submission drafts & history
Allow saving a draft before submitting, and keep full version history per task
rather than a single mutable submission.

---

## Suggested sequencing

1. **Tier 1** delivers the most value per unit of work — it makes the
   submit → review → feedback → resubmit loop actually complete, which is the
   core purpose of an apprenticeship platform.
2. Quiz tasks (#3) are the largest single item (new schema + grading) — consider
   carving them into their own follow-up branch.
3. Tier 2 and Tier 3 are additive and can ship incrementally.

> Scope note: "complete student functionality" most naturally means Tier 1 +
> the profile/cohort pages from Tier 2. Quizzes and notifications are large
> enough to deserve their own branches.
