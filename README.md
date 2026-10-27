# CaseBridge

Team Aarohan · Smart India Hackathon 2026 · SIH26264 (AICTE)

A foundation for authorized cross-bureau complaint investigation and coordination. PGRC and RB may receive related complaints independently, leading to repeated evidence requests, duplicate investigations and delayed resolution. CaseBridge will help officers identify relationships while preserving original complaint IDs and bureau ownership.

**Implementation status:** the browser remains a foundation shell. Joel's matching, Action Firewall, link review, graph and coordination-decision endpoints are implemented; authentication, complaint workflows, scoped reporting and persistent coordination are also implemented. See [core backend handoff](docs/CORE_BACKEND_INTEGRATION.md) for setup and pending local PostgreSQL verification. All included data is fictional. This is not an official AICTE service.

## Planned USPs

- Explainable complaint matching: institution, category, semantics and contextual evidence; officers review suggestions.
- Action Firewall: warn about duplicate or conflicting proposed actions and recommend coordination. No automatic regulatory decisions.
- Investigation knowledge graph: authorized institution, complaint, bureau and action relationships.
- Optional later: Institutional Pattern Radar.

## Stack

React 19, Vite, TypeScript, Tailwind CSS 4, shadcn/ui-compatible source components, React Router, TanStack Query, Axios, React Flow, Recharts and Lucide. Express 5, Prisma 7 with PostgreSQL adapter, Zod, JWT HttpOnly cookie helpers and bcrypt. FastAPI, NumPy and lazy Sentence Transformers (`all-MiniLM-L6-v2`). npm workspaces, ESLint, Prettier, Vitest, Supertest and Pytest.

## Quick start

Node 24 LTS recommended; Python 3.12 recommended. PostgreSQL is optional for browsing the starter.

```sh
npm install
cp apps/web/.env.example apps/web/.env
cp apps/api/.env.example apps/api/.env
npm run dev
```

Open http://localhost:5173. API health: http://localhost:3001/api/health. The blank JWT secret intentionally leaves auth disabled; it is not needed for health or placeholders. To prepare auth, generate a random secret and put it in `apps/api/.env`.

```sh
cd apps/ai
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

AI health: http://localhost:8000/health. Installation does not download model weights. `requirements-base.txt` is a lighter alternative for fixture-only work.

## Services and repository

```text
casebridge/
├── apps/web/       # browser shell, owned feature folders, mock/API adapters
├── apps/api/       # Express, middleware, Prisma schema/migration/seed
├── apps/ai/        # FastAPI health, lazy embeddings, fixture tests
├── data/           # 10 institutions, 25 complaints, labels, actions/scenarios
├── docs/           # product, architecture, contracts, ownership, setup
└── scripts/        # shared automation guidance
```

Browser → Express API → PostgreSQL. Express will call the private AI service; the browser never calls it directly. The AI exposes a service-token-protected batch similarity route. Frontend mock mode is explicit (`VITE_USE_MOCKS=true`) and never used as a fallback for failed real requests.

| Member  | Start here                                                                                  |
| ------- | ------------------------------------------------------------------------------------------- |
| Joel    | AI service; matching, action-firewall, case-links, coordination, graph API modules          |
| Vishwak | Prisma, auth, complaint/institution/bureau operations, alerts, reports, history, middleware |
| Pritika | App/layout, dashboard, investigations, graph, matching, coordination UI                     |
| Kevin   | Login, complaints, institution profiles, bureau queue, reports UI                           |

See [ownership](docs/TEAM_OWNERSHIP.md), [API contracts](docs/API_CONTRACT.md), [setup](docs/SETUP.md), [architecture](docs/ARCHITECTURE.md), [schema](docs/DATABASE_SCHEMA.md), [spec](docs/PROJECT_SPEC.md) and [demo scenarios](docs/DEMO_SCENARIOS.md).

## Checks

```sh
npm run lint
npm run typecheck
npm run build
npm run test
npm run db:validate
npm run format:check
cd apps/ai
.venv/bin/python -m pytest
```

`npm install` generates Prisma Client without connecting to a database. No service starts automatically after install. Database migration and seed instructions are in SETUP. Deployments target Vercel (web), Render (API and AI), and managed PostgreSQL; deployment itself is outside this setup.

Core operational backend (authentication, complaint workflows, alerts, reports and persistent coordination): see [integration/setup handoff](docs/CORE_BACKEND_INTEGRATION.md).
