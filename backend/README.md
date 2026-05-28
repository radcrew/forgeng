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

Auth runs through `src/modules/auth/` using JWT access tokens + rotating
refresh tokens (httpOnly cookie). Email/password registration with email
verification is supported alongside Google and GitHub OAuth (Passport
strategies).

## Endpoints

All routes are mounted under `/api`:

| Method | Path                                | Role(s)        |
|-------:|-------------------------------------|----------------|
| GET    | `/healthz`                          | public         |
| POST   | `/auth/register`                    | public         |
| POST   | `/auth/login`                       | public         |
| POST   | `/auth/refresh`                     | public         |
| POST   | `/auth/logout`                      | public         |
| GET    | `/auth/verify-email`                | public         |
| POST   | `/auth/resend-verification`         | public         |
| GET    | `/auth/me`                          | any            |
| GET    | `/auth/google`                      | public         |
| GET    | `/auth/google/callback`             | public         |
| GET    | `/auth/github`                      | public         |
| GET    | `/auth/github/callback`             | public         |
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
│   └── auth/                # JwtAuthGuard binding, roles guard, decorators
└── modules/                 # business features
    ├── auth/                # register/login/refresh/oauth/verify-email
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

| Variable                  | Required           | Default                                |
|---------------------------|--------------------|----------------------------------------|
| `DATABASE_URL`            | yes                | —                                      |
| `PORT`                    | no                 | `3001`                                 |
| `CORS_ORIGIN`             | no                 | `http://localhost:3000`                |
| `NODE_ENV`                | no                 | `development`                          |
| `JWT_ACCESS_SECRET`       | prod only          | dev placeholder                        |
| `JWT_REFRESH_SECRET`      | prod only          | dev placeholder                        |
| `JWT_ACCESS_TTL`          | no                 | `15m`                                  |
| `JWT_REFRESH_TTL`         | no                 | `7d`                                   |
| `REFRESH_COOKIE_NAME`     | no                 | `forgeng_refresh`                      |
| `REFRESH_COOKIE_DOMAIN`   | no                 | —                                      |
| `EMAIL_VERIFY_TTL_MINUTES`| no                 | `1440` (24h)                           |
| `EMAIL_VERIFY_REDIRECT`   | no                 | `http://localhost:3000/auth/verify-email` |
| `OAUTH_SUCCESS_REDIRECT`  | no                 | `http://localhost:3000/auth/callback`  |
| `OAUTH_FAILURE_REDIRECT`  | no                 | `http://localhost:3000/login?error=oauth` |
| `GOOGLE_CLIENT_ID`        | optional (OAuth)   | —                                      |
| `GOOGLE_CLIENT_SECRET`    | optional (OAuth)   | —                                      |
| `GOOGLE_CALLBACK_URL`     | optional (OAuth)   | —                                      |
| `GITHUB_CLIENT_ID`        | optional (OAuth)   | —                                      |
| `GITHUB_CLIENT_SECRET`    | optional (OAuth)   | —                                      |
| `GITHUB_CALLBACK_URL`     | optional (OAuth)   | —                                      |
| `SMTP_HOST`               | optional           | — (emails log to console if unset)     |
| `SMTP_PORT`               | no                 | `587`                                  |
| `SMTP_USER`               | no                 | —                                      |
| `SMTP_PASS`               | no                 | —                                      |
| `SMTP_SECURE`             | no                 | `false`                                |
| `EMAIL_FROM`              | no                 | `no-reply@forgeng.local`               |

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

Use **Authorize** in Swagger UI with the JWT access token returned from
`POST /auth/login`. Public routes (`POST /applications`, `GET /healthz`,
`POST /auth/*`) work without it.

Configuration lives in `src/swagger.ts` (disabled in production by default).

## Talking to the API from the frontend

Obtain an access token, then send it as a bearer header:

```http
POST /api/auth/login
Content-Type: application/json

{ "email": "you@example.com", "password": "…" }

→ { "user": …, "accessToken": "<jwt>", "expiresIn": 900 }
```

```http
GET /api/account/me
Authorization: Bearer <jwt>
```

The refresh token is delivered as an httpOnly cookie scoped to `/api/auth`;
call `POST /api/auth/refresh` (with `credentials: 'include'`) to rotate.

OAuth flow: `GET /api/auth/google` (or `/auth/github`) — the user is bounced
through the provider and lands at `OAUTH_SUCCESS_REDIRECT` with
`?accessToken=…&expiresIn=…` while the refresh cookie is set on the API origin.
