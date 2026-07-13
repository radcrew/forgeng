# AGENTS.md

Root coordination contract for AI and human contributors in this repo. Detailed architecture and working guidelines live in [CLAUDE.md](./CLAUDE.md); this file states the non-negotiables and where to look.

## Scope

- Applies to the whole monorepo: `frontend/`, `backend/`.
- `frontend/` has its own [AGENTS.md](./frontend/AGENTS.md) (imported by `frontend/CLAUDE.md`) that tightens rules for that subtree — read it before editing anything under `frontend/`. It documents that this repo's Next.js version has breaking changes from training-data assumptions and points to `node_modules/next/dist/docs/` for current APIs.
- No nested `AGENTS.md` exists under `backend/` yet. If one is added, it may tighten rules for that subtree but must not relax the rules here.

Normative language: `MUST`/`MUST NOT` are mandatory. `SHOULD`/`SHOULD NOT` are expected by default; deviations should be explained in the PR. `MAY` is optional.

## Non-Negotiables

- `MUST` read `frontend/AGENTS.md` before writing Next.js code — this repo runs Next.js 16, and training-data assumptions about App Router APIs and conventions may be stale or wrong.
- `MUST` run `pnpm --filter @forgeng/backend prisma:generate` before linting or testing the backend after pulling schema changes. CI does this explicitly because type-aware ESLint treats every Prisma model access as `any` without a generated client, flooding errors.
- `MUST` update `backend/prisma/schema.prisma` and run a migration (`pnpm prisma:migrate`) together — never hand-edit generated Prisma client output or migration SQL after the fact.
- `MUST NOT` commit `.env` / `.env.local` files or real secrets. Copy from `.env.example` and keep credentials local.
- `MUST` run the smallest scoped lint/test/build command for the package you touched (see Command Baseline below), not a full monorepo run, unless the change is broad.
- `SHOULD NOT` trust `docs/README.md` at face value — it links to `docs/student-features.md` and `docs/admin-completion-todo.md`, neither of which currently exists in the repo. Only `docs/deployment.md` and `docs/README.md` itself are real.
- `SHOULD` keep the pre-commit hook green rather than bypassing it: `pnpm lint:fix && pnpm lint` runs on every commit via husky.

## Command Baseline

- Install: `pnpm install` (root, installs both workspaces)
- Dev: `pnpm dev` (both apps via turbo), or `pnpm dev:fe` / `pnpm dev:be` individually
- Lint: `pnpm lint` (turbo runs both packages) / `pnpm lint:fix`
- Test: `pnpm test` (turbo runs both packages' `test` script — backend is Jest unit tests only here, not e2e)
- Build: `pnpm build`

Full per-package lint/test/build matrix and single-test syntax: see [CLAUDE.md](./CLAUDE.md#commands).

## Where To Look

- Behavioral guidelines and full architecture: [CLAUDE.md](./CLAUDE.md)
- Frontend-specific agent rules: [frontend/AGENTS.md](./frontend/AGENTS.md)
- Setup and project layout: [README.md](./README.md)
- Deployment (Vercel + Render): [docs/deployment.md](./docs/deployment.md)
- Contribution workflow: [CONTRIBUTING.md](./CONTRIBUTING.md)
- Reporting vulnerabilities: [SECURITY.md](./SECURITY.md)
- Code of Conduct: [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)

## Enforcement

Mechanical checks over prose, where they exist:

- ESLint per package (`frontend`, `backend`), enforced via husky pre-commit (`lint:fix` then `lint`) and CI.
- CI (`.github/workflows/ci.yml`) runs lint + unit tests (+ e2e for backend) on every push/PR to `main`, and posts a coverage comment for both packages.
- There is no repo-wide type-check or e2e frontend suite yet. Rely on the per-package commands above.
