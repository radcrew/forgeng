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
├── app/                 # Routing + thin pages (compose features)
├── components/
│   ├── layout/          # Role-aware sidebar layout
│   ├── shared/          # Cross-route UI (PageHeader, EmptyState, …)
│   └── ui/              # shadcn/ui primitives
├── features/            # Domain modules: api, hooks, components
│   ├── applications/
│   ├── auth/
│   ├── cohorts/
│   ├── dashboard/
│   ├── submissions/
│   ├── tasks/
│   └── users/
├── hooks/               # Shared client hooks (e.g. useAsyncResource)
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
└── lib/
    ├── api-client.ts    # Fetch → /api/* + dev auth headers
    ├── config.ts        # API_URL, API_BASE
    ├── session.ts       # Persisted user profile (localStorage)
    └── utils.ts         # cn() helper
```

## Data layer

Pages call **`@features/*/hooks`** (e.g. `useApplications`, `useSubmissions`).
Each feature’s `api.ts` exports **`const` arrow functions** that call the NestJS
API through `@lib/api-client`, which targets `{NEXT_PUBLIC_API_URL}/api`. Hooks
use **named imports** from `./api` (no namespace `import *`).

```ts
// features/applications/api.ts
export const listApplications = async (status?: ApplicationStatus) => { ... };

// features/applications/hooks.ts
import { listApplications } from "./api";
export const useApplications = (filter) =>
  useAsyncResource(() => listApplications(...), [filter]);
```
