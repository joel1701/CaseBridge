# Core operational backend integration

Implemented by Joel on `joel-core-backend` (merged to `main` as `5d6ef3f`), preserving the matching, Action Firewall, case-link review, decision and graph implementations. Verified against real PostgreSQL 16 and the real MiniLM service, and completed, by Vishwak on `vishwak` (28 October 2026). See [Verification](#verification--28-october-2026) for the evidence.

## Role mapping and security

Existing database/API role values remain stable: BUREAU_OFFICER maps to OFFICER; COORDINATING_OFFICER maps to BUREAU_HEAD; AICTE_ADMIN maps to ADMIN. The coordinating prototype role therefore has bureau-head review/assignment privileges. Frontends must send/display the existing enum values and must never infer authority from a label.

Login normalizes email, verifies bcrypt hashes, issues an eight-hour HS256 JWT in an HttpOnly cookie, and stores its random `jti` in AuthSession. Every protected request verifies JWT issuer/audience/expiry, requires a nonrevoked unexpired database session, and reloads the active user's current role/bureau. Legacy manually minted JWTs without a persisted session no longer work. Logout revokes the current session transactionally, audits it, and expires the cookie; other logged-in devices remain signed in. No token or password hash is returned in JSON. Public auth responses and all API responses use Cache-Control: no-store.

Login counts attempts atomically in PostgreSQL: 10 per normalized account and 60 per client IP per 15-minute window; 429 includes Retry-After: 900. A successful login clears that account's counter (the per-IP window keeps counting), so repeated legitimate sign-ins no longer lock a demo account. Throttle keys are SHA-256 hashes, not raw addresses or emails.

### Cookies, origin and proxies in deployment

| Setting            | Local                   | Vercel web + Render API                                                                                                                                                                                                                                       |
| ------------------ | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`         | `development`           | `production` (forces Secure cookies; JWT_SECRET required at startup)                                                                                                                                                                                          |
| `FRONTEND_URL`     | `http://localhost:5173` | The exact browser origin, e.g. `https://setu.example`. Scheme, host and port must match; no trailing path                                                                                                                                                     |
| `COOKIE_SAME_SITE` | `lax`                   | `lax` when web and API share a registrable domain (preferred, e.g. `app.example` + `api.example`). `none` only for unrelated default domains (`*.vercel.app` + `*.onrender.com`); browsers that block third-party cookies will still refuse it                |
| `TRUST_PROXY_HOPS` | `0`                     | The number of reverse proxies in front of Express. Render puts its load balancer in front of the service, so start with `1`, then confirm in staging that the throttle sees distinct client IPs (not the proxy's). Never set it higher than the real topology |

Exact Origin enforcement protects all mutations, including login/logout, and CORS remains credentialed for the single configured origin. With `TRUST_PROXY_HOPS=0` behind a proxy, every user shares the proxy's address, so the 60-per-IP login limit becomes global. With too large a value, clients can forge `X-Forwarded-For` and evade the limit.

Use `GET /api/health/ready` as the Render health check: it returns 503 until the database answers and JWT_SECRET is set, and reports only booleans. `GET /api/health` stays process liveness only.

## Migrations

`20261027000100_operational_backend` (Joel) is additive. It adds:

- Complaint source/assignment/creator/resolution/archive fields and `version`; the source-bureau backfill; and both reference uniqueness rules.
- Institution region/location.
- Alert recipient, unique dedupeKey and resolvedAt, plus the ESCALATION/STATUS_CHANGE enum values.
- CoordinationWorkspace and CoordinationSharedAction.
- AuthSession and LoginThrottle.
- The supporting indexes, foreign keys and nonnegative-version checks.

No tables, columns or records are dropped. Existing disposed rows keep a null `resolvedAt` rather than an invented duration.

`20261028000100_source_bureau_not_null` (Vishwak) re-runs the source-bureau backfill and makes `Complaint.sourceBureauId` NOT NULL. Every write path already sets it (create, JSON/CSV import, seed, transfer preservation). Enforcing it means `(sourceBureauId, originalId)` uniqueness also covers rows created before the operational backend. Prisma Client types now report `sourceBureauId: string`. Test fixtures that insert complaints directly must supply it.

PostgreSQL 16+ is the baseline. Run `npm run db:deploy` as a release step before starting this API version. Index creation and both backfills briefly lock `Complaint`, so use a planned window on a populated database. No development or production database was migrated automatically.

## Complaint workflows

Creation preserves originalId, sets sourceBureauId to the initial bureau, derives the creator from authentication, and starts in RECEIVED. Non-admins create only in their own bureau. JSON and CSV imports are atomic, 1–100 rows, with all input/reference/permission validation rolled back on any failed row.

Updates require expectedVersion and a nonempty reason. Every successful mutation increments version; stale requests receive 409 STALE_COMPLAINT. OFFICER may edit complaint content/deadlines and move an active case to UNDER_PROCESS or ESCALATED. BUREAU_HEAD/ADMIN may assign an active officer in the owning bureau, correct the institution, and dispose cases.

Transfers between bureaus are ADMIN only:

- Transfer sets TRANSFERRED and preserves sourceBureauId/originalId. It clears the assignment unless an authorized destination officer is supplied.
- It resolves the complaint's open alerts, releasing their keys so the destination's next refresh raises fresh deadline/review alerts, and it creates a destination status alert.
- A destination that already holds the same originalId returns 409 DUPLICATE_REFERENCE, and nothing changes.
- Transfer does not rewrite historical actions or create an investigation action.
- The old bureau loses access to the complaint. Historical actions keep their initiating bureau and remain subject to both case and action scopes.

Transitions: RECEIVED → UNDER_PROCESS / ESCALATED / DISPOSED; UNDER_PROCESS → ESCALATED / DISPOSED; TRANSFERRED → UNDER_PROCESS / ESCALATED / DISPOSED; ESCALATED → UNDER_PROCESS / DISPOSED. A same-status request is accepted but is not a lifecycle event: no status audit and no status alert. DISPOSED cannot reopen. TRANSFERRED is set only by a real bureau transfer; sending it as a standalone status is rejected. Disposal resolves the complaint's earlier open alerts before the disposal status alert is written.

All complaint writes use the same institution advisory-lock namespace as the intelligence engine (`setu:institution:<id>`, sorted acquisition, 5 s lock timeout). A lock timeout or pool exhaustion now returns 503 DEPENDENCY_UNAVAILABLE instead of 500. Institution correction locks old/new keys in sorted order, reloads authorization/version and refuses active relationships or any workspace dependency. Reject inappropriate relationships through the existing review API first. A complaint referenced by any coordination workspace cannot transfer bureau, including a completed workspace. No alternate action-creation/update endpoint exists; actual actions continue to go through the Action Firewall.

DELETE is an ADMIN-only archive of a disposed, not-yet-archived complaint (re-archiving returns 409 INVALID_STATE). It retains the row, references and audit history, and resolves remaining open alerts. Lists default to unarchived cases; `archived=true` selects archived records. Reports include historical/archived complaints, and authorized detail/timeline/graph reads remain available. No hard delete, unarchive or automatic disposition is implemented.

## Alerts and the deadline monitor

`POST /api/alerts/refresh` refreshes the caller's authorized bureau(s); heads/admins only. The standalone `npm run alerts:refresh -w @setu/api` checks all cases for a trusted operator/scheduler and deletes session/throttle rows that expired more than a day ago. On failure it logs only an error code (for example `P1001` or `DATABASE_NOT_CONFIGURED`) and exits 1. Reads never generate alerts.

DEADLINE_ALERT_HOURS defaults to 48 (range 1–720). Keys:

- Deadline alerts: `deadline:<case>:<dueAt>:approaching|overdue`, so moving from approaching to overdue raises a new alert.
- Pending-review alerts: `review:<case>`.
- Status/escalation alerts: `status:<case>:<version>`, written with the complaint update.

Resolution semantics:

- **Manual** (`PATCH /api/alerts/:id` with `resolved: true`): the key is kept, so refresh does not re-raise the alert while the same condition persists.
- **Automatic** (condition cleared on refresh, transfer, disposal, archive): the alert is resolved and its key is released as `<key>#closed:<alertId>`. If the condition recurs, for example a case becoming PENDING review again, refresh creates a fresh alert. Before this fix, an automatically resolved review or deadline alert could never recur.

Each case refreshes in its own transaction under the institution lock, so concurrent refreshes (cron plus a head pressing refresh) serialize per case without duplicate-key failures. Disposed/archived cases are skipped unless an automatic alert is still open. Read/resolved state is shared by the bureau, not per user. Requests to read/update alerts scope both the alert's bureau and its complaint's current bureau.

**Scheduling:** no scheduler is installed by the repository. On Render, add a Cron Job service that uses the API's build and environment (same `DATABASE_URL`, `DEADLINE_ALERT_HOURS`; JWT/AI secrets not needed) with the command `npm run alerts:refresh -w @setu/api` and schedule `*/10 * * * *` (any value in 5–15 minutes). Elsewhere, use the platform scheduler or `cron` with the same command. Overlapping runs are safe but wasteful; keep the interval longer than a run.

## Timelines

Timeline serialization uses event-specific field whitelists, including for ADMIN. Raw AuditLog.metadata, internalOverlapActionIds, private action/link IDs, model inputs and override text are never returned; the DB tests assert this for timelines, alerts and reports after a firewall-override audit. Unknown events expose empty metadata. Actors from other bureaus are redacted for ordinary users. Workspace events now show `workspaceId`, operation, version and the status pair, never coordinator or action IDs.

## Reporting

Dashboard/report queries use PostgreSQL counts/grouping in a repeatable-read transaction. Fields: totalComplaints, pendingComplaints (all nondisposed), disposedComplaints, escalatedComplaints, overdueCount, pendingOverlapReviews, activeActions, byStatus, byBureau, byCategory, byInstitution, monthly UTC trends, averageResolutionHours (null if no valid resolved cases) and coordinationRequiredCount. Coordination counts distinct authorized cases with a suggested/confirmed relationship to a different bureau.

Date filters refer to complaint creation timestamps and are inclusive at both ends in UTC; this is verified at exact boundaries. averageResolutionHours averages complaints created in the window, not resolved in it. All groups, trends, averages and nested institution counts use bureau scope. Institution profiles include the latest 20 authorized complaint summaries; use the paginated complaint API for the full history.

## Persistent coordination

The existing domain service remains in place. A Prisma adapter persists workspace assignments/status and tracked actions, uses the institution lock and optimistic expectedVersion checks, and records attributable audit events. Two concurrent writers with the same version produce exactly one success and one 409 STALE_COORDINATION. This is verified on real PostgreSQL.

- A workspace requires a confirmed case link. Link rejection freezes workspace updates until the relationship is confirmed again.
- Heads assign only active officers from their own participating bureau and track only actions initiated by that bureau on a linked case. ADMIN may coordinate both sides.
- IN_PROGRESS/COMPLETED require a coordinator. Completed workspaces cannot reopen; the domain contract still permits assignment/action tracking after completion.

New in this pass:

- **Discovery:** `GET /api/coordination/workspaces` accepts `complaintId` and `status` alongside `caseLinkId`, and serializes the whole page in one snapshot. It previously opened one transaction per item and could exhaust the connection pool.
- **Responsibility history:** every workspace audit records `fromStatus/toStatus`, `fromCoordinatorId/toCoordinatorId` and `actionId`. `GET /api/coordination/workspaces/:id/history` returns one entry per version, with cross-bureau actors, coordinators and actions redacted. Events from before 28 October 2026 lack the workspace reference and are not listed.

Workspace responses redact private complaint/action/coordinator identifiers. Involved bureau IDs are shared directory identifiers. Tracking an action never authorizes evidence access or creates/executes another investigation action.

## Seed and setup

The original labelled CSVs and evaluation results are untouched. The seed creates:

- the original 25 complaints plus 100 deterministic operational fixtures (125 total);
- 10 synthetic institutions and two bureaus;
- the existing actions/link and operational histories, including overdue, escalated and disposed cases;
- five role-varied demo accounts.

Fixed operational fixture dates are based on 27 October 2026, so their deadlines age naturally. Repeated runs preserve existing rows and passwords, verified by identical row counts and password-hash digests across runs. The seed runs as one transaction with a 120 s timeout to allow for hosted-database latency. If a row conflicts with a differently identified existing record, it names the constraint, rolls back and changes nothing.

Accounts: pgrc-officer, pgrc-head, rb-officer, rb-head and admin, each at `@setu.example.invalid`. SEED_DEMO_PASSWORD optionally supplies their initial password (12+ characters, <=72 UTF-8 bytes); without it a random password is generated. Newly created credentials are merged into `apps/api/.seed-credentials.json` (mode 0600, Git-ignored), and earlier entries are kept. Do not publish this file. Reruns that create no accounts leave it untouched. SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD remain supported. Seed is disabled in NODE_ENV=production.

From the repository root:

```sh
npm install
# Configure apps/api/.env: DATABASE_URL, JWT_SECRET (32+ chars), FRONTEND_URL,
# shared AI_SERVICE_TOKEN, and AI_SERVICE_URL. Preserve existing secrets.
npm run db:generate
npm run db:deploy
npm run db:seed
npm run alerts:refresh -w @setu/api
npm run dev -w @setu/api
```

Run MiniLM separately as documented in JOEL_INTEGRATION.md: EMBEDDING_MODE=transformer, the shared service token and the pinned model cache. The frontend must set VITE_USE_MOCKS=false and use credentialed requests; login is real, with no fixture fallback or auth bypass.

## Frontend handoff

**Both:** every request needs credentials, and every mutation needs the trusted Origin (browsers send it). Handle the status codes like this, and never substitute mock success:

- 401 → login
- 403 → permission message
- 404 → absent or inaccessible
- 409 → explicit reload/review; show `error.code`
- 503 → dependency failure (DATABASE_NOT_CONFIGURED, DEPENDENCY_UNAVAILABLE, AI_UNAVAILABLE); offer a retry

**Kevin (complaints, queues, reports, auth):**

- Login returns `data.user` and sets the cookie; `GET /auth/me` returns the user directly.
- Use the complaint list filters/pagination and keep `version` from detail. PATCH sends only edited fields plus `expectedVersion`/`reason`.
- Show the new 409 codes in plain language: `DUPLICATE_REFERENCE` on transfer means the destination bureau already has that reference; `INVALID_STATE` on archive means it is already archived.
- Use heads/admins for assignment/import, and admin only for transfers/archives. CSV import is JSON `{csv: "..."}`, not multipart.
- Institution/bureau directories and officer endpoints populate form controls. Alerts support read/resolved toggles; a resolved alert can legitimately reappear later as a new alert when its condition recurs.
- Report `from`/`to` must be full ISO timestamps with `Z`. Send end-of-day as `T23:59:59.999Z` for an inclusive day.

**Pritika (dashboard, investigation, coordination, graph):**

- The dashboard uses real scoped aggregates. Detail/timeline/action-history endpoints supply the investigation workspace. All seven intelligence contracts are unchanged.
- Coordination workspace endpoints are separate from POST /coordination, which still records a decision only. From a complaint page, call `GET /coordination/workspaces?complaintId=<id>`; from a link, filter by `caseLinkId`. Keep `version`, send typed commands, and reload after 409 STALE_COORDINATION.
- Render responsibility history from `/coordination/workspaces/:id/history`; a null ID with a `*Restricted` flag is another bureau's person or action and is not a navigation target.
- `apps/web/src/shared/api/client.ts` uses a 10 s Axios timeout while the API allows the AI service 30 s (`AI_TIMEOUT_MS`). Give `POST /intelligence/analyze/:caseId` a longer per-request timeout, or a slow first model load will look like a failure in the UI.

## Remaining restrictions and follow-ups

Intentional, documented restrictions:

- Transfer is blocked by any workspace (an explicit reassignment policy is needed first).
- Institution correction is blocked by active links/workspaces.
- ADMIN-only transfer/archive, with no unarchive.
- Workspace assignment/tracking is still allowed after COMPLETED.
- Alert read/resolve state is bureau-shared.
- `(sourceBureauId, originalId)` prevents a bureau from reusing a reference it transferred away.
- No evidence storage or legal sharing mechanism.

For Joel (Action Firewall/coordination owner), found during the audit and not changed:

1. There is no action status-update endpoint, so actions on transferred, disposed or archived complaints stay PLANNED/IN_PROGRESS forever. They keep counting in firewall overlap checks and in `activeActions`.
2. After a transfer, earlier actions are invisible to both bureaus, because action history is scoped by complaint bureau and action bureau together.
3. A head can replace the other bureau's workspace coordinator with their own officer.
4. COORDINATION_RECORDED is audited on only one of the two complaints, so the other bureau's timeline does not show the decision.

Deployment steps still required: provision managed PostgreSQL and run `db:deploy`; set the production variables in the table above; create the Render cron job; deploy the AI service privately with the shared token and a provisioned model cache; and run the GitHub Actions database job once the branch is pushed.

## Verification — 28 October 2026

Environment: macOS, Node 26.12.0 (repo targets 24; engine `>=22.12`), npm 11.20.0, Python 3.12.15, PostgreSQL 16.15 in a throwaway Docker container, MiniLM `all-MiniLM-L6-v2@1110a243…` from the local cache.

Reproduce with a disposable database (never point this at a development or production URL):

```sh
docker run -d --rm --name casebridge-test-pg -e POSTGRES_USER=casebridge \
  -e POSTGRES_DB=casebridge_test -e POSTGRES_HOST_AUTH_METHOD=trust \
  -p 127.0.0.1:55432:5432 postgres:16
export CASEBRIDGE_TEST_DATABASE_URL=postgresql://casebridge@127.0.0.1:55432/casebridge_test
DATABASE_URL="$CASEBRIDGE_TEST_DATABASE_URL" npm run db:deploy
DATABASE_URL="$CASEBRIDGE_TEST_DATABASE_URL" npm run db:seed
npm run test -w @setu/api -- src/modules/complaints/core.integration.test.ts src/modules/matching/intelligence.integration.test.ts
# Model-dependent cases: start uvicorn with EMBEDDING_MODE=transformer and a shared AI_SERVICE_TOKEN, then
CASEBRIDGE_TEST_AI=1 AI_SERVICE_URL=http://127.0.0.1:8000 AI_SERVICE_TOKEN=... npm test
docker stop casebridge-test-pg   # --rm deletes it
```

Tests create randomly prefixed records and delete only their own. They read only `CASEBRIDGE_TEST_DATABASE_URL`, never the development `DATABASE_URL`.

Results:

| Check                                                                                                                                                                                         | Result                                                                                                                                                                                                                                                                                                                                  |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fresh `migrate deploy` (all 3 migrations), `migrate status`, `migrate diff` against `schema.prisma`                                                                                           | Passed; empty diff                                                                                                                                                                                                                                                                                                                      |
| Upgrade: database at `20261026000100_initial` with representative rows (bureaus, users, 4 complaints incl. DISPOSED/TRANSFERRED/ESCALATED, actions, confirmed link, decision, alerts, audits) | Passed. Row counts unchanged; `sourceBureauId = bureauId` for every row; `version = 0`; old DISPOSED `resolvedAt` stays null; all FKs, CHECKs, unique indexes and new enum values present; duplicate `(bureauId, originalId)`, `(sourceBureauId, originalId)`, workspace-per-link, dedupeKey and negative versions rejected; empty diff |
| Seed run twice on a fresh database                                                                                                                                                            | Passed. Identical counts (2 bureaus, 10 institutions, 125 complaints, 4 actions, 1 link, 1 alert, 100 audits, 5 users) and identical password-hash digest; credentials file written once (0600), not rewritten; Git-ignored                                                                                                             |
| Seed conflict and credential merge                                                                                                                                                            | Passed. A conflicting row names `Complaint_bureauId_originalId_key` and rolls back (125 complaints unchanged); a partial reseed keeps all 5 credential entries                                                                                                                                                                          |
| Demo logins against the running API                                                                                                                                                           | All 5 accounts: login 200, `/auth/me` correct role/bureau with no hash, logout 200, replayed cookie 401                                                                                                                                                                                                                                 |
| Default `npm test` (no database)                                                                                                                                                              | 54 passed, 25 skipped (DB/AI opt-in)                                                                                                                                                                                                                                                                                                    |
| `npm test` with PostgreSQL + `CASEBRIDGE_TEST_AI=1` + live FastAPI/MiniLM                                                                                                                     | **79 passed, 0 skipped**                                                                                                                                                                                                                                                                                                                |
| Python `RUN_MODEL_TESTS=1 pytest` (real MiniLM)                                                                                                                                               | 12 passed                                                                                                                                                                                                                                                                                                                               |
| lint, typecheck, build, db:validate, format:check                                                                                                                                             | Passed                                                                                                                                                                                                                                                                                                                                  |

Joel's original 9 operational + 9 intelligence DB tests passed unmodified on their first real run (16 passed + 2 AI cases that passed once the model was enabled). The regression tests for the alert-recurrence and lock-timeout fixes were confirmed to fail against the original code. The GitHub Actions database job has not run remotely; nothing has been pushed.
