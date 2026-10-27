# Database schema

PostgreSQL with Prisma 7. IDs are opaque strings (`cuid()` for new records); deterministic fixture IDs are not production identifier formats. All mutable entities have createdAt/updatedAt. AuditLog is append-only with createdAt only; never rewrite history.

| Table                | Relationships and constraints                                                                                                                        |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| User                 | Unique email; optional bureau for ADMIN; non-admins require a bureau in application policy. Hash only, active flag, role.                            |
| Bureau               | Unique code (RB/PGRC in fixtures); owns users, complaints, actions and alerts.                                                                       |
| Institution          | Unique permanentId; name and state. Name is not identity.                                                                                            |
| Complaint            | Required institution and bureau; unique (bureauId, originalId); separate lifecycle and overlap review; optional dueAt.                               |
| CaseLink             | Two required complaint references, unique canonical pair; optional score/model/reviewer and JSON explanation.                                        |
| InvestigationAction  | Complaint + bureau, optional creator for synthetic imports, action type/status/scope/due date and override reason. Real writes must provide creator. |
| CoordinationDecision | CaseLink + required deciding user, type and rationale.                                                                                               |
| Alert                | Owning bureau, optional complaint, type/message/readAt.                                                                                              |
| AuditLog             | Optional actor/complaint for system events, event and minimized JSON metadata.                                                                       |

Delete behavior is Restrict to preserve investigations. Prefer account deactivation and lifecycle changes. Foreign-key indexes support bureau/status queues, institution/category candidates, link directions, deadlines, history and unread alerts.

## Enums

- Role: ADMIN (explicit global oversight), BUREAU_HEAD (bureau review/coordination), OFFICER (bureau operations).
- ComplaintStatus: RECEIVED, UNDER_PROCESS, TRANSFERRED, ESCALATED, DISPOSED. TRANSFERRED records a lifecycle event; original bureau ownership is not overwritten by linking.
- OverlapReviewStatus: NOT_REVIEWED, PENDING, REVIEWED. REVIEWED does not imply a confirmed relationship; individual CaseLink decisions remain authoritative.
- CaseLinkStatus: SUGGESTED, CONFIRMED, REJECTED.
- ActionType: EVIDENCE_REQUEST, INSPECTION, NOTICE, REVIEW.
- ActionStatus: PLANNED, IN_PROGRESS, COMPLETED, CANCELLED.
- CoordinationType: SHARE_EVIDENCE, JOINT_INVESTIGATION, DEFER_ACTION, KEEP_SEPARATE.
- AlertType: OVERLAP, ACTION_CONFLICT, DEADLINE.

## Integrity policies

Canonical links store lexicographically smaller complaint ID first. The migration adds a check for this and score range [-1,1]. This forbids self-links and reversed duplicates. Link explanations are structured evidence, not arbitrary regulatory conclusions. Validate score finiteness in Zod too.

Services must enforce action.bureauId equals the complaint's owning bureau, alert bureau/complaint consistency, reviewer/decider authority, and valid state transitions inside transactions. These cross-table policies are not represented by simple Prisma foreign keys. Audit writes accompany state-changing transactions. Real action creation must have createdById; nullable actors exist only for system/import fixtures. User email normalization to lower case belongs at input validation.

Original IDs and bureau ownership are retained even when linked. The seed is additive/idempotent, does not delete data or overwrite existing rows, and is disabled in production. Demo accounts receive generated or explicitly configured passwords; existing account passwords are not changed on rerun.

Run migration then seed as in SETUP. No live database was provisioned by this repository setup.

## Operational extensions

See CORE_BACKEND_INTEGRATION.md, migration 20261027000100_operational_backend and migration 20261028000100_source_bureau_not_null (Complaint.sourceBureauId is required) for assignment/source bureau/version/lifecycle fields, AuthSession/LoginThrottle, alert resolution/deduplication, institution location and persistent coordination workspaces/shared actions. Existing delete restrictions remain; operational DELETE archives disposed complaints. Source-bureau/reference uniqueness preserves original identity through explicit administrator transfers.
