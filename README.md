# Forgeng

A TypeScript monorepo for the Forgeng apprenticeship platform:

- **`frontend`** — Next.js 16 frontend (React 19, Tailwind CSS 4, App Router)
- **`backend`** — NestJS 11 backend with Prisma 6 + PostgreSQL
- Managed with **pnpm workspaces** + **Turborepo**

## Prerequisites

- Node.js >= 24
- pnpm 10 (`npm i -g pnpm`)
- A local PostgreSQL 14+ server

## Project layout

```
forgeng/
├── backend/                 # NestJS backend (@forgeng/backend)
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/
│   │   ├── prisma/          # PrismaModule + PrismaService (global)
│   │   ├── app.module.ts
│   │   └── main.ts
│   └── .env                 # DATABASE_URL, PORT, CORS_ORIGIN
├── frontend/                # Next.js frontend (@forgeng/frontend)
│   └── .env.local           # NEXT_PUBLIC_API_URL
├── package.json             # root scripts (turbo)
├── pnpm-workspace.yaml
└── turbo.json
```

## Setup

### 1. Install dependencies

```bash
pnpm install
```

This runs `husky` via the `prepare` script and installs the **pre-commit** hook, which
lints staged `frontend/` and `backend/` files with ESLint (`lint-staged`). To run it
manually: `pnpm lint:staged`. Full-workspace lint: `pnpm lint`.

### 2. Configure PostgreSQL

Create the database in your local Postgres instance:

```sql
CREATE DATABASE forgeng;
```

Then set the connection string in `backend/.env` (copy from `.env.example`):

```
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/forgeng?schema=public"
PORT=3001
CORS_ORIGIN="http://localhost:3000"
```

### 3. Run migrations & generate the Prisma client

```bash
pnpm prisma:migrate     # creates the schema + generates the client
pnpm --filter @forgeng/backend db:seed   # optional: insert sample data
```

## Development

Run everything at once (Turborepo):

```bash
pnpm dev
```

Or run apps individually:

```bash
pnpm dev:fe    # Next.js  -> http://localhost:3000
pnpm dev:be    # NestJS   -> http://localhost:3001
```

Verify the API and its database connection:

```bash
curl http://localhost:3001/health
# -> {"status":"ok","database":"up"}
```

## Useful scripts (run from the repo root)

| Command                 | Description                                  |
| ----------------------- | -------------------------------------------- |
| `pnpm dev`              | Run all apps in watch mode (turbo)           |
| `pnpm build`            | Build every app (turbo)                      |
| `pnpm lint`             | Lint every app                               |
| `pnpm test`             | Run all tests                                |
| `pnpm prisma:generate`  | Regenerate the Prisma client                 |
| `pnpm prisma:migrate`   | Create/apply a dev migration                 |
| `pnpm prisma:studio`    | Open Prisma Studio (DB browser)              |

## Deployment

Frontend deploys to **Vercel**, backend (with managed Postgres) deploys to
**Render** — both via native GitHub integrations, no GitHub Actions needed.
The repo includes a [`render.yaml`](./render.yaml) blueprint so Render
provisions the backend and the database in one click.

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the step-by-step guide.

## Notes

- The API runs on **port 3001** to avoid colliding with the Next.js dev server on 3000.
- `PrismaService` connects on module init and disconnects on shutdown; the module
  is `@Global()`, so `PrismaService` can be injected anywhere without re-importing.
- Frontend reaches the backend via `NEXT_PUBLIC_API_URL` (`frontend/.env.local`).
