# `@forgeng/api`

NestJS 11 + Prisma 6 + PostgreSQL backend for the forgeng apprenticeship
platform. Implements the full REST surface that powers the Next.js frontend in
`../frontend`.

## Stack

- **NestJS 11** — modular HTTP layer with global validation pipe and a
  Prisma-aware exception filter.
- **Prisma 6** — typed PostgreSQL client (`prisma generate` produces the
  client in the shared `node_modules`).
- **PostgreSQL** — schema lives in `prisma/schema.prisma`.
- **class-validator / class-transformer** — request DTO validation.

Auth is currently behind a swappable **dev header guard**
(`x-user-id` / `x-user-email` / `x-user-role`) — the real Clerk integration
plugs in by replacing `src/common/auth/dev-auth.guard.ts`.

## Endpoints

All routes are mounted under `/api`:

| Method | Path                                | Role(s)        |
|-------:|-------------------------------------|----------------|
| GET    | `/healthz`                          | public         |
| GET    | `/auth/me`                          | any            |
| PATCH  | `/auth/profile`                     | any            |
| GET    | `/applications`                     | admin          |
| GET    | `/applications/stats`               | admin          |
| POST   | `/applications`                     | public         |
| GET    | `/applications/:id`                 | admin          |
| PATCH  | `/applications/:id/status`          | admin          |
| GET    | `/cohorts`                          | any            |
| POST   | `/cohorts`                          | admin          |
| GET    | `/cohorts/:id`                      | any            |
| PATCH  | `/cohorts/:id`                      | admin          |
| DELETE | `/cohorts/:id`                      | admin          |
| GET    | `/cohorts/:id/enrollments`          | admin, mentor  |
| POST   | `/cohorts/:id/enroll`               | admin          |
| GET    | `/tasks`                            | any            |
| POST   | `/tasks`                            | admin          |
| GET    | `/tasks/:id`                        | any            |
| PATCH  | `/tasks/:id`                        | admin          |
| DELETE | `/tasks/:id`                        | admin          |
| GET    | `/submissions`                      | any            |
| POST   | `/submissions`                      | any            |
| GET    | `/submissions/:id`                  | any            |
| GET    | `/submissions/:id/feedback`         | any            |
| POST   | `/submissions/:id/feedback`         | mentor, admin  |
| GET    | `/users`                            | admin          |
| PATCH  | `/users/:id/role`                   | admin          |
| GET    | `/dashboard/student`                | student        |
| GET    | `/dashboard/mentor`                 | mentor         |
| GET    | `/dashboard/admin`                  | admin          |

Students see only their own submissions; mentors and admins see everything,
optionally filtered by `taskId`, `status`, or `cohortId`.

## Project layout

```
src/
├── app.module.ts            # composition root
├── main.ts                  # bootstrap (global prefix, validation, filter)
├── prisma/                  # PrismaService + PrismaModule (global)
├── common/
│   ├── auth/                # dev guard, roles guard, decorators, types
│   ├── prisma-exception.filter.ts
│   └── serializers.ts       # Prisma row → API DTO mappers
├── health/                  # /healthz
├── auth/                    # /auth/me, /auth/profile
├── applications/            # apprenticeship applications
├── cohorts/                 # cohort CRUD + enrollments
├── tasks/                   # task authoring + student listing
├── submissions/             # student submissions
├── feedback/                # mentor feedback on submissions
├── users/                   # admin user list + role changes
└── dashboard/               # role-specific dashboard summaries
```

Each feature module follows the same shape: `*.controller.ts`, `*.service.ts`,
`*.module.ts`, and one DTO per request body / query.

## Environment

Copy `.env.example` to `.env` and adjust:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/forgeng?schema=public"
PORT=3001
CORS_ORIGIN="http://localhost:3000"
```

## Database

```bash
pnpm prisma:migrate     # create + run a migration
pnpm prisma:generate    # regenerate the Prisma client
pnpm db:seed            # populate sample users / cohorts / tasks / submissions
pnpm prisma:studio      # open Prisma Studio
```

The seed script in `prisma/seed.ts` mirrors the frontend's mock data so the
UI lights up against real records immediately after `db:seed`.

## Development

```bash
pnpm dev          # nest start --watch
pnpm build        # nest build
pnpm lint         # eslint --fix
pnpm test         # jest
```

## Talking to the API from the frontend

In dev, the frontend should send headers identifying the active user:

```http
GET /api/auth/me
x-user-id: 1                   # or
x-user-email: avery@example.com
x-user-role: student
```

Use seeded IDs from `prisma/seed.ts`:

| Role      | Email                  | Seeded id |
|-----------|------------------------|-----------|
| admin     | `riley@example.com`    | 5         |
| mentor    | `sarah@example.com`    | 3         |
| mentor    | `james@example.com`    | 4         |
| student   | `avery@example.com`    | 1         |
| student   | `jordan@example.com`   | 2         |
| applicant | `sam@example.com`      | 6         |

Replace `DevAuthGuard` with a Clerk / OIDC guard when ready — controllers
only depend on `request.user`, so no controller code needs to change.
