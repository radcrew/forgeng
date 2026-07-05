# @forgeng/frontend

Frontend for **Forgeng** — a cohort-based apprenticeship
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
Also set `JWT_ACCESS_SECRET` to the same value as the backend's — the OAuth
callback and `middleware.ts` verify the access-token cookie locally, so a
missing/mismatched secret here breaks Google/GitHub sign-in (the callback
silently redirects to `/sign-in` even though the login succeeded).

Sign in at `/sign-in` with an email that exists in the database (run
`backend/prisma/seed.ts` for sample users). The client stores your profile in
`localStorage` and sends dev auth headers on each request.

## Routes

| Route                     | Purpose                                       |
| ------------------------- | --------------------------------------------- |
| `/`                       | Marketing landing page                        |
| `/apply`                  | 3-step application form → `POST /api/applications` |
| `/sign-in`, `/sign-up`    | Email sign-in (dev header auth → `/account/me`) |
| `/student`                | Student dashboard                             |
| `/student/tasks`          | Task list + submit dialog                     |
| `/student/submissions`    | Submission history + feedback drawer          |
| `/admin`                  | Admin dashboard                               |
| `/admin/reviews`          | Submission review queue                       |
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
├── constants/           # Static config per area (like `landing/`)
│   ├── landing/         # Marketing page copy & assets metadata
│   ├── applications/    # Status variants, filter tabs, apply form schema
│   ├── cohorts/
│   ├── submissions/
│   ├── tasks/
│   └── users/
├── features/            # Domain: api, hooks, types, components
│   ├── applications/
│   ├── auth/
│   ├── cohorts/
│   ├── dashboard/
│   ├── submissions/
│   ├── tasks/
│   └── users/
├── hooks/               # Global hooks only (`useAsyncResource`, `useIsMobile`)
│   ├── index.ts
│   ├── use-async-resource.ts
│   └── use-mobile.ts
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
├── utils/               # Pure helpers (no React)
│   ├── cn.ts            # className merge (Tailwind)
│   ├── auth.ts          # homeForRole, normalizeEmail
│   ├── api.ts           # buildApiBase, getDevAuthHeaders
│   ├── storage.ts       # localStorage JSON helpers
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

## Naming

Paths carry context — avoid repeating the domain in file or export names.

| Location | File | Export |
| -------- | ---- | ------ |
| `features/applications/components/` | `detail-dialog.tsx` | `DetailDialog` |
| `features/submissions/components/student/` | `detail-sheet.tsx` | `DetailSheet` |
| `features/dashboard/components/` | `admin-view.tsx` | `AdminView` |
| `app/admin/applications/` | `page.tsx` | `Page` (default) |

Import from the feature barrel (`@features/applications`) so call sites stay readable: `List`, `StatusTabs`, `DetailDialog`.

## Data layer

Each feature owns **`api.ts`** (fetch functions) and **`hooks.ts`** (React Query–style
loaders built on `useAsyncResource` from `@hooks`). Pages import domain hooks from
**`@features/*`**; only shared hooks live in **`@hooks`**.

```ts
// features/applications/hooks.ts
import { useAsyncResource } from "@hooks/use-async-resource";
import { listApplications } from "./api";

export const useApplications = (filter) =>
  useAsyncResource(() => listApplications(...), [filter]);
```

```ts
// app/admin/applications/page.tsx
import { useApplications, List } from "@features/applications";
```
