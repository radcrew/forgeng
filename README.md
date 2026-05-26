# forgeng

A TypeScript monorepo:

- **`frontend`** — Next.js 16 frontend (React 19, Tailwind CSS 4, App Router)
- **`backend`** — NestJS 11 backend with Prisma 6 + PostgreSQL
- Managed with **pnpm workspaces** + **Turborepo**

## Prerequisites

- Node.js >= 20 (tested on 24)
- pnpm 10 (`npm i -g pnpm`)
- A local PostgreSQL 14+ server

## Project layout

```
forgeng/
├── backend/                 # NestJS backend (@forgeng/api)
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/
│   │   ├── prisma/          # PrismaModule + PrismaService (global)
│   │   ├── app.module.ts
│   │   └── main.ts
│   └── .env                 # DATABASE_URL, PORT, CORS_ORIGIN
├── frontend/                # Next.js frontend (@forgeng/web)
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
pnpm --filter @forgeng/api db:seed   # optional: insert sample data
```

## Development

Run everything at once (Turborepo):

```bash
pnpm dev
```

Or run apps individually:

```bash
pnpm dev:web   # Next.js  -> http://localhost:3000
pnpm dev:api   # NestJS   -> http://localhost:3001
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

## Notes

- The API runs on **port 3001** to avoid colliding with the Next.js dev server on 3000.
- `PrismaService` connects on module init and disconnects on shutdown; the module
  is `@Global()`, so `PrismaService` can be injected anywhere without re-importing.
- Frontend reaches the backend via `NEXT_PUBLIC_API_URL` (`frontend/.env.local`).
