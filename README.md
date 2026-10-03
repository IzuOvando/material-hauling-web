This is the material-hauling platform — a multi-tenant web app for managing hauling vouchers, enterprises, and material records. Each client (tenant) gets its own branded Vercel deployment backed by its own database.

# Pre-requisites
This project has interactions with many SaaS solutions (in specific from [Vercel](https://vercel.com/)) and other components, so at least for run this project is necessary to have:
- **PostgreSQL Database** (not mandatory to be [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) one)
- **[Vercel KV](https://vercel.com/docs/storage/vercel-kv)** (Redis instance that runs under [Upstash Server](https://upstash.com/))
- **[Vercel Blob](https://vercel.com/docs/storage/vercel-blob)** (mandatory to be able to upload databases even in local development)

> [!TIP]
> In order to facilitate local development it was created a docker image ([see installation ](#installation) for more information) where a **PostgreSQL** Database and a **Vercel KV** Redis Instance is available for use.


# Installation 💻

It requires to have Node.js installed with at least version v18.20.4.

First, install all the dependencies with:
```bash
npm install
# or
yarn
# or
pnpm install
```

Then set all the environment variables as in the `.env.example`.

For a local development we recommend you to set the following variables in your own `.env` like this:
```dosini
# * ROOT CONFIG
BASE_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=development

# * AUTH
AUTH_URL=http://localhost:3000
AUTH_SECRET=secret
```
The other variables is up to you to set them.

## (Optional) Setting Docker Compose 🐳
In order to have a local **PostgreSQL** Database and a **Vercel KV** Redis Instance you must run:
```bash
docker-compose up
```
> [!IMPORTANT]
> We assume you have docker installed

Then for be able to use the instances you must set the following variables in your `.env`:
```dosini
# * DATABASE
DATABASE_URL=postgresql://postgres:N0M3L0S3@localhost:5432/material_hauling_db
POSTGRES_URL_NON_POOLING=postgresql://postgres:N0M3L0S3@localhost:5432/material_hauling_db

# * VERCEL KV / REDIS 
KV_REST_API_URL=http://localhost:8079
KV_REST_API_TOKEN=dev_token
```
> [!NOTE]
> As you can see, we are not adding the `KV_URL` & `KV_REST_API_READ_ONLY_TOKEN` cause they are no strictly needed.

In the first run of the compose your set of containers will be created and in the following runs of the same command will raise the containers again.

> [!IMPORTANT]
> You must raise your containers whenever you want to start developing in local. 

# Running ⚙️
For run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

# Releases & CI/CD 🚀

## Multi-client Architecture

Every client (tenant) has its own Vercel project, its own database, and its own branding. A single codebase is shared across all of them. The source of truth for which clients exist is `clients/_registry.json`.

```
clients/
├── _registry.json          ← ["sedena", "turist-trucks", ...]
├── sedena/
│   └── web-project-id      ← Vercel project ID (non-sensitive)
└── turist-trucks/
    └── web-project-id      ← Vercel project ID (non-sensitive)
```

Each Vercel project holds its own environment variables (database URL, secrets, blob store, KV) and has `NEXT_PUBLIC_TENANT=<client>` set so the build picks up the correct branding from `tenant-assets/<client>/`. See [WHITE_LABEL.md](WHITE_LABEL.md) for how branding works.

## Branch Strategy

| Branch                        | Environment    | Who gets deployed              | Trigger                                           |
| ----------------------------- | -------------- | ------------------------------ | ------------------------------------------------- |
| `main`                        | **Staging**    | All clients (matrix, parallel) | Every push auto-deploys to Vercel staging         |
| GitHub Release (tag `vX.Y.Z`) | **Production** | All clients (matrix, parallel) | Publishing a release deploys to Vercel production |

Each job in the matrix reads `clients/<client>/web-project-id` and sets `VERCEL_PROJECT_ID` before calling `vercel deploy`. Quality checks and DB migration run once, then all clients deploy in parallel.

## Staging Auto-Deploy

Every push to `main` automatically runs:
1. Lint + type check
2. Prisma migrations against the staging database (runs once, shared schema)
3. Parallel Vercel staging deploy — one job per client in the registry

If quality checks or migrations fail, all deploys are skipped.

## How to Do a Production Release

### Without new database migrations

1. Merge all changes to `main` and verify staging looks correct across tenants
2. Go to GitHub → **Releases** → **Draft a new release**
3. Create a new tag following semver: `v1.2.3`
4. Add release notes and click **Publish release**
5. The release workflow runs automatically:
   - Quality checks (lint + type check)
   - Migration gate: confirms production DB is up to date (fails loudly if not)
   - Version bump committed to `main`
   - All clients deployed to production in parallel

### With new database migrations

1. Merge changes to `main` — staging auto-deploy will apply migrations to the staging DB
2. Verify staging looks correct
3. Go to GitHub → **Actions** → **Manual — Database Migration** → **Run workflow**
   - `environment`: `production`
   - `action`: `deploy`
4. Verify the migration workflow completes successfully
5. Go to GitHub → **Releases** → **Draft a new release** → create tag `vX.Y.Z` → **Publish release**

> [!WARNING]
> If you publish a release without applying migrations first, the release workflow will fail at the migration gate and tell you to run the manual workflow. No deployment will occur.

## Adding a New Client

1. Create a new Vercel project (any name) in the team dashboard or via CLI
2. Set all required env vars on that project (database URL, `AUTH_SECRET`, `BLOB_READ_WRITE_TOKEN`, KV vars, `NEXT_PUBLIC_TENANT=<new-client>`, `BASE_URL`, `AUTH_URL`, `NEXT_PUBLIC_API_URL`)
3. Set `framework: nextjs` on the project (either via dashboard settings or Vercel API — new projects created via CLI don't auto-detect)
4. Add the client's branding under `tenant-assets/<new-client>/` (see [WHITE_LABEL.md](WHITE_LABEL.md))
5. Add `clients/<new-client>/web-project-id` with the Vercel project ID
6. Add `"<new-client>"` to `clients/_registry.json`
7. Push to `main` — the next staging deploy will include the new client automatically

## Manual Migration Workflow

The **"Manual — Database Migration"** workflow (triggered from GitHub Actions → Run workflow) supports three use cases:

| Use case                               | `environment`             | `action`   | `migration_name`                      |
| -------------------------------------- | ------------------------- | ---------- | ------------------------------------- |
| Apply pending migrations to staging    | `staging`                 | `deploy`   | —                                     |
| Apply pending migrations to production | `production`              | `deploy`   | —                                     |
| Mark a failed migration as rolled back | `staging` or `production` | `rollback` | e.g. `20241121165401_first_migration` |

> [!NOTE]
> Migrations run against a shared schema. All tenants of the same environment (staging or production) share the same DB migration state.

## Rollback

Prisma does not support automatic rollback. Use the **"Manual — Database Migration"** workflow with `action=rollback` and the exact migration folder name to mark a failed migration as resolved in `_prisma_migrations`, then fix the underlying issue and re-run `deploy`.

> [!WARNING]
> `rollback` does **not** undo any SQL already executed — it only updates the migration record. If DDL was partially applied, inspect the database manually before re-running migrations.