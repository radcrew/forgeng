# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

The import above pulls in the cross-tool non-negotiables and command baseline from [AGENTS.md](./AGENTS.md), shared with other coding agents (Cursor, Codex, etc.). Everything below is Claude Code specific.

## What this is

`forgeng` is a pnpm/Turborepo monorepo for the Forgeng apprenticeship platform: a **Next.js 16** frontend (React 19, Tailwind CSS 4, App Router) and a **NestJS 11** backend (Prisma 6 + PostgreSQL) covering applications, cohorts, tasks, submissions, and feedback for an apprenticeship program.

## Working Guidelines

**Think before coding.** State assumptions explicitly rather than silently picking between interpretations. If a request is ambiguous, or a simpler approach exists than the one implied, say so before implementing.

**Simplicity first.** No speculative abstractions, no unrequested configurability, no error handling for scenarios that can't occur at the call site. If a change could be half the size, make it that size.

**Surgical changes.** Touch only what the task requires; match each file's existing style even where you'd choose differently. When your edit makes an import, variable, or function unused, remove it, but leave pre-existing dead code alone and just flag it. Changing a Prisma model requires a matching migration in the same change; never edit `backend/prisma/schema.prisma` without running `pnpm prisma:migrate`.

**Goal-driven execution.** For multi-step work, state a short plan with a verification step per item, e.g. "add `graduatedAt` to `Enrollment`, migrate, then verify with `pnpm --filter @forgeng/backend exec vitest run <path>`." Use the smallest per-package command from the table below that actually exercises the change, not the whole suite, unless the change is broad.

**Loops and autonomy.** "Done" means the relevant command from the table below passes, not "looks right." Work on a branch so changes are easy to revert. Autonomous or `/loop`-driven runs need an explicit stop condition (a passing test, a clean lint run) and an iteration cap; don't loop indefinitely on judgment calls like UX/product decisions, those are a human call. If you hit the cap or get stuck, stop and report what you tried and what's blocking, rather than thrashing or guessing further.

**Text.** In commit messages, PR descriptions, and docs written for this repo: no em-dashes, no filler ("it's worth noting," "essentially"), no LLM tells ("it's not just X, it's Y," "delve"). Reread before finishing and cut anything that doesn't earn its place.

**Commit messages.** After any set of file changes, automatically draft and show a Conventional Commits message (`feat:`, `fix:`, `docs:`, `chore:`, etc., matching this repo's history) in a copyable code block, without waiting to be asked. Scope it to the actual uncommitted change set (check `git status`) and call out any unrelated modified files so they can be excluded. Do not run `git commit` yourself; the user commits manually unless they explicitly ask you to.

## Commands

Run from repo root unless noted. Package manager is **pnpm** (`packageManager: pnpm@10.32.1`), Node `>=24 <25`.

### Install / dev
```bash
pnpm install              # root + frontend + backend (pnpm workspaces)
pnpm dev                  # both apps, watch mode (turbo)
pnpm dev:fe               # frontend only -> http://localhost:3000
pnpm dev:be               # backend only  -> http://localhost:3001
pnpm prisma:generate      # regenerate Prisma client
pnpm prisma:migrate       # create/apply a dev migration
pnpm prisma:studio        # open Prisma Studio (DB browser)
```

### Lint / test / build (root aggregates, via turbo)
```bash
pnpm lint                 # frontend + backend eslint
pnpm lint:fix
pnpm test                 # frontend vitest + backend jest unit tests (NOT backend e2e)
pnpm build                # next build + nest build
```
**`pnpm test` does not run backend e2e.** CI runs `pnpm --filter @forgeng/backend test:e2e` as a separate step; run it explicitly when touching backend request/response contracts.

### Per-package commands
| Package | lint | test (unit) | test (e2e) | build | single test |
|---|---|---|---|---|---|
| `frontend` | `pnpm --filter @forgeng/frontend lint` (`eslint . --max-warnings 0`) | `pnpm --filter @forgeng/frontend test` (vitest) | *(none)* | `pnpm --filter @forgeng/frontend build` | `pnpm --filter @forgeng/frontend exec vitest run <path>` or `-t "<name>"` |
| `backend` | `pnpm --filter @forgeng/backend lint` (eslint) | `pnpm --filter @forgeng/backend test` (jest, `test/unit/**/*.spec.ts` only) | `pnpm --filter @forgeng/backend test:e2e` (jest, `test/e2e/`, mocked Prisma client — no DB service needed) | `pnpm --filter @forgeng/backend build` (`nest build && tsc-alias`) | `pnpm --filter @forgeng/backend exec jest <path>` |

`test:cov` scripts exist for both packages (`test:cov`); CI runs these and posts a coverage comment per package via `.github/workflows/ci.yml`. The backend CI job runs `prisma:generate` **before** lint — type-aware ESLint sees every Prisma model access as `any` without it, flooding errors.

## Architecture

### Component map
| Component | Stack | Role |
|---|---|---|
| `frontend` | Next.js 16, React 19, Tailwind CSS 4, App Router, TanStack-style hooks under `src/hooks`, `axios` | Applicant/student/admin web app |
| `backend` | NestJS 11, Prisma 6, PostgreSQL, Passport (local + JWT + GitHub + Google OAuth) | REST API, auth, email (nodemailer), notifications |

Frontend talks to the backend over REST via `NEXT_PUBLIC_API_URL` (`frontend/.env.local`); there's no GraphQL or gRPC layer here (unlike some other repos this template is based on).

### Backend module layout (`backend/src/`)
- `core/` — cross-cutting infra: `auth/` (roles guard, `@Public()`/`@Roles()` decorators, `@CurrentUser()`), `database/` (global `PrismaModule` + `PrismaService`, connects on module init / disconnects on shutdown, injectable anywhere without re-importing), `mail/`.
- `modules/` — feature modules: `auth`, `account`, `applications`, `cohorts`, `dashboard`, `feedback`, `health`, `notifications`, `settings`, `submissions`, `tasks`, `users`.
- `common/` — shared constants, crypto helpers, exception filters, DTO/entity mappers, string/util helpers.

### Auth
Backend auth combines **local (email+password)**, **JWT** (access + refresh token pair), and **OAuth** (GitHub, Google) via Passport strategies in `backend/src/modules/auth/strategies/`. Supporting services: email verification (`verification.service.ts`), password reset, IP-reputation and geo/region restriction checks (`geoip-lite`-backed, `region-restriction.service.ts`), rate limiting (`@nestjs/throttler`). Route protection is role-based (`roles.guard.ts` + `@Roles()`), with `@Public()` opting a route out of the global JWT guard. Frontend reads/refreshes the access token via `frontend/src/lib/auth/access-token.ts` (uses `jose`); no `middleware.ts` currently gates routes at the edge — auth checks happen in route handlers/layouts.

### Data model (`backend/prisma/schema.prisma`)
Core models: `User`, `AuthIdentity` (OAuth link), `VerificationToken`, `RefreshToken`, `Application`, `Cohort`, `Enrollment`, `Task`, `Submission`, `Feedback`, `Notification`, `Payment`, `PlatformSetting`, `NotificationPreference`. Applicants apply (`Application`) → get enrolled in a `Cohort` (`Enrollment`) → complete `Task`s via `Submission`s → receive `Feedback`. Seed data: `pnpm --filter @forgeng/backend db:seed`; an admin-bootstrap script also exists at `backend/prisma/create-admin.ts`.

### Frontend structure (`frontend/src/`)
Route groups under `app/`: `(auth)`, `admin`, `apply`, `auth`, `student`, plus static `privacy`/`terms` pages. Domain code is organized by feature under `features/` (`applications`, `auth`, `cohorts`, `dashboard`, `notifications`, `profile`, `settings`, `submissions`, `tasks`, `users`), mirrored by `constants/<domain>`. Cross-cutting: `components/ui` (primitives, Radix-based), `components/shared` / `layout` / `landing` / `legal` / `brand`, `contexts/` + `providers/` for `auth` and `cohort` state, `hooks/`, `lib/`.

**Read `frontend/AGENTS.md` before writing frontend code** — this repo pins Next.js 16, which has breaking changes vs. older Next.js conventions likely present in training data. Check `node_modules/next/dist/docs/` for current API shape rather than assuming.

### Stale docs
`docs/README.md` links to `docs/student-features.md` and `docs/admin-completion-todo.md` — neither file exists in the repo currently. Only `docs/deployment.md` is real; trust it over the index if they ever disagree.

## Licensing

MIT, see root [LICENSE](./LICENSE). Both `frontend/package.json` and `backend/package.json` currently say `private: true` / `UNLICENSED` at the package level — that governs npm publishing only (both are private, unpublished workspace packages), not the repo's actual license; the root `LICENSE` file is authoritative for the source itself.
