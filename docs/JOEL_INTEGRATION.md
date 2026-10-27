# Joel's intelligence modules — implementation and integration

Implemented on the existing `joel` branch. No schema/migration, authentication implementation, complaint workflow or frontend was rewritten. No commit, branch switch or push was performed.

## Implemented endpoints

All seven use the existing authentication middleware, role checks, JSON envelope, trusted-Origin requirement and Zod validation. They require a configured PostgreSQL database and an active authenticated user. Login remains Vishwak's unimplemented dependency; no development auth bypass was added.

| Endpoint                                   | Implemented behavior                                                                                                                                           |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| POST /api/intelligence/analyze/:caseId     | Authorize source, retrieve bounded same-institution candidates, call authenticated MiniLM service, rank/explain and transactionally persist suggestions/audit. |
| GET /api/intelligence/links/:caseId        | Paginated authorized relationships, redacted counterpart identifiers/explanations, update timestamp for review.                                                |
| POST /api/intelligence/links/:id/review    | Bureau-head/admin review, optimistic concurrency, reviewer/time/reason, overlap-review state and audit.                                                        |
| GET /api/intelligence/graph/:institutionId | Scoped institution/complaint/bureau/action graph; suggested and confirmed edges, no dangling or private nodes.                                                 |
| POST /api/actions/preview                  | Rule-based active-action overlap warnings with severity, reasons and coordination recommendation. No writes.                                                   |
| POST /api/actions                          | Transactional server-side recheck; explicit reasoned overrides; action and audit commit atomically.                                                            |
| POST /api/coordination                     | Authorized, attributable decisions against confirmed relationships (KEEP_SEPARATE also allowed before confirmation).                                           |

## Contract clarifications and additive fields

These clarify/extend Joel's existing contracts without renaming endpoints, changing the success envelope or granting extra bureau access:

- Analysis adds `candidatesEvaluated` and `truncated`. Default maximum is 100 newest candidate complaints per institution. A truncated result is incomplete, not an exhaustive search.
- Explanations contain feature contributions, thresholds, period/category gates, `ruleVersion` and `scoreKind=HEURISTIC_RANKING_NOT_PROBABILITY`. No confidence percentages. Only descriptions are sent to the private AI service; no account data or raw institution identifiers are included in model inputs (candidate IDs are opaque correlation identifiers).
- Link responses add `updatedAt` and `reviewedAt`. Preserve `updatedAt` exactly for `expectedUpdatedAt`. A 409 STALE_REVIEW requires reload. Human CONFIRMED/REJECTED decisions are never overwritten by analysis.
- Evidence requests require a nonempty `evidenceScope` (max 200). Prefer a stable resource + period, e.g. `admission-fees:2026-Q3`. Other action types may supply a scope. Descriptions/summaries are not a substitute for a canonical evidence identifier.
- Preview adds `requiresOverride`, `ruleVersion`; warnings add `severity`, `reasons`, `recommendation`, `relatedBureauCode`, `relatedComplaintId` and `restricted`. Private action/case IDs remain null. Admins and owning-bureau users see permitted identifiers; other users see the bureau and a generic overlap explanation only.
- Warning codes: POSSIBLE_DUPLICATE (HIGH), PARALLEL_INVESTIGATION (MEDIUM), POSSIBLE_CONFLICT (MEDIUM), POSSIBLE_OVERLAP (LOW). Severity is operational review priority, not a legal finding.
- Actions return 409 REVIEW_REQUIRED with a safe preview in `error.details` if warnings exist without a reason. A supplied overrideReason is an explicit officer instruction to proceed despite the warnings evaluated at submission time; never auto-fill it. Even reasoned overrides are rechecked and audited.
- Additional errors: 409 CASE_CHANGED when an analyzed/linked institution snapshot changes; 413 GRAPH_TOO_LARGE at graph limits; 503 DEPENDENCY_UNAVAILABLE for bounded lock/transaction failures or oversized action scans. Common authentication/database error handling remains the shared middleware's responsibility.
- Graph nodes add `metadata`. IDs are namespaced (`complaint:<encoded record ID>`) to avoid collisions between entity types; `metadata.recordId` is the original database ID. RELATED_TO edges carry `metadata.status` (SUGGESTED/CONFIRMED), score and recommendationOnly. Rejected relationships are omitted. Limits: 500 complaints, 1000 actions, 2000 links; oversized graphs fail explicitly rather than silently dropping edges.

## Matching model and evaluation

FastAPI POST `/v1/similarities` accepts `{ "pairs": [{ "id": "candidate-id", "left": "source text", "right": "candidate text" }] }`, authenticated by `Authorization: Bearer <AI_SERVICE_TOKEN>`. It returns success, data with `id`/`cosineSimilarity`, modelVersion, mode and recommendationOnly. Pydantic rejects extra keys, blank text, duplicate IDs and oversized batches. Validation is 422, bad credentials 401, unavailable/unconfigured/busy service 503, body over 1 MB 413. Health is public liveness only.

The encoder loads once lazily per worker on CPU, batches unique texts, and retains up to 256 vectors indexed by text hashes. Model downloads are explicit; fixture mode is never an automatic fallback and the Express client rejects fixture results. One inference runs per process; additional requests receive AI_BUSY. Express has a total configurable analysis timeout, validates result IDs/ranges/model version, and saves nothing on AI failure.

Pinned model revision: `1110a243fdf4706b3f48f1d95db1a4f5529b4d41` of `sentence-transformers/all-MiniLM-L6-v2`. Model revision changes require restart and reevaluation. Standard MiniLM token truncation still applies to long descriptions; document chunking is not implemented.

Matching requires the same institution, excludes conflicting known categories and disjoint explicit years/quarters, and combines normalized semantic similarity (weight .60), institution identity (.15), category identity (.15) and lexical context overlap (.10). Default minimum semantic score is .40 and weighted ranking threshold .55. Unknown categories contribute no category weight. The engine is conservative about known category differences; miscoded complaints may be missed.

Actual measured development results are in `apps/api/src/modules/matching/evaluation-results.json`. The seven supplied pairs contain four positives and three negatives, with repeated fee paraphrases. Initial thresholds .66/.55 gave TP=0, FP=0, FN=4, TN=3. Defaults were adjusted after inspecting these development pairs: TP=4, FP=0, FN=0, TN=3; precision=1.0, recall=1.0, F1=1.0. No false positives occurred among the three supplied negative pairs. **These are in-sample smoke-test metrics, not held-out accuracy, generalization evidence, calibrated probabilities or judge-ready production claims.** Expand labels with same-category different issues, negation, miscoding, chronology and multilingual cases before choosing production thresholds.

Reproduce using the actual encoder and the same TypeScript scoring function:

```sh
cd apps/ai
ALLOW_MODEL_DOWNLOAD=true .venv/bin/python evaluate_embeddings.py
cd ../..
npx tsx apps/api/src/modules/matching/evaluate.ts
```

The JSON evaluation output from Python is ignored; the small measured report is included source material. No complaint text is used to look up a hardcoded expected answer.

## Action Firewall concurrency and audit contract

All institution-scoped intelligence writes use a transaction-level PostgreSQL advisory lock keyed by a namespaced institution identifier. Action creation takes this lock, then reloads/authorizes the complaint, holds a complaint row lock, retrieves current active actions, runs rules, and writes the action/audit in one READ COMMITTED transaction. The query after a waited lock sees the prior submitter's committed action. Therefore two submissions without override reasons cannot both pass the same duplicate check when all writers follow this protocol.

No network/model call happens while holding this lock. Lock wait is bounded at 5 seconds; transaction execution is bounded at 15 seconds. Hash collisions cause extra serialization only. Action scans stop at 2000 and fail closed to human review when oversized; they do not silently ignore possible duplicates.

Denied attempts return from the transaction after writing ACTION_REVIEW_REQUIRED, then raise 409 outside it so the audit survives. Created actions and ACTION_CREATED/ACTION_OVERRIDE_CREATED audits commit together; failure to write the audit rolls back the action. Matching, reviews and coordination also write attributable audits.

**Vishwak dependency:** every future action creation/update/reopen or complaint-institution reassignment path must follow the same institution-lock protocol (lock both old/new institution keys in sorted order for reassignment). Direct SQL/alternate CRUD paths that bypass it are outside the guarantee. Production policies must forbid casual direct action inserts. The database does not currently enforce this application protocol by trigger.

Audit metadata contains `internalOverlapActionIds` to retain the basis of overrides. These identifiers can refer to private cross-bureau actions. Timeline/report/export endpoints must whitelist safe metadata and never return raw AuditLog.metadata to ordinary users. Current timeline is still a stub; no new history endpoint exposes these identifiers. A confirmed relationship/coordination decision never grants evidence access.

Rule comparison is deterministic: canonicalized evidence scope, explicit period separation, action type, active state, category and lexical overlap. It does not recognize all document aliases, action-law conflicts or semantic contradictions. Explicit scope IDs and officer judgment remain necessary. It never labels fraud, merges complaints, disposes cases or makes legal decisions.

## Vishwak's persistence handoff

No changes to existing Prisma schema/migrations are required for the seven implemented contracts. Apply the existing baseline migration and supply real authentication; getPrisma, requireAuth, requireRole and AuditLog are reused.

The task's broader coordination-workspace requirements exceed the current schema/API. `coordination/workspace.ts` implements a typed, independently tested domain service for assignment, action tracking, status, versions and attribution, but there is deliberately **no production adapter or HTTP endpoint claiming that state is persisted**.

Proposed minimal additions for Vishwak to review:

1. `CoordinationWorkspace`: id, unique caseLinkId relation, optional coordinatorId relation to User, status enum OPEN/IN_PROGRESS/COMPLETED, integer version default 0, createdById, createdAt/updatedAt. Involved bureaus and complaint IDs derive from the linked cases; do not duplicate mutable bureau membership unnecessarily.
2. `CoordinationSharedAction`: composite key (workspaceId, actionId), linkedById and createdAt, with restrictive foreign keys to workspace/action/user.
3. Implement `WorkspaceRepository.transaction` against Prisma. Check expected version atomically; persist audit in the same transaction. Validate linked actions belong to either linked complaint; only assign active officers from a participating bureau. A bureau head can assign only their own bureau's officer or track their own bureau's action; ADMIN may coordinate both.
4. Agree separately on workspace create/read/update endpoint contracts and safe sharing/consent policy. Do not overload `POST /api/coordination` with arbitrary unknown fields; it currently rejects them with 400.
5. Complete auth issuance/login, user provisioning and audit redaction. Optional real evidence attachment storage also needs an agreed schema; current supporting evidence consists of derived match features and officer rationale, not document uploads.

## Pritika's integration

Use existing credentialed Axios client. In real mode, login/session provisioning must come from Vishwak. Keep fixture UI separate and show explicit unavailable states for 401/403/503; never replace failed intelligence requests with mock success.

- Analyze: POST empty JSON to the complaint's analysis endpoint. Display suggested relationships, feature contributions and model/rule versions. Show an incomplete-results notice if truncated. Label score as a heuristic ranking, not confidence.
- Review: GET links, retain updatedAt, then POST status/reason/expectedUpdatedAt. Only heads/admins get controls; backend still enforces roles. Reload on 409. For restricted counterparts show bureau + restricted label, never construct a details URL from null.
- Actions: POST preview before submission, render severity/reasons/recommendation. If officer chooses to proceed despite warnings, require their own reason. On final POST, handle a new REVIEW_REQUIRED because another bureau may have submitted since preview. Do not auto-retry mutating requests or auto-populate overrideReason.
- Graph: map server nodes to React Flow `{id, position, data:{label, ...metadata, entityType:type}}`; supply client layout positions and node renderers. Map server edges to `{id,source,target,type:'smoothstep',data:{relationship:type,...metadata}}`; server relationship type is not a built-in React Flow edge renderer. Style SUGGESTED differently from CONFIRMED. Use metadata.recordId for API navigation.
- Coordination: current endpoint records type/rationale against a link; assignment/status UI must wait for Vishwak's workspace adapter and the agreed additional API contract.

## Configuration and run commands

Generate a secret using `openssl rand -hex 32`; set the **same** AI_SERVICE_TOKEN in `apps/api/.env` and `apps/ai/.env`. Do not share it with the browser. Also configure DATABASE_URL and JWT_SECRET in the API environment. Set EMBEDDING_MODE=transformer in AI .env; older foundation .env files may still say fixture. Do not overwrite existing environment files blindly.

Optional API configuration: AI_TIMEOUT_MS=30000 (total analysis budget), MATCH_THRESHOLD=0.55, MATCH_SEMANTIC_THRESHOLD=0.40, MATCH_CANDIDATE_LIMIT=100. These belong only to the API service. Keep the AI service private behind its service token and network controls.

```sh
# Repository root
npm install
npm run db:deploy
npm run dev -w @casebridge/api
```

```sh
cd apps/ai
# Existing .venv is already installed locally; create one with Python 3.12 on a fresh clone.
.venv/bin/pip install -r requirements.txt
ALLOW_MODEL_DOWNLOAD=true .venv/bin/python -c 'from app.embeddings import get_model; get_model()'
EMBEDDING_MODE=transformer .venv/bin/uvicorn app.main:app --port 8000
```

Health works without model inference or PostgreSQL readiness. The local model cache is ignored and will need provisioning on another developer machine/deployment. Current APIs do not issue credentials; no fabricated completed login functionality was added.

## Tests and outstanding verification

```sh
npm run lint
npm run typecheck
npm run build
npm test
cd apps/ai
RUN_MODEL_TESTS=1 .venv/bin/python -m pytest
```

Opt-in HTTP integration (start AI with the same token; commands run from repository root):

```sh
CASEBRIDGE_TEST_AI=1 npm run test -w @casebridge/api -- src/modules/matching/ai.integration.test.ts
```

For a **disposable PostgreSQL test database**, set CASEBRIDGE_TEST_DATABASE_URL in your terminal. It is never inferred from the development DATABASE_URL. Apply migrations to that test URL, then run:

```sh
DATABASE_URL="$CASEBRIDGE_TEST_DATABASE_URL" npm run db:deploy
CASEBRIDGE_TEST_AI=1 npm run test -w @casebridge/api -- src/modules/matching/intelligence.integration.test.ts
```

The database suite creates records with a unique test prefix and cleans up only those records. It covers real concurrent submissions across bureaus, stale previews, audits/rollback, review concurrency, permissions, coordination, graph visibility and optional real AI analysis. Without CASEBRIDGE_TEST_DATABASE_URL its nine tests are explicitly skipped. Without CASEBRIDGE_TEST_AI the separate HTTP test and two model-dependent database cases are skipped.

A temporary PostgreSQL binary was attempted outside the product dependencies, but this execution sandbox denied PostgreSQL's shared-memory allocation (`shmget`). Therefore the real PostgreSQL suite is **not locally verified**. Transaction test doubles test service interleaving and rollback expectations, not PostgreSQL semantics. Run the database suite before calling this production integrated. No PostgreSQL/schema changes are represented as completed by tests that did not run.

Implementation references: [PostgreSQL transaction-level advisory locks](https://www.postgresql.org/docs/17/explicit-locking.html#ADVISORY-LOCKS), [Prisma 7 transactions](https://docs.prisma.io/docs/orm/v7/prisma-client/queries/transactions), [Sentence Transformer encoding API](https://www.sbert.net/docs/package_reference/sentence_transformer/model.html).

## Final local verification (27 October 2026)

- Lint, TypeScript checks, web/API builds, Prisma schema validation, formatting and diff whitespace checks passed.
- Default backend suite: 36 passed, 10 explicitly skipped. The separately enabled real FastAPI HTTP test passed; nine PostgreSQL cases remain locally unverified.
- Python suite with RUN_MODEL_TESTS=1: 12 passed, including the real cached MiniLM encoder.
- CI now runs the PostgreSQL suite against its disposable service (seven database cases; two additional AI-dependent cases require a running AI service). This CI change has not been executed remotely.
- Production TypeScript build excludes colocated test files. Formatter ignores downloaded model cache and local evaluation output.
- Branch remains joel; no commit, push, branch change or Prisma schema change was performed.
