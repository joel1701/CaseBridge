# Initial API contract (v1)

**Implementation status:** Authentication, operational complaints/institutions/bureaus/alerts/reports/timelines, persistent coordination workspaces and the seven intelligence APIs are implemented. See [core backend integration](CORE_BACKEND_INTEGRATION.md) for authorization, migration, role mapping, setup and verification limits. Existing intelligence contracts are preserved.

Base URL http://localhost:3001. JSON uses camelCase, opaque string IDs and UTC ISO 8601 timestamps. Reject unknown input fields. IDs are nonempty, max 128 characters. No request can choose its creator or elevate its role. Zod validation precedes business logic.

All successful business responses wrap the displayed data in `{ "success": true, "data": ... }`. Lists add top-level `meta: { "page": 1, "pageSize": 20, "total": 25 }`. These example counts are illustrative. Default success HTTP status is 200; creation endpoints explicitly use 201. No pagination for bounded graph responses in this initial contract; enforce graph size limits during implementation.

Errors use `{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Request validation failed", "details": [{"path":["title"],"message":"Required"}] } }`; details is optional and must never echo passwords/tokens. Common errors for protected routes: 401 UNAUTHENTICATED, 403 FORBIDDEN (role), 404 NOT_FOUND (missing or inaccessible resource), 500 INTERNAL_ERROR. Invalid inputs: 400 VALIDATION_ERROR. Invalid JSON: 400 INVALID_JSON; over 1 MB: 413 PAYLOAD_TOO_LARGE. Missing database configuration: 503 DATABASE_NOT_CONFIGURED. Auth helper without configured secret: 503 AUTH_NOT_CONFIGURED. All mutating requests require exact configured Origin or return 403 UNTRUSTED_ORIGIN. CORS uses credentials and a single configured frontend origin.

All authenticated reads/writes are bureau-scoped except ADMIN's explicitly authorized global scope. Cross-bureau matching does not reveal private details. Empty lists are 200 with items=[]; identifiers outside scope are 404. Passwords/tokens/hashes are never in response data. FRONTEND_URL is the browser origin; no wildcard with cookies.

## GET /api/health — implemented

Public; no parameters/body. Always process-liveness only, no DB/AI dependency. HTTP 200:

```json
{ "success": true, "message": "CaseBridge API is running" }
```

Owner: Vishwak. AI GET /health is a separate public liveness endpoint and adds the active embedding mode.

## POST `/api/auth/login`

Authenticate an active account.

- **Owner:** Vishwak
- **Required role:** Public
- **Parameters:** None
- **Endpoint errors:** 400 VALIDATION_ERROR; 401 INVALID_CREDENTIALS; 429 RATE_LIMITED; common errors above also apply.

**Request body:**

```json
{
  "email": "officer@example.invalid",
  "password": "<user supplied>"
}
```

**Expected response JSON:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "u1",
      "displayName": "Demo officer",
      "role": "OFFICER",
      "bureauId": "PGRC"
    }
  }
}
```

Set casebridge_session HttpOnly cookie; never return token/hash. Normalize email. Database-backed login throttling is implemented (10/account and 60/IP per 15 minutes).

## GET `/api/auth/me`

Read current active account.

- **Owner:** Vishwak
- **Required role:** Any authenticated role
- **Parameters:** None
- **Endpoint errors:** 401 UNAUTHENTICATED; common errors above also apply.

**Request body:**

None.

**Expected response JSON:**

```json
{
  "success": true,
  "data": {
    "id": "u1",
    "displayName": "Demo officer",
    "role": "OFFICER",
    "bureauId": "PGRC"
  }
}
```

Reload active account; omit private credential fields.

## POST `/api/auth/logout`

Expire the session cookie.

- **Owner:** Vishwak
- **Required role:** Public; valid Origin required
- **Parameters:** None
- **Endpoint errors:** 403 UNTRUSTED_ORIGIN; common errors above also apply.

**Request body:**

```json
{}
```

**Expected response JSON:**

```json
{
  "success": true,
  "data": {
    "loggedOut": true
  }
}
```

Idempotent. Clear the same path/sameSite/secure cookie; the current database session is revoked.

## GET `/api/complaints`

List authorized complaints.

- **Owner:** Vishwak
- **Required role:** OFFICER, BUREAU_HEAD, ADMIN
- **Parameters:** Query page=1, pageSize=20 (1..100), status?, institutionId?, category?, q? (max 200). ADMIN may set bureauId; other users cannot broaden their scope.
- **Endpoint errors:** 400 VALIDATION_ERROR; common errors above also apply.

**Request body:**

None.

**Expected response JSON:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "cmp-001",
        "originalId": "PGRC-DEMO-001",
        "institutionId": "inst-01",
        "bureauId": "PGRC",
        "title": "Unapproved admission fees",
        "category": "FEES",
        "status": "RECEIVED",
        "overlapReviewStatus": "PENDING",
        "createdAt": "2026-10-01T09:00:00Z"
      }
    ]
  }
}
```

Envelope includes meta: {page:1,pageSize:20,total:25}. List omits full descriptions.

## POST `/api/complaints`

Create a complaint in an authorized bureau.

- **Owner:** Vishwak
- **Required role:** OFFICER, BUREAU_HEAD, ADMIN
- **Parameters:** None
- **Endpoint errors:** 400 VALIDATION_ERROR; 404 NOT_FOUND; 409 DUPLICATE_REFERENCE; common errors above also apply.

**Request body:**

```json
{
  "originalId": "PGRC-DEMO-026",
  "institutionId": "inst-01",
  "title": "Fee concern",
  "description": "Synthetic complaint description",
  "category": "FEES",
  "bureauId": "PGRC"
}
```

**Expected response JSON:**

```json
{
  "success": true,
  "data": {
    "id": "cmp-new",
    "originalId": "PGRC-DEMO-026",
    "institutionId": "inst-01",
    "bureauId": "PGRC",
    "title": "Fee concern",
    "description": "Synthetic complaint description",
    "category": "FEES",
    "status": "RECEIVED",
    "overlapReviewStatus": "NOT_REVIEWED",
    "createdAt": "2026-10-26T09:00:00Z"
  }
}
```

201. Bureau must equal principal bureau unless ADMIN. OriginalId max 100, title 200, description 10000, category 64; all nonempty. Initial status is server-controlled.

## GET `/api/complaints/:id`

Read authorized complaint details.

- **Owner:** Vishwak
- **Required role:** OFFICER, BUREAU_HEAD, ADMIN
- **Parameters:** Path id: opaque complaint ID
- **Endpoint errors:** 404 NOT_FOUND; common errors above also apply.

**Request body:**

None.

**Expected response JSON:**

```json
{
  "success": true,
  "data": {
    "id": "cmp-001",
    "originalId": "PGRC-DEMO-001",
    "institutionId": "inst-01",
    "bureauId": "PGRC",
    "title": "Unapproved admission fees",
    "description": "Students report unauthorised collection of admission fees.",
    "category": "FEES",
    "status": "RECEIVED",
    "overlapReviewStatus": "PENDING",
    "dueAt": null,
    "createdAt": "2026-10-01T09:00:00Z",
    "updatedAt": "2026-10-01T09:00:00Z"
  }
}
```

Return 404 for inaccessible records as well as missing IDs.

## POST `/api/complaints/import`

Import normalized complaint rows.

- **Owner:** Vishwak
- **Required role:** BUREAU_HEAD, ADMIN
- **Parameters:** None
- **Endpoint errors:** 400 VALIDATION_ERROR; 409 DUPLICATE_REFERENCE; 413 PAYLOAD_TOO_LARGE; common errors above also apply.

**Request body:**

```json
{
  "items": [
    {
      "originalId": "PGRC-DEMO-026",
      "institutionId": "inst-01",
      "bureauId": "PGRC",
      "title": "Fee concern",
      "description": "Synthetic complaint description",
      "category": "FEES"
    }
  ]
}
```

**Expected response JSON:**

```json
{
  "success": true,
  "data": {
    "createdIds": ["cmp-new"],
    "count": 1
  }
}
```

201. JSON only, 1..100 items, same validation as create; atomic all-or-nothing. Use the separate JSON CSV adapter described below; multipart uploads are not supported.

## GET `/api/complaints/:id/timeline`

Read authorized append-only complaint history.

- **Owner:** Vishwak
- **Required role:** OFFICER, BUREAU_HEAD, ADMIN
- **Parameters:** Path id; query page=1, pageSize=20 (1..100)
- **Endpoint errors:** 404 NOT_FOUND; common errors above also apply.

**Request body:**

None.

**Expected response JSON:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "audit-1",
        "event": "COMPLAINT_CREATED",
        "actorId": "u1",
        "createdAt": "2026-10-01T09:00:00Z",
        "metadata": {}
      }
    ]
  }
}
```

Paginated meta; whitelist metadata and redact private cross-bureau details.

## GET `/api/institutions/:id`

Read institution profile and scoped complaint count.

- **Owner:** Vishwak
- **Required role:** OFFICER, BUREAU_HEAD, ADMIN
- **Parameters:** Path id
- **Endpoint errors:** 404 NOT_FOUND; common errors above also apply.

**Request body:**

None.

**Expected response JSON:**

```json
{
  "success": true,
  "data": {
    "id": "inst-01",
    "permanentId": "SYN-AICTE-1-900000001",
    "name": "Aaravika Institute of Engineering (Fictional)",
    "state": "Kerala",
    "authorizedComplaintCount": 3
  }
}
```

Counts and any future nested complaints must use the requester scope.

## GET `/api/dashboard/summary`

Dashboard counts within requester scope.

- **Owner:** Vishwak
- **Required role:** OFFICER, BUREAU_HEAD, ADMIN
- **Parameters:** None
- **Endpoint errors:** 400 VALIDATION_ERROR; common errors above also apply.

**Request body:**

None.

**Expected response JSON:**

```json
{
  "success": true,
  "data": {
    "totalComplaints": 25,
    "pendingOverlapReviews": 6,
    "activeActions": 4,
    "scope": "AUTHORIZED"
  }
}
```

Counts never include private out-of-scope records. Mock data has scope SYNTHETIC.

## GET `/api/reports/summary`

Aggregate operational report.

- **Owner:** Vishwak
- **Required role:** OFFICER, BUREAU_HEAD, ADMIN
- **Parameters:** Query from?, to?: inclusive ISO UTC timestamps; from <= to; both omitted means all time
- **Endpoint errors:** 400 VALIDATION_ERROR; common errors above also apply.

**Request body:**

None.

**Expected response JSON:**

```json
{
  "success": true,
  "data": {
    "byStatus": {
      "RECEIVED": 10,
      "UNDER_PROCESS": 5,
      "TRANSFERRED": 5,
      "ESCALATED": 5,
      "DISPOSED": 0
    },
    "overdueCount": 2
  }
}
```

All aggregates bureau scoped. No public cross-bureau analytics.

## GET `/api/alerts`

List authorized bureau alerts.

- **Owner:** Vishwak
- **Required role:** OFFICER, BUREAU_HEAD, ADMIN
- **Parameters:** Query unreadOnly=false, page=1, pageSize=20 (1..100)
- **Endpoint errors:** 400 VALIDATION_ERROR; common errors above also apply.

**Request body:**

None.

**Expected response JSON:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "alert-demo-001",
        "type": "OVERLAP",
        "complaintId": "cmp-001",
        "message": "Overlap awaits review",
        "readAt": null,
        "createdAt": "2026-10-01T09:00:00Z"
      }
    ]
  }
}
```

Paginated meta. Do not leak other-bureau names/descriptions through alert text.

## POST `/api/intelligence/analyze/:caseId`

Request candidate analysis for an authorized complaint.

- **Owner:** Joel
- **Required role:** OFFICER, BUREAU_HEAD, ADMIN
- **Parameters:** Path caseId = Complaint.id
- **Endpoint errors:** 404 NOT_FOUND; 503 AI_UNAVAILABLE; common errors above also apply.

**Request body:**

```json
{}
```

**Expected response JSON:**

```json
{
  "success": true,
  "data": {
    "caseId": "cmp-001",
    "suggestions": [
      {
        "id": "link-demo-001",
        "status": "SUGGESTED",
        "score": 0.82,
        "explanation": {
          "institutionMatch": true,
          "categoryMatch": true,
          "semanticSimilarity": 0.82,
          "reasons": ["Same institution", "Fee allegations"]
        },
        "modelVersion": "all-MiniLM-L6-v2:evaluation-version"
      }
    ],
    "recommendationOnly": true
  }
}
```

Synchronous initial contract. Scores are illustrative, not tested model output. Candidate retrieval and returned evidence require separate authorization/redaction.

## GET `/api/intelligence/links/:caseId`

Read permitted relationship summaries.

- **Owner:** Joel
- **Required role:** OFFICER, BUREAU_HEAD, ADMIN
- **Parameters:** Path caseId; page=1, pageSize=20 (1..100)
- **Endpoint errors:** 404 NOT_FOUND; common errors above also apply.

**Request body:**

None.

**Expected response JSON:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "link-demo-001",
        "status": "SUGGESTED",
        "score": 0.82,
        "otherComplaint": {
          "id": null,
          "bureauCode": "RB",
          "restricted": true
        },
        "explanation": {
          "reasons": ["Potential related fee allegation"]
        }
      }
    ]
  }
}
```

Paginated meta. Only policy-permitted summary fields; inaccessible counterpart ID is null, never its full complaint.

## POST `/api/intelligence/links/:id/review`

Human confirmation/rejection of suggestion.

- **Owner:** Joel
- **Required role:** BUREAU_HEAD, ADMIN
- **Parameters:** Path id = CaseLink.id
- **Endpoint errors:** 400 VALIDATION_ERROR; 404 NOT_FOUND; 409 STALE_REVIEW; common errors above also apply.

**Request body:**

```json
{
  "status": "CONFIRMED",
  "reason": "Reviewed permitted evidence",
  "expectedUpdatedAt": "2026-10-01T09:00:00Z"
}
```

**Expected response JSON:**

```json
{
  "success": true,
  "data": {
    "id": "link-demo-001",
    "status": "CONFIRMED",
    "reviewedById": "u1",
    "reviewReason": "Reviewed permitted evidence",
    "reviewedAt": "2026-10-26T09:00:00Z",
    "updatedAt": "2026-10-26T09:00:00Z"
  }
}
```

Only CONFIRMED/REJECTED; reason 1..2000. Head must own one linked complaint and have permitted review evidence. Use optimistic concurrency; audit decision.

## GET `/api/intelligence/graph/:institutionId`

Return authorized graph nodes/edges.

- **Owner:** Joel
- **Required role:** OFFICER, BUREAU_HEAD, ADMIN
- **Parameters:** Path institutionId
- **Endpoint errors:** 404 NOT_FOUND; common errors above also apply.

**Request body:**

None.

**Expected response JSON:**

```json
{
  "success": true,
  "data": {
    "nodes": [
      {
        "id": "inst-01",
        "type": "institution",
        "label": "Fictional institution"
      },
      {
        "id": "cmp-001",
        "type": "complaint",
        "label": "PGRC-DEMO-001"
      }
    ],
    "edges": [
      {
        "id": "edge-1",
        "source": "inst-01",
        "target": "cmp-001",
        "type": "HAS_COMPLAINT"
      }
    ]
  }
}
```

Node types: institution, complaint, bureau, action. Edge types: HAS_COMPLAINT, OWNED_BY, HAS_ACTION, RELATED_TO. Return no edge to omitted private nodes; no coordinates required.

## POST `/api/actions/preview`

Check proposed action for overlaps/conflicts.

- **Owner:** Joel
- **Required role:** OFFICER, BUREAU_HEAD, ADMIN
- **Parameters:** None
- **Endpoint errors:** 400 VALIDATION_ERROR; 404 NOT_FOUND; 503 DEPENDENCY_UNAVAILABLE; common errors above also apply.

**Request body:**

```json
{
  "complaintId": "cmp-001",
  "type": "EVIDENCE_REQUEST",
  "summary": "Request fee ledger",
  "evidenceScope": "admission-fees:2026-Q3",
  "dueAt": "2026-11-05T12:00:00Z"
}
```

**Expected response JSON:**

```json
{
  "success": true,
  "data": {
    "warnings": [
      {
        "code": "POSSIBLE_DUPLICATE",
        "message": "Similar evidence request exists",
        "relatedActionId": null
      }
    ],
    "recommendation": "Coordinate before sending",
    "recommendationOnly": true
  }
}
```

Read-only preview; redact relatedActionId when private. Types from schema; summary 1..2000, evidenceScope max 200. No authorization token or permanent approval is produced.

## POST `/api/actions`

Create action after current-state recheck.

- **Owner:** Joel
- **Required role:** OFFICER, BUREAU_HEAD, ADMIN
- **Parameters:** None
- **Endpoint errors:** 400 VALIDATION_ERROR; 404 NOT_FOUND; 409 REVIEW_REQUIRED; 503 DEPENDENCY_UNAVAILABLE; common errors above also apply.

**Request body:**

```json
{
  "complaintId": "cmp-001",
  "type": "EVIDENCE_REQUEST",
  "summary": "Request fee ledger",
  "evidenceScope": "admission-fees:2026-Q3",
  "dueAt": "2026-11-05T12:00:00Z",
  "overrideReason": "Authorized officer reviewed overlap and documented separate scope"
}
```

**Expected response JSON:**

```json
{
  "success": true,
  "data": {
    "id": "act-new",
    "complaintId": "cmp-001",
    "bureauId": "PGRC",
    "createdById": "u1",
    "type": "EVIDENCE_REQUEST",
    "status": "PLANNED",
    "createdAt": "2026-10-26T09:00:00Z"
  }
}
```

201. Derive bureau and creator server-side. Recheck conflicts transactionally and require rationale (1..2000) when proceeding despite warning. This is an officer decision, not an automatic legal determination.

## POST `/api/coordination`

Record human coordination decision on a link.

- **Owner:** Joel
- **Required role:** BUREAU_HEAD, ADMIN
- **Parameters:** None
- **Endpoint errors:** 400 VALIDATION_ERROR; 404 NOT_FOUND; 409 INVALID_STATE; common errors above also apply.

**Request body:**

```json
{
  "caseLinkId": "link-demo-001",
  "type": "SHARE_EVIDENCE",
  "rationale": "Coordinate a single evidence request"
}
```

**Expected response JSON:**

```json
{
  "success": true,
  "data": {
    "id": "decision-new",
    "caseLinkId": "link-demo-001",
    "type": "SHARE_EVIDENCE",
    "rationale": "Coordinate a single evidence request",
    "decidedById": "u1",
    "createdAt": "2026-10-26T09:00:00Z"
  }
}
```

201. Head must own a linked complaint; use enum CoordinationType; rationale 1..2000. Requires confirmed link except KEEP_SEPARATE. Recording a decision does not itself grant private evidence access.

## Operational additions — implemented

All endpoints below use the existing success/error envelopes, require authentication, reject unknown body/query keys and require trusted Origin on mutations. List responses use data.items and top-level meta. Dates are UTC ISO timestamps. Existing role values remain OFFICER/BUREAU_HEAD/ADMIN. See CORE_BACKEND_INTEGRATION.md for full workflow rules.

### Complaint additions

- `GET /api/complaints`: adds assignedToId, sortBy (createdAt/updatedAt/dueAt/title), sortOrder (asc/desc), archived (true/false, default false). q searches title/originalId/description case-insensitively. Cross-bureau filters from ordinary users return 403. List/detail responses add sourceBureauId, assignedToId, version, archivedAt; details also have createdById/resolvedAt.
- `POST /api/complaints`: optionally accepts dueAt (ISO or null). Initial version=0; creator/source bureau derived server-side.
- `POST /api/complaints/import/csv`: BUREAU_HEAD/ADMIN, body `{ "csv": "originalId,institutionId,bureauId,title,description,category\n..." }`. Required unique header names are the six shown; optional dueAt. Quoted commas/newlines/escaped quotes are supported. Empty dueAt means null. Same 1–100-row atomic import result as JSON import; 400 invalid CSV/rows, 409 duplicate reference.
- `PATCH /api/complaints/:id`: body `{ "expectedVersion": 0, "reason": "Officer reviewed the record", "status": "UNDER_PROCESS" }`. Optional editable fields: title, description, category, dueAt, institutionId, assignedToId (ID/null), status, bureauId. At least one change required. OriginalId/sourceBureauId/creator cannot change. Returns updated complaint. Assignment/institution correction/disposal require BUREAU_HEAD/ADMIN; bureau transfer requires ADMIN and cannot include status. 409 STALE_COMPLAINT, INVALID_STATE, RELATIONSHIP_DEPENDENCY or COORDINATION_DEPENDENCY; 404 unknown/inaccessible references; 403 unauthorized workflow.
- `DELETE /api/complaints/:id`: ADMIN-only archive, body `{ "expectedVersion": 3, "reason": "Archive disposed record" }`. Only DISPOSED may archive. Returns updated retained record, never hard-deletes.
- `GET /api/complaints/:id/actions`: paginated (page/pageSize) action history, scoped by both complaint and initiating bureau; returns data.items. Creation remains exclusively POST /api/actions through the Firewall.

### Reference directories and queues

- `GET /api/institutions`: page/pageSize/q; q searches name/permanentId. Shared institutional reference records, no unscoped nested complaint data.
- `GET /api/institutions/:id`: adds region/location, byStatus/byBureau arrays of scoped groups and recentComplaints (latest 20 authorized summaries) to the existing profile/count.
- `GET /api/bureaus`: data.items of id/code/name only; no private queue totals.
- `GET /api/bureaus/:id/officers`: page/pageSize; own bureau or ADMIN; data.items with id/displayName/role/bureauId for active users, never email/hash.
- `GET /api/bureaus/:id/queue`: complaint-list filters/pagination, with path bureau forced and authorization enforced.

### Alerts

GET /api/alerts adds `resolved=false|true|all` (default false), plus existing unreadOnly/page/pageSize. Items add resolvedAt/userId/dedupeKey. UserId identifies the assigned recipient; read/resolved states are bureau-shared.

- `POST /api/alerts/refresh`: body `{}`, BUREAU_HEAD/ADMIN; refreshes authorized cases and returns `{ "processed": 25 }` (illustrative count).
- `PATCH /api/alerts/:id`: body `{ "read": true, "resolved": true }`, either field may be omitted; returns authorized updated alert. 404 for inaccessible alerts.

### Reporting additions

Dashboard and reports accept optional inclusive `from`/`to` creation timestamps. Existing fields are preserved. Both return totalComplaints, pendingComplaints, disposedComplaints, escalatedComplaints, overdueCount, pendingOverlapReviews, activeActions, byStatus, byBureau, byCategory, byInstitution, trends, averageResolutionHours and coordinationRequiredCount, with scope=AUTHORIZED. Group arrays use `{ "bureauId": "...", "_count": 3 }` (or category/institutionId), trends use `{ "month": "2026-10", "count": 3 }`. Counts here are examples. Resolution average is null where no valid measured duration exists. Archived cases remain in historical metrics.

### Coordination workspaces — separate from decision API

- `POST /api/coordination/workspaces`: BUREAU_HEAD/ADMIN, `{ "caseLinkId": "link-id" }`; 201 workspace. Confirmed relationship required; one workspace per link. Duplicate returns 409 DUPLICATE_REFERENCE.
- `GET /api/coordination/workspaces`: page/pageSize, optional caseLinkId; paginated authorized workspaces.
- `GET /api/coordination/workspaces/:id`: authorized workspace.
- `PATCH /api/coordination/workspaces/:id`: BUREAU_HEAD/ADMIN, `{ "expectedVersion": 0, "command": { "kind": "ASSIGN", "officerId": "user-id" } }`. Other commands: `{ "kind": "TRACK_ACTION", "actionId": "action-id" }` or `{ "kind": "SET_STATUS", "status": "OPEN|IN_PROGRESS|COMPLETED" }` (one literal status). Returns updated workspace. 409 STALE_COORDINATION/INVALID_STATE/CASE_CHANGED; 403 unauthorized assignment; 404 missing/inaccessible action/workspace.

Workspace response fields: id, caseLinkId, status, version, createdAt, updatedAt, coordinatorId (nullable), coordinatorRestricted, involvedBureauIds, complaintIds, sharedActionIds. Complaint/action arrays include only authorized identifiers. Coordinator from the other bureau is null with coordinatorRestricted=true. No private evidence is shared implicitly.
