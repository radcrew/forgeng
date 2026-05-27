# @forgeng/frontend

Frontend for **Forgeng** — a mentor-led, cohort-based apprenticeship
program for aspiring software engineers.

Next.js 16 (App Router) + Tailwind 4 + shadcn/ui, backed by the NestJS API in
`../backend`.

## Stack

- **ES modules** (`import` / `export`) with **TypeScript `ES2022`** compile target
- **Next.js 16** (App Router, Turbopack) + **React 19**
- **Tailwind CSS 4** with `tw-animate-css`
- **shadcn/ui** primitives (Radix UI under the hood)
- **react-hook-form** + **zod** for the apply form
- **sonner** for toasts, **lucide-react** for icons, **date-fns** for formatting

## Develop

```bash
# Terminal 1 — API (from repo root)
pnpm --filter @forgeng/backend dev

# Terminal 2 — UI
pnpm --filter @forgeng/frontend dev    # http://localhost:3000
```

```bash
pnpm --filter @forgeng/frontend build
pnpm --filter @forgeng/frontend lint
pnpm --filter @forgeng/frontend icons:generate
```

Copy `frontend/.env.example` to `frontend/.env.local` and set
`NEXT_PUBLIC_API_URL` to your API origin (default `http://localhost:3001`).

Sign in at `/sign-in` with an email that exists in the database (run
`backend/prisma/seed.ts` for sample users). The client stores your profile in
`localStorage` and sends dev auth headers on each request.

## Routes

| Route                     | Purpose                                       |
| ------------------------- | --------------------------------------------- |
| `/`                       | Marketing landing page                        |
| `/apply`                  | 3-step application form → `POST /api/applications` |
| `/sign-in`, `/sign-up`    | Email sign-in (dev header auth → `/auth/me`)  |
| `/student`                | Student dashboard                             |
| `/student/tasks`          | Task list + submit dialog                     |
| `/student/submissions`    | Submission history + mentor feedback drawer   |
| `/mentor`                 | Mentor dashboard                              |
| `/mentor/reviews`         | Review queue with approve / needs-work flow   |
| `/admin`                  | Admin dashboard                               |
| `/admin/applications`     | Application pipeline (status tabs + dialog)   |
| `/admin/cohorts`          | Cohort CRUD + enrollment dialog               |
| `/admin/tasks`            | Task authoring                                |
| `/admin/users`            | User list with inline role change             |

## Folder layout

```
src/
├── app/                 # Routes: thin pages (`const X = () => …`, default export)
├── components/
│   ├── common/          # Reusable app patterns (FormDialog, DetailSheet, …)
│   ├── layout/          # Role-aware sidebar layout
│   ├── shared/          # Cross-route page chrome (PageHeader, EmptyState, …)
│   └── ui/              # shadcn/ui primitives
├── features/            # Domain: api, types, components (no hooks.ts per feature)
│   ├── applications/    # e.g. ApplyWizard, pipeline dialogs & lists
│   ├── auth/
│   ├── cohorts/         # e.g. CohortFormDialog, EnrollmentsDialog, AdminCohortCard
│   ├── dashboard/       # e.g. AdminDashboardView, StudentDashboardView
│   ├── submissions/     # e.g. detail sheets for student vs mentor
│   ├── tasks/           # e.g. TaskFormDialog, SubmitTaskDialog, AdminTaskRow
│   └── users/           # e.g. AdminUserRow
├── hooks/               # All data hooks + `useAsyncResource`, `useIsMobile`
│   ├── index.ts         # Barrel: `import { useCohorts } from "@hooks"`
│   ├── use-async-resource.ts
│   ├── use-application-queries.ts
│   ├── use-cohort-queries.ts
│   ├── use-dashboard-queries.ts
│   ├── use-submission-queries.ts
│   ├── use-task-queries.ts
│   └── use-user-queries.ts
├── contexts/            # React context definitions + hooks (`useCurrentUser`, …)
├── providers/           # Client providers (`AppProviders`, …)
├── types/               # Shared domain types (import via `@types`)
│   ├── user.ts
│   ├── application.ts
│   ├── cohort.ts
│   ├── task.ts
│   ├── submission.ts
│   ├── dashboard.ts
│   └── index.ts
├── hooks/               # … (see above)
├── utils/               # Pure helpers (no React)
│   ├── cn.ts            # className merge (Tailwind)
│   ├── auth.ts          # homeForRole, normalizeEmail
│   ├── api.ts           # buildApiBase, getDevAuthHeaders
│   ├── storage.ts       # localStorage JSON helpers
│   ├── status-variants.ts
│   ├── task-icons.ts
│   └── user.ts          # mapUserDto
└── lib/
    ├── api-client.ts    # Fetch → /api/* + dev auth headers
    ├── config.ts        # API_URL, API_BASE
    ├── session.ts       # Persisted user profile (localStorage)
    └── utils.ts         # Re-exports cn (prefer `@utils`)
```

## Shared UI (`@components/common`)

Feature components compose these primitives instead of repeating dialog/sheet markup:

| Component | Use for |
| --------- | ------- |
| `FormDialog` | Modal forms with title + cancel/submit footer |
| `ContentDialog` | Modals without a standard footer (e.g. enrollments) |
| `DetailSheet` | Side panels for detail views |
| `FormField`, `FormBody`, `FormGrid` | Consistent form layout |
| `StatusBadge` | Domain status chips (wrapped per feature) |
| `LoadingState` | Centered loading message on list pages |
| `ClickableCard` | Hoverable list rows |
| `DetailField`, `ProseBlock`, `ExternalLinkField` | Read-only detail blocks |
| `FeedbackCard`, `VerdictPicker` | Submission review UI |

Domain-specific behavior stays in **`@features/*`**; layout and chrome stay in **`@components/common`** / **`@components/shared`**.

## Data layer

Pages and feature components import hooks from **`@hooks`** (e.g. `useApplications`, `useSubmissions`).
Each feature’s `api.ts` exports **`const` arrow functions** that call the NestJS
API through `@lib/api-client`, which targets `{NEXT_PUBLIC_API_URL}/api`. Query hooks
live in `src/hooks/use-*-queries.ts` and call those APIs via `@features/*/api`.

Feature `index.ts` files may re-export hooks from `@hooks` for backward compatibility.

```ts
// src/hooks/use-application-queries.ts
import { listApplications } from "@features/applications/api";
export const useApplications = (filter) =>
  useAsyncResource(() => listApplications(...), [filter]);
```

```ts
// app/admin/applications/page.tsx
import { useApplications } from "@hooks";
import { ApplicationsList } from "@features/applications";
```
