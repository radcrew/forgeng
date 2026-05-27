# Deployment

Forgeng deploys the **frontend to Vercel** and the **backend (with its
Postgres) to Render**. Both providers ship native GitHub integrations, so
you do **not** need GitHub Actions for either deploy.

```
GitHub repo (main branch)
   │
   ├──► Vercel  — frontend/ — auto-deploys on push, PR previews
   │
   └──► Render  — backend/  — auto-deploys on push, managed Postgres
```

## 1. Frontend → Vercel

### One-time setup

1. Push the repo to GitHub if you haven't already.
2. Go to <https://vercel.com/new>, install the Vercel GitHub app if asked,
   and import the `forgeng` repo.
3. In **Configure Project**, set:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Next.js (auto-detected)
   - **Build Command**: leave default (`next build`)
   - **Install Command**: leave default (`pnpm install`)
4. Add **Environment Variables** (you can come back and add these after
   the backend is deployed):

   | Name                   | Value                                  |
   | ---------------------- | -------------------------------------- |
   | `NEXT_PUBLIC_API_URL`  | `https://forgeng-backend.onrender.com` |
   | `NEXT_PUBLIC_SITE_URL` | `https://<your-vercel-domain>`         |

5. Click **Deploy**.

That's it. Every push to `main` redeploys, and every PR gets its own preview
URL automatically.

### How updates work

- Edit `frontend/...` → push → Vercel rebuilds and deploys in ~1 minute.
- Open a PR → Vercel builds a unique preview URL and posts it back as a
  PR comment.
- Roll back to a previous deploy from the Vercel dashboard's
  **Deployments** tab — no code changes needed.

## 2. Backend → Render

The repo ships with a [`render.yaml`](./render.yaml) blueprint that
provisions the web service and the Postgres database in one click.

### One-time setup

1. Go to <https://dashboard.render.com/blueprints> and click **New
   Blueprint Instance**.
2. Connect your GitHub account if asked, then pick the `forgeng` repo.
3. Render reads `render.yaml` and shows two resources to create:
   - `forgeng-backend` (web service, Node)
   - `forgeng-db` (Postgres database, free plan)
4. Click **Apply**. Render provisions the database first, then builds the
   backend. The `DATABASE_URL` is wired automatically.
5. Wait for the first build to finish (~3–5 min). The web service will
   show a URL like `https://forgeng-backend.onrender.com`.
6. In the **forgeng-backend** service → **Environment** tab, set:

   | Variable      | Value                                                  |
   | ------------- | ------------------------------------------------------ |
   | `CORS_ORIGIN` | `https://<your-vercel-domain>` (comma-separated for many) |

   Hit **Save Changes** — Render redeploys with the new value.

7. Back in Vercel, set `NEXT_PUBLIC_API_URL` to the Render URL (step 1.4
   above) and redeploy the frontend.

### How updates work

- Edit `backend/...` → push → Render runs the build, applies any pending
  Prisma migrations, then starts the new instance.
- Migrations: `pnpm prisma migrate dev --name <change>` locally, commit
  the new folder under `backend/prisma/migrations/`, push. Render runs
  `prisma migrate deploy` on every boot, so the new migration applies
  automatically.

### Free tier caveats

The default `render.yaml` uses Render's free tier. For a real production
deploy you'll likely want to upgrade:

| Resource          | Free tier limitation                            | Upgrade        |
| ----------------- | ----------------------------------------------- | -------------- |
| Postgres          | Database **expires after 30 days** (data lost!) | Starter ($7/mo) |
| Web service       | Sleeps after 15 min idle, ~50s cold start       | Starter ($7/mo) |

Upgrades are a single click in the Render dashboard — no code changes.

## 3. After the first deploy

Verify the wiring end-to-end:

```bash
# 1. Backend health check
curl https://forgeng-backend.onrender.com/api/healthz
# → {"status":"ok","database":"connected", ... }

# 2. Frontend hits backend (open in browser)
open https://<your-vercel-domain>
# Sign in with one of the demo role buttons → API calls should succeed.
```

If `/api/healthz` returns OK but the frontend can't reach the backend,
the most common cause is a missing `CORS_ORIGIN` value on Render.

## 4. Optional: GitHub Actions

The repo intentionally ships **without** a CI workflow. Vercel and Render
both run their own build on every push, so any breaking change still gets
caught — just at the deploy step, not at the PR step.

Add a workflow under `.github/workflows/` only when you have a reason:

- **Pre-deploy CI gates** — run `pnpm lint` and `pnpm build` on PRs and
  block merges if either fails, so broken code never reaches `main`.
  Useful once multiple people are landing PRs into the same branch.
- **Test suite** — once you have unit/e2e tests, run them on every PR.
  For tests that need Postgres, add a `services: postgres` block.
- **Cross-environment promotion** — staging → production gating.
- **Scheduled jobs** — nightly database backups, periodic data sync, etc.

A reasonable starter `ci.yml` (frontend + backend lint + build, parallel
jobs, pnpm cache, 15-min timeout) takes ~70 lines. Ask whenever you want
one wired up.

## 5. Local environment files

For reference, here's what each environment needs:

### `frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### `backend/.env`

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/forgeng?schema=public
CORS_ORIGIN=http://localhost:3000
PORT=3001
```

Vercel and Render hold the production equivalents in their own
environment-variable UIs — never commit production secrets to the repo.
