# `@forgeng/backend`

NestJS 11 + Prisma 6 + PostgreSQL backend for **Forgeng**, a cohort-based
apprenticeship platform. Implements the full REST surface that powers the
Next.js frontend in `../frontend`.

## Stack

- **NestJS 11** — modular HTTP layer with global validation pipe and a
  Prisma-aware exception filter.
- **Prisma 6** — typed PostgreSQL client (`prisma generate` produces the
  client in the shared `node_modules`).
- **PostgreSQL** — schema lives in `prisma/schema.prisma`.
- **class-validator / class-transformer** — request DTO validation.

Auth is currently behind a swappable **dev header guard**
(`x-user-id` / `x-user-email` / `x-user-role`) — the real Clerk integration
plugs in by replacing `src/core/auth/dev-auth.guard.ts`.

## Endpoints

All routes are mounted under `/api`:

| Method | Path                                | Role(s)        |
|-------:|-------------------------------------|----------------|
| GET    | `/healthz`                          | public         |
| GET    | `/account/me`                       | any            |
| PATCH  | `/account/profile`                  | any            |
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
| GET    | `/cohorts/:id/enrollments`          | admin          |
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
| POST   | `/submissions/:id/feedback`         | admin          |
| GET    | `/users`                            | admin          |
| PATCH  | `/users/:id/role`                   | admin          |
| GET    | `/dashboard/student`                | student        |
| GET    | `/dashboard/admin`                  | admin          |

Students see only their own submissions; admins see everything,
optionally filtered by `taskId`, `status`, or `cohortId`.

## Project layout

```
src/
├── main.ts                  # bootstrap (global prefix, validation, filter)
├── app.middleware.ts        # Express middleware (helmet, compression)
├── swagger.ts               # OpenAPI / Swagger UI setup
├── app.module.ts            # imports core + feature modules
├── config/                  # env loading, validation, typed ConfigService
│   ├── configuration.ts     # maps process.env → app settings
│   ├── env.validation.ts    # class-validator schema (fail fast)
│   └── app-config.module.ts
├── common/                  # shared, non-infrastructure utilities
│   ├── filters/             # e.g. PrismaExceptionFilter
│   └── mappers/             # Prisma row → API DTO (response shapes)
├── core/                    # global singleton infrastructure
│   ├── core.module.ts
│   ├── database/            # PrismaService + DatabaseModule (global)
│   └── auth/                # dev guard, roles guard, decorators
└── modules/                 # business features
    ├── health/
    ├── account/             # /account/me, /account/profile
    ├── applications/
    ├── cohorts/
    ├── tasks/
    ├── submissions/
    ├── feedback/
    ├── users/
    └── dashboard/
```

Each feature module follows:

```
modules/<feature>/
├── dto/              # request validation (class-validator)
├── entities/         # re-exports Prisma models for this domain
├── <feature>.controller.ts
├── <feature>.service.ts
└── <feature>.module.ts
```

Database schema lives in `prisma/schema.prisma` (Prisma is the ORM; `entities/` points at those models).

### Path aliases

Configured in `tsconfig.json` (same idea as the frontend):

| Alias | Maps to |
|-------|---------|
| `@core/*` | `src/core/*` |
| `@common/*` | `src/common/*` |
| `@config` | `src/config` |
| `@modules/*` | `src/modules/*` |

`pnpm build` runs `tsc-alias` so production `dist/` uses relative paths. Dev uses
`tsconfig-paths/register` in `main.ts`.

## Environment

Copy `.env.example` to `.env` and adjust. Variables are loaded by
`AppConfigModule` (`src/config/`) and validated on startup — a missing
`DATABASE_URL` or invalid `PORT` stops the process with a clear error.

| Variable       | Required | Default                    |
|----------------|----------|----------------------------|
| `DATABASE_URL` | yes      | —                          |
| `PORT`         | no       | `3001`                     |
| `CORS_ORIGIN`  | no       | `http://localhost:3000`    |
| `NODE_ENV`     | no       | `development`              |

Optional `.env.local` overrides `.env` (gitignored if you add it).

Inject settings elsewhere with `ConfigService`:

```typescript
constructor(private readonly config: ConfigService<AppConfiguration, true>) {}

const url = this.config.getOrThrow('database.url', { infer: true });
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

### OpenAPI (Swagger)

With the API running in **development** or **test** (`NODE_ENV` ≠ `production`):

- UI: [http://localhost:3001/api/docs](http://localhost:3001/api/docs)
- JSON: [http://localhost:3001/api/docs-json](http://localhost:3001/api/docs-json)

Use **Authorize** in Swagger UI and set dev headers (`x-user-id` or `x-user-email`).
Public routes (`POST /applications`, `GET /healthz`) work without headers.

Configuration lives in `src/swagger.ts` (disabled in production by default).

## Talking to the API from the frontend

In dev, the frontend should send headers identifying the active user:

```http
GET /api/account/me
x-user-id: 1                   # or
x-user-email: avery@example.com
x-user-role: student
```

Use seeded IDs from `prisma/seed.ts`:

| Role      | Email                  | Seeded id |
|-----------|------------------------|-----------|
| admin     | `riley@example.com`    | 5         |
| admin     | `sarah@example.com`    | 3         |
| admin     | `james@example.com`    | 4         |
| student   | `avery@example.com`    | 1         |
| student   | `jordan@example.com`   | 2         |
| applicant | `sam@example.com`      | 6         |

Replace `DevAuthGuard` with a Clerk / OIDC guard when ready — controllers
only depend on `request.user`, so no controller code needs to change.
