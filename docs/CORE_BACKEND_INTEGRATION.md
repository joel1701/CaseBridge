# Core operational backend integration

Implemented on `joel-core-backend`, preserving the matching, Action Firewall, case-link review, decision and graph implementations. No branch switch, commit, push or PR was performed.

## Role mapping and security

Existing database/API role values remain stable: BUREAU_OFFICER maps to OFFICER; COORDINATING_OFFICER maps to BUREAU_HEAD; AICTE_ADMIN maps to ADMIN. The coordinating prototype role therefore has bureau-head review/assignment privileges. Frontends must send/display the existing enum values and must never infer authority from a label.

Login normalizes email, verifies bcrypt hashes, issues an eight-hour HS256 JWT in an HttpOnly cookie, and stores its random `jti` in AuthSession. Every protected request verifies JWT issuer/audience/expiry, requires a nonrevoked unexpired database session, and reloads the active user's current role/bureau. Legacy manually minted JWTs without a persisted session no longer work. Logout revokes the current session transactionally, audits it, and expires the cookie; other logged-in devices remain signed in. No token or password hash is returned in JSON. Public auth responses and all API responses use Cache-Control: no-store.

Existing exact Origin enforcement protects all mutations, including login/logout. CORS remains credentialed with one configured origin. Secure cookies are required in production; SameSite=None only works under production HTTPS. Prefer same-site custom frontend/API domains. Login counts attempts atomically in PostgreSQL: 10 per normalized account and 60 per client IP per 15-minute window; 429 includes Retry-After: 900. Throttle keys are SHA-256 hashes, not raw addresses. Set TRUST_PROXY_HOPS only to the exact trusted proxy topology; default 0 does not trust forwarded client IP headers.

## Additive migration

`apps/api/prisma/migrations/20261027000100_operational_backend/migration.sql` adds:

- Complaint sourceBureauId, assignedToId, createdById, resolvedAt, archivedAt and integer version; original references remain unchanged. Existing source bureaus are backfilled from current ownership. Both original-source/reference and current-bureau/reference uniqueness are enforced.
- Optional institution region/location.
- Alert recipient reference, unique dedupeKey and resolvedAt; ESCALATION and STATUS_CHANGE enum values.
- CoordinationWorkspace and CoordinationSharedAction with foreign keys, unique/composite keys, version checks and supporting indexes.
- AuthSession and LoginThrottle for revocation and shared login throttling.

No tables/columns/records are dropped. Existing disposed rows with unknown resolution timestamps remain null rather than inventing durations. PostgreSQL 16+ is the project baseline. Deploy migrations before starting this API version. Index creation and source-bureau backfill may briefly lock large tables; use a planned deployment window on a populated database. The migration was generated/validated locally but cannot be applied in this sandbox because PostgreSQL shared memory is denied. No development/production database was migrated automatically.

## Complaint workflows

Creation preserves originalId, sets sourceBureauId to the initial bureau, derives the creator from authentication, and starts in RECEIVED. Non-admins create only in their own bureau. JSON and CSV imports are atomic, 1–100 rows, with all input/reference/permission validation rolled back on any failed row.

Updates require expectedVersion and a nonempty reason. Every successful mutation increments version; stale requests receive 409 STALE_COMPLAINT. OFFICER may edit complaint content/deadlines and move an active case to UNDER_PROCESS or ESCALATED. BUREAU_HEAD/ADMIN may assign an active officer in the owning bureau, correct the institution, and dispose cases. Only ADMIN transfers ownership between bureaus. Transfer sets TRANSFERRED, preserves sourceBureauId/originalId, clears assignment unless an authorized destination officer is supplied, resolves old alerts and creates a destination status alert. Transfer does not rewrite historical actions or create an investigation action. The old bureau loses access to the complaint; historical actions retain their initiating bureau and remain subject to both case and action scopes.

Transitions: RECEIVED → UNDER_PROCESS / ESCALATED / DISPOSED; UNDER_PROCESS → ESCALATED / DISPOSED; TRANSFERRED → UNDER_PROCESS / ESCALATED / DISPOSED; ESCALATED → UNDER_PROCESS / DISPOSED. Same-status requests are allowed. DISPOSED cannot reopen under this contract. TRANSFERRED is set only by a real bureau transfer; sending it as a standalone status is rejected.

All complaint writes use the same institution advisory-lock namespace as the intelligence engine. Institution correction locks old/new keys in sorted order, reloads authorization/version and refuses active relationships or any workspace dependency. Reject inappropriate relationships through the existing review API first. A complaint referenced by any coordination workspace cannot transfer bureau under this contract, including a completed workspace; an explicit reassignment policy/migration is needed to preserve responsibilities. No alternate action-creation/update endpoint was introduced. Actual actions continue to go through the Action Firewall.

DELETE is an ADMIN-only archive of an already disposed complaint. It retains the row, references and audit history. Lists default to unarchived cases; `archived=true` selects archived records. Reports include historical/archived complaints, and authorized detail/timeline/graph reads remain available. No hard-delete or automatic disposition is implemented.

## Alerts and timelines

`POST /api/alerts/refresh` refreshes the caller's authorized bureau(s); heads/admins only. The standalone `npm run alerts:refresh -w @casebridge/api` checks all cases for a trusted operator/scheduler and cleans up expired session/throttle records older than one day. Schedule it every 5–15 minutes in the deployment platform; no scheduler has been installed or started automatically. Reads do not generate alerts.

DEADLINE_ALERT_HOURS defaults to 48, range 1–720. Deadline keys include case, due date and approaching/overdue stage. Pending-review alerts have stable per-case keys. Refresh resolves obsolete automatic alerts, retains manually resolved current-condition alerts, and updates recipient references. A manually resolved pending-review alert stays resolved until explicitly reopened; read state is shared by the bureau, not per-user. Status/escalation alerts are written with the complaint update and keyed by case/version. Requests to read/update alerts scope both the alert's bureau and its complaint's current bureau.

Timeline serialization uses event-specific field whitelists, including for ADMIN. Raw AuditLog.metadata, internalOverlapActionIds, private action/link IDs, model inputs and override text are never returned. Unknown events expose empty metadata. Actors from other bureaus are redacted for ordinary users. The reusable recordAudit helper writes inside the caller's transaction; existing intelligence audits remain compatible.

## Reporting

Dashboard/report queries use PostgreSQL counts/grouping and a repeatable-read transaction. Fields include totalComplaints, pendingComplaints (all nondisposed), disposedComplaints, escalatedComplaints, overdueCount, pendingOverlapReviews, activeActions, byStatus, byBureau, byCategory, byInstitution, monthly UTC trends, averageResolutionHours (null if no valid resolved cases) and coordinationRequiredCount. Coordination counts distinct authorized cases with a suggested/confirmed relationship to a different bureau, not the number of relationships or an automatic legal recommendation.

Date filters refer to complaint creation timestamps (inclusive UTC). All groups, trends, averages and nested institution counts use bureau scope. Basic institution and bureau directory records are shared reference data; complaint descriptions, case histories and officer directories are not globally exposed. Institution profiles include the latest 20 authorized complaint summaries; use the paginated complaint API for the full history.

## Persistent coordination

The existing domain service remains in place. A Prisma adapter persists workspace assignments/status and tracked action relationships, uses the institution lock and optimistic expectedVersion checks, and records attributable audit events. A workspace requires a confirmed case link; link rejection subsequently freezes workspace updates until the relationship is confirmed again. Heads assign only active officers from their own participating bureau and track only actions initiated by that bureau on a linked case. ADMIN may coordinate both sides. IN_PROGRESS/COMPLETED require a coordinator; completed workspaces cannot reopen. The existing domain contract still permits assignment/action tracking after completion, while prohibiting status reopening.

Workspace responses redact private complaint/action/coordinator identifiers. Involved bureau IDs are shared directory identifiers. Tracking an action never authorizes evidence access or creates/executes another investigation action. No uploaded evidence storage or legal sharing/consent mechanism is implemented.

## Seed and setup

The original labelled CSVs and evaluation results are untouched. Seed now creates the original 25 complaints plus 100 deterministic operational fixtures (125 total), the same 10 fictional institutions and two bureaus, existing overlapping actions/link, operational histories, overdue/escalated/disposed cases and five role-varied demo accounts. Fixed operational fixture dates are based on 27 October 2026; their deadlines will age naturally. Repeated runs preserve existing rows and passwords; newly inserted actions are explicitly synthetic fixture imports, not an application action write path.

Accounts: pgrc-officer, pgrc-head, rb-officer, rb-head and admin, each at `@casebridge.example.invalid`. SEED_DEMO_PASSWORD optionally supplies their initial password (12+ characters, <=72 UTF-8 bytes). Without it a random password is generated. Newly created demo credentials are written to `apps/api/.seed-credentials.json` with mode 0600, excluded from Git/formatting. Do not publish this file. Reruns do not reset passwords or rewrite that file if no new accounts are created. Existing optional SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD behavior remains supported. Seed is disabled in NODE_ENV=production.

From repository root:

```sh
npm install
# Configure apps/api/.env: DATABASE_URL, JWT_SECRET (32+ chars), FRONTEND_URL,
# shared AI_SERVICE_TOKEN, and AI_SERVICE_URL. Preserve existing secrets.
npm run db:generate
npm run db:deploy
npm run db:seed
npm run alerts:refresh -w @casebridge/api
npm run dev -w @casebridge/api
```

Run MiniLM separately as documented in JOEL_INTEGRATION.md. Set EMBEDDING_MODE=transformer, configure the shared service token, and provision the pinned model cache. Frontend must set VITE_USE_MOCKS=false and use credentialed requests; login is now real, with no fixture fallback or auth bypass.

## Frontend handoff

Kevin: login returns data.user and sets a cookie; GET auth/me returns data directly. Use complaint list filters/pagination and retain version from detail. PATCH sends only edited fields plus expectedVersion/reason. Use heads/admins for assignment/import; admin only for transfers/archives. CSV import uses JSON `{csv: "..."}`, not multipart. Institution/bureau directory and officer endpoints populate form controls. Alerts support read/resolved toggles.

Pritika: dashboard uses real scoped aggregates. Detail/timeline/action-history endpoints supply the investigation workspace. All seven intelligence contracts remain unchanged. New coordination workspace endpoints are separate from POST /coordination, which still records a decision only. Fetch workspace lists filtered by caseLinkId; retain version, send typed commands, reload after 409 STALE_COORDINATION. A null restricted identifier is not a navigation target. No graph/evidence access is expanded by confirmation or coordination.

All mutations require the trusted Origin header (browsers supply it), and all frontend requests must include credentials. Handle 401 with login, 403 with permission messaging, 404 as absent/inaccessible, 409 with an explicit reload/review, and 503 as a dependency failure. Never substitute mock success.

## Verification

Run lint/typecheck/build/test/db:validate/format:check from root. Default tests exercise real Express handlers with explicit repository doubles where a database is absent; database integration is opt-in and not represented as passed by mocks.

For an explicitly disposable PostgreSQL database:

```sh
export CASEBRIDGE_TEST_DATABASE_URL='<disposable test database URL>'
DATABASE_URL="$CASEBRIDGE_TEST_DATABASE_URL" npm run db:deploy
npm run test -w @casebridge/api -- src/modules/complaints/core.integration.test.ts src/modules/matching/intelligence.integration.test.ts
```

For the additional model-dependent database cases, start FastAPI with matching AI_SERVICE_TOKEN and AI_SERVICE_URL, then prefix the test command with CASEBRIDGE_TEST_AI=1. Tests create randomly prefixed records and delete only their own records. They never infer the test URL from the development DATABASE_URL. CI's disposable PostgreSQL service now runs both suites after migration and repeat seed checks. Local PostgreSQL startup still fails with sandbox `shmget: Operation not permitted`; CI changes have not been pushed or executed remotely in this task.

## Final local results — 27 October 2026

- Lint, both workspace type checks, web/API production builds, Prisma client generation, schema validation, formatting and whitespace checks passed.
- Backend default run: 48 passed, 19 explicitly skipped. Eighteen skipped cases require PostgreSQL (nine existing intelligence, nine new operational); the separate real AI HTTP test is the remaining opt-in skip and passed when run separately.
- Python suite: 12 passed with RUN_MODEL_TESTS=1, including the actual cached MiniLM model. The FastAPI-to-TypeScript matching HTTP integration also passed.
- Existing matching/firewall/link/graph algorithms and labelled evaluation fixtures are unchanged. Their runnable tests pass; auth fixtures now mint persisted-session JWTs to match the strengthened authentication protocol.
- Migration application, repeatable seed execution and actual PostgreSQL concurrency/aggregation/workspace tests remain locally unverified due to the sandbox shared-memory restriction. The updated CI database job has not been run remotely for this branch.
- Branch remains joel-core-backend. No commits, pushes, PRs or branch switches were performed.
