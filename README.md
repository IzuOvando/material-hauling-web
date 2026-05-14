This is the Ticket Printer Web App where SEDENA could print bunch of tickets using multiple Thermal Printers.

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
DATABASE_URL=postgresql://postgres:N0M3L0S3@localhost:5432/sedena_tickets
POSTGRES_URL_NON_POOLING=postgresql://postgres:N0M3L0S3@localhost:5432/sedena_tickets

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

## Branch Strategy

| Branch                        | Environment    | Trigger                                           |
| ----------------------------- | -------------- | ------------------------------------------------- |
| `main`                        | **Staging**    | Every push auto-deploys to Vercel staging         |
| GitHub Release (tag `vX.Y.Z`) | **Production** | Publishing a release deploys to Vercel production |

## Staging Auto-Deploy

Every push to `main` automatically runs:
1. Lint + type check
2. Prisma migrations against the staging database
3. Vercel staging deployment

If migrations or quality checks fail, the deploy is skipped. No manual action needed.

## How to Do a Production Release

### Without new database migrations

1. Merge all changes to `main` and verify staging looks correct
2. Go to GitHub → **Releases** → **Draft a new release**
3. Create a new tag following semver: `v1.2.3`
4. Add release notes and click **Publish release**
5. The release workflow runs automatically: quality checks → migration gate (passes) → version bump commit → Vercel production deploy

### With new database migrations

1. Merge all changes to `main` and verify staging looks correct (migrations will have already been applied to staging by the auto-deploy)
2. Go to GitHub → **Actions** → **Manual — Database Migration** → **Run workflow**
   - `environment`: `production`
   - `action`: `deploy`
3. Verify the workflow completes successfully
4. Go to GitHub → **Releases** → **Draft a new release** → create tag `vX.Y.Z` → **Publish release**
5. The release workflow checks that production migrations are up to date, bumps `package.json` version, and deploys to Vercel production

> [!WARNING]
> If you publish a release without applying migrations first, the release workflow will fail at the migration gate and tell you to run the manual workflow. No deployment will occur.

## Manual Migration Workflow

The **"Manual — Database Migration"** workflow (triggered from GitHub Actions → Run workflow) supports three use cases:

| Use case                               | `environment`             | `action`   | `migration_name`                      |
| -------------------------------------- | ------------------------- | ---------- | ------------------------------------- |
| Apply pending migrations to staging    | `staging`                 | `deploy`   | —                                     |
| Apply pending migrations to production | `production`              | `deploy`   | —                                     |
| Mark a failed migration as rolled back | `staging` or `production` | `rollback` | e.g. `20241121165401_first_migration` |

## Rollback

Prisma does not support automatic rollback. Use the **"Manual — Database Migration"** workflow with `action=rollback` and the exact migration folder name to mark a failed migration as resolved in `_prisma_migrations`, then fix the underlying issue and re-run `deploy`.

> [!WARNING]
> `rollback` does **not** undo any SQL already executed — it only updates the migration record. If DDL was partially applied, inspect the database manually before re-running migrations.