# Admin Page Completion — TODO

Goal: make every admin action actually work against the backend and have it
flow through to the student portal. Grounded in the current code
(`frontend/src/app/admin/*`, `frontend/src/features/*`) and the live backend
endpoints (`backend/src/modules/*`).

## Current state (audit)

| Admin area | UI exists | API wired | Notes |
| --- | --- | --- | --- |
| Dashboard (`/admin`) | ✅ | ✅ | Read-only stats from `/dashboard/admin` |
| Applications (`/admin/applications`) | ✅ | ✅ | Status updates work (`PATCH /applications/:id/status`) |
| Review Queue (`/admin/reviews`) | ✅ | ✅ | Feedback works (`POST /submissions/:id/feedback`) |
| Users (`/admin/users`) | ✅ | ✅ | Role change works (`PATCH /users/:id/role`) |
| **Cohorts** (`/admin/cohorts`) | ✅ | ❌ | create / edit / delete / enroll are **stubs** (`setTimeout` + toast) |
| **Tasks** (`/admin/tasks`) | ✅ | ❌ | create / edit / delete are **stubs** (`setTimeout` + toast) |

Backend endpoints for the stubbed areas **already exist** — only the frontend
`api.ts` / `hooks.ts` and the dialog handlers are missing.

---

## Phase 1 — Wire Cohort CRUD + enrollment

Backend (already live): `POST /cohorts`, `PATCH /cohorts/:id`,
`DELETE /cohorts/:id`, `POST /cohorts/:id/enroll`.

- [ ] **Add API functions** in `frontend/src/features/cohorts/api.ts`:
  - `createCohort(input)` → `POST /cohorts`
  - `updateCohort(id, input)` → `PATCH /cohorts/:id`
  - `deleteCohort(id)` → `DELETE /cohorts/:id`
  - `enrollStudent(cohortId, userId)` → `POST /cohorts/:id/enroll`
  - Define a `CohortInput` type matching `CreateCohortDto` (name, description?,
    capacity, status?, startDate?, endDate?).
- [ ] **Export** the new functions from `frontend/src/features/cohorts/index.ts`.
- [ ] **Replace the stub** in `components/form-dialog.tsx` `handleSave`: call
  `createCohort` / `updateCohort` instead of the `setTimeout`, surface
  `ApiError.message` on failure (mirror `users/components/row.tsx`).
- [ ] **Replace the stub** in `components/card.tsx` `handleDelete`: call
  `deleteCohort(cohort.id)`.
- [ ] **Replace the stub** in `components/enrollments.tsx` `handleEnroll`: call
  `enrollStudent(cohort.id, Number(userId))`.
- [ ] **Refresh after mutate**: thread the `refetch` from `useCohorts()`
  (page-level) into `FormDialog` / `Card` / `Enrollments` so the list and
  `enrolledCount` update without a page reload. `useEnrollments` also needs to
  refetch after enroll.

## Phase 2 — Wire Task CRUD

Backend (already live): `POST /tasks`, `PATCH /tasks/:id`, `DELETE /tasks/:id`.

- [ ] **Add API functions** in `frontend/src/features/tasks/api.ts`:
  - `createTask(input)` → `POST /tasks`
  - `updateTask(id, input)` → `PATCH /tasks/:id`
  - `deleteTask(id)` → `DELETE /tasks/:id`
  - Define `TaskInput` matching `CreateTaskDto` (cohortId, title, description?,
    type, status?, dueDate?).
- [ ] **Export** them from `frontend/src/features/tasks/index.ts`.
- [ ] **Replace the stub** in `components/form-dialog.tsx` `handleSave`: call
  `createTask` / `updateTask`.
- [ ] **Replace the stub** in `components/row.tsx` `handleDelete`: call
  `deleteTask(task.id)`.
- [ ] **Refresh after mutate**: thread `refetch` from `useTasks()` into
  `FormDialog` and `Row` (the `/admin/tasks` page currently never refetches).

## Phase 3 — Shared polish for the wired flows

- [ ] **Consistent error handling**: every mutation should catch `ApiError` and
  `toast.error(err.message)`; only `toast.success` on resolve (today's stubs
  always "succeed"). Use `users/components/row.tsx` as the reference pattern.
- [ ] **Disable + spinner while pending** on every submit/delete button
  (`isSaving` already exists in the dialogs — keep it, just gate on the real
  promise).
- [ ] **Confirm-before-delete**: cohort/task delete already use `confirm()`;
  decide whether to keep native confirm or swap for an AlertDialog for
  consistency with the rest of the UI.

## Phase 4 — Admin ↔ Student portal integration (verify the loop)

These features already exist on the student side; this phase is about
confirming admin actions actually drive them end-to-end.

- [ ] **Publish → visible**: a task created/edited with `status: published`
  appears on `/student/tasks` for enrolled students; `draft` does not.
- [ ] **Enroll → cohort page**: enrolling a student shows the cohort on
  `/student/cohort` and unblocks the "not enrolled" empty state.
- [ ] **Feedback → notifications**: leaving feedback (`POST .../feedback`)
  produces the student notification (`feedback-received` template exists in
  `backend/src/modules/notifications/templates`) and surfaces in the bell +
  `/student/notifications`.
- [ ] **New task → notification**: confirm publishing a task fires the
  `task-published` notification to enrolled students (template exists).
- [ ] **Application accept → enrollment**: accepting an application with a
  `cohortId` (`updateApplicationStatus`) enrolls/promotes the applicant; verify
  the resulting student can log in and see their cohort.
- [ ] **Counts stay in sync**: after the above, the admin dashboard cards
  (pending reviews, enrolled students, pending applications) reflect reality on
  refetch.

## Phase 5 — Verification

- [ ] `cd frontend; npm run lint` and `npm run build` clean.
- [ ] `cd backend; npm run lint` clean (no backend changes expected, but verify).
- [ ] Manual run-through of each admin mutation against a running backend
  (create/edit/delete cohort, enroll student, create/edit/delete task) and the
  Phase 4 student-side checks.

---

## Out of scope (future, larger items)

Tracked in `docs/student-features.md` — not required to "complete" the admin
page: quiz authoring/grading UI, admin-side analytics charts, admin notification
preferences, per-cohort task/submission drill-down views.
