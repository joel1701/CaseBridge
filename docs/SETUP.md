# Developer setup

## Prerequisites

Use Node 24 LTS (`.nvmrc`; minimum 22.12) and npm with workspaces. Use Python 3.12 for the pinned scientific/ML wheels. Git is required; PostgreSQL 16+ is needed only for database work. Docker is optional. Python 3.14 may not support all pinned ML wheels.

## Clone and install

Once a GitHub remote exists, clone its real URL, then `cd casebridge`. No remote has been created or assumed.

```sh
npm install
cp apps/web/.env.example apps/web/.env
cp apps/api/.env.example apps/api/.env
npm run dev
```

Frontend http://localhost:5173; API http://localhost:3001/api/health. Root `.env.example` is a reference; each app reads its own `.env`. The workspace commands run in the correct application directory. Never commit `.env`.

Generate an auth secret with `openssl rand -hex 32` and place it in `apps/api/.env` as JWT_SECRET. Do not paste it in commits. Blank is accepted in development so health/stubs run; production requires a secret. Login still returns 501 until implemented.

Mock mode: `VITE_USE_MOCKS=true` returns typed synthetic data. Set false and restart Vite for real API requests; pending endpoints visibly fail with 501. Vite variables are public and embedded at build time. No password/database/JWT secret belongs in them.

## PostgreSQL

Simplest: create a development database at Neon/Supabase/equivalent and place its direct migration connection URL in `apps/api/.env`. Follow provider SSL guidance. Or install PostgreSQL locally with your OS package manager, create a `casebridge` role/database, and choose your own password.

Optional Docker command (choose a unique development password; never use a production password):

```sh
read -s CASEBRIDGE_DB_PASSWORD
export CASEBRIDGE_DB_PASSWORD
docker run --name casebridge-postgres -e POSTGRES_USER=casebridge -e POSTGRES_PASSWORD="$CASEBRIDGE_DB_PASSWORD" -e POSTGRES_DB=casebridge -p 5432:5432 -v casebridge-pg:/var/lib/postgresql/data -d postgres:16
unset CASEBRIDGE_DB_PASSWORD
```

Set DATABASE_URL with those credentials. Do not delete the volume unless you intend to lose its data.

```sh
npm run db:generate
npm run db:validate
npm run db:deploy
npm run db:seed
```

`db:deploy` applies the checked-in baseline migration. For later schema edits use `npm run db:migrate -- --name describe_change` (the root workspace forwarding may require running `npm run db:migrate -w @casebridge/api -- --name describe_change` directly). Commit resulting migrations. Migration development requires a database role allowed to create a shadow database or an explicitly configured shadow URL. `db:generate` and validate do not connect to PostgreSQL.

Seed creates 2 bureaus, 10 institutions, 25 complaints, 4 actions, a suggestion and an alert. Optional `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` create a demo admin with a bcrypt hash. Password must be 12+ characters and <=72 UTF-8 bytes. No default account/password exists. Seed only against a development database; it preserves existing records.

## AI service

In a separate terminal:

```sh
cd apps/ai
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

Use `pip install -r requirements-base.txt` instead for tests without the ML runtime. Both installation paths avoid model downloads. The default EMBEDDING_MODE=transformer uses MiniLM; fixture mode is an explicit test utility and is rejected by the Express matching integration. Model loading is lazy and local-cache-only unless ALLOW_MODEL_DOWNLOAD=true. PRELOAD_MODEL=true attempts startup loading; unavailable weights leave inference unavailable without silently falling back. Model download requires network access and disk space.

Authenticated batch inference is available at `POST /v1/similarities`. Configure the same AI_SERVICE_TOKEN (at least 32 characters) in both services. Health is liveness, not model or database readiness. See [Joel integration](JOEL_INTEGRATION.md) for setup, contracts and measured evaluation.

```sh
.venv/bin/python -m pytest
```

## Checks and production builds

```sh
npm run lint
npm run typecheck
npm run test
npm run build
npm run format:check
```

`npm run build -w @casebridge/web` builds without a DB. API: `npm run build -w @casebridge/api` then `npm start -w @casebridge/api`. For Vercel, install at repository root, build the web workspace, output `apps/web/dist`; the included SPA rewrite supports direct route loads. For Render API, install with `npm ci`, build API, start the API workspace; set API_PORT to the platform port. AI: install requirements and start `uvicorn app.main:app --host 0.0.0.0 --port "$PORT"`. Supply production origin, HTTPS cookie configuration and secrets in provider settings. Configure private AI connectivity and the shared service token before enabling matching.

## Troubleshooting

- ESM/engine errors: use the supported Node version and reinstall with the lockfile.
- Prisma imports missing: run db:generate; never commit generated source.
- P1001/connection failures: verify PostgreSQL is running, DATABASE_URL and provider TLS settings. Health alone does not test DB connectivity.
- Model unavailable: fixture mode is offline; transformer mode needs cached weights or explicit ALLOW_MODEL_DOWNLOAD=true.
- CORS/cookie issues: FRONTEND_URL must match the browser origin exactly (localhost and 127.0.0.1 differ). Writes require Origin. Production requires HTTPS; cross-site cookies need SameSite=None and may still face browser restrictions.
- 501: expected for unfinished routes, including login. No authentication bypass is supplied.
- npm cache permission errors: choose a writable cache with `npm install --cache /tmp/casebridge-npm-cache`; do not change home-directory ownership as a routine fix.
- Port busy: stop the process using 5173/3001/8000 or update both service config and consumers. Vite uses strictPort to avoid a hidden CORS mismatch.
