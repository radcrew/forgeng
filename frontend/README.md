# @forgeng/frontend

Frontend for **Forgeng** — a mentor-led, cohort-based apprenticeship
program for aspiring software engineers.

This package contains the Next.js 16 (App Router) + Tailwind 4 + shadcn/ui
implementation. Backend integration is intentionally deferred — every page
currently renders from `src/lib/mock-data.ts`, so the entire UI is static and
hot-reloadable without a running API.

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19**
- **Tailwind CSS 4** with `tw-animate-css`
- **shadcn/ui** primitives (Radix UI under the hood)
- **react-hook-form** + **zod** for the apply form
- **sonner** for toasts, **lucide-react** for icons, **date-fns** for formatting

## Develop

```bash
pnpm --filter @forgeng/frontend dev      # http://localhost:3000
pnpm --filter @forgeng/frontend build    # production build
pnpm --filter @forgeng/frontend lint     # ESLint
```

## Routes

| Route                     | Purpose                                       |
| ------------------------- | --------------------------------------------- |
| `/`                       | Marketing landing page                        |
| `/apply`                  | 3-step application form (localStorage draft)  |
| `/sign-in`, `/sign-up`    | Auth placeholders                             |
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
├── app/                 # Next.js App Router routes (and per-role layouts)
├── components/
│   ├── layout/          # Role-aware sidebar layout
│   └── ui/              # shadcn/ui primitives
├── hooks/               # Shared client hooks
└── lib/
    ├── mock-data.ts     # All sample data used by pages
    ├── types.ts         # Domain types (User, Task, Submission, …)
    └── utils.ts         # cn() helper
```

## Next steps

When wiring the backend, replace imports of `@/lib/mock-data` with real data
hooks (TanStack Query, Server Components, etc.) — the page components only read
the data and don't care where it comes from.
