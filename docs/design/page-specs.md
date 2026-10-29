# Setu app page specs

Read with docs/SETU_DESIGN.md and docs/API_CONTRACT.md. Build every page with the shared page kit (src/components/page) and the data layer (src/shared/api), in the dashboard's style. Motion is calm.

**Deadline mode:** build everything marked CORE. Build EXTRA only if the CORE parts of your pages are done and committed. In mock mode, every page must show realistic synthetic data and the "Synthetic data" label.

The demo story every page must support: the dashboard shows the Aaravika overlap (PGRC + RB). The complaint details page shows its history and blocks a duplicate action. The investigation confirms the link and records coordination. The institution profile shows who is handling what.

---

## 1. Complaints list `/complaints` (owner in code: Kevin)

CORE
- PageHeader "complaints" with a "New complaint" button.
- FilterBar: search (title, case ID, description), status, category, sort. Bureau comes from the shell's bureau context. Understand the dashboard tile links: `?status=UNDER_PROCESS`, `?status=DISPOSED`, `?filter=pending`, `?filter=overdue`.
- DataTable: case ID (mono), title, institution, BureauTag, StatusPill, assigned officer, due date ("3 days overdue" in the alert colour only when overdue), and an overlap marker (icon with text) for cases in an overlap. Rows open `/complaints/:id`. Stacked list on mobile.

EXTRA
- Institution filter, assigned-officer filter.

## 2. New complaint `/complaints/new` (Kevin)

CORE
- One calm form: institution (searchable over GET /institutions, showing name and AICTE ID), original reference ID, title, description, category, optional due date. Inline validation matching the API limits. The bureau is shown read-only from the signed-in user.
- On submit: create, then POST /intelligence/analyze/:caseId and show the result:
  - overlap found: the dashboard's alert card ("potential overlapping cases", the other bureau's case, reasons, match confidence) with "Open investigation" and "View complaint"
  - none: a quiet confirmation with "View complaint" and "Add another"
- In mock mode, a new complaint about Aaravika (or any institution with open cases at another bureau) must produce an overlap.

## 3. Complaint details `/complaints/:id` (Kevin)

CORE
- DetailLayout. Header: case ID, title, StatusPill, BureauTag, institution link.
- Facts (Spec): received, category, assigned officer, current bureau, last action, next action required, due date and time left, expected disposal date, linked cases.
- Tabs:
  - History: GET /complaints/:id/timeline as a Timeline, newest first, with actor, bureau, time, remarks. Transfers and escalations stand out.
  - Actions: GET /complaints/:id/actions, plus "Propose action": type, summary, evidence scope, due date, then POST /actions/preview. If there are warnings (for example "Similar evidence request exists"), show them with the recommendation and require an override reason before POST /actions; if none, create directly. On Aaravika this must show the duplicate warning. This is the "avoid duplicate action" feature, so make it clear.
  - Overlaps: GET /intelligence/links/:caseId, each with reasons and confidence, linking to /investigations/:id.
- Change status (ReasonDialog, PATCH with expectedVersion, stale 409 handled).

EXTRA
- Reassign and transfer through ReasonDialog. Role-based hiding of controls.

## 4. Institution profile `/institutions/:id` (Kevin)

CORE
- Header: name (display font), AICTE permanent ID (mono), state, regional office, "View knowledge graph" link.
- If there's an open overlap: the dashboard's alert card at the top.
- "Who is handling what": one row per bureau with open cases (BureauTag, open, overdue, assigned officers, latest action).
- Complaint history across bureaus (DataTable on recentComplaints), newest first.

EXTRA
- byStatus compact bar. The quiet scope note ("Showing cases you're authorized to see").

## 5. Investigation `/investigations/:id` (Pritika), where :id is a case ID

CORE
- The linked cases side by side, styled like the landing page's two desks cards: BureauTag, institution name as each bureau filed it, case ID, category, status, received date. Matching fields in indigo.
- "Why Setu matched these": reasons as checked rows, match confidence, and a plain note that the suggestion supports the officer and doesn't decide.
- Confirm or Reject the link (ReasonDialog, POST /intelligence/links/:id/review with expectedUpdatedAt, 409 STALE_REVIEW handled).
- After confirming: record a coordination decision (POST /coordination: type plus rationale), then show the coordination workspace (status, involved bureaus, tracked actions, history Timeline).

EXTRA
- Workspace commands (assign coordinator, track action, change status). Read-only mode with "who can decide" note for officers.

## 6. Knowledge graph `/graph/:institutionId` (Pritika)

CORE
- @xyflow/react (already installed). GET /intelligence/graph/:institutionId. Deterministic layout without new packages: institution in the centre, bureaus around it, each bureau's complaints beyond it, actions beyond those. No overlapping nodes.
- Square node components in our style. RELATED_TO edges (overlaps) are red and thicker; others are quiet lines. A word legend.
- Click a node to open a side panel with details and a link to its page.
- "View as list" toggle; phones default to the list.

EXTRA
- Keyboard focus on nodes, reduced-motion handling of fit-view.

## 7. Alerts `/alerts` (Pritika)

CORE
- Tabs: Unread, All, Resolved (GET /alerts with unreadOnly and resolved).
- Rows: type as a text label with an icon (Overlap, Deadline approaching, Overdue, Escalation), message, case and institution links, time. Only Overlap and Overdue use the alert colour.
- Mark read and Resolve (PATCH /alerts/:id). The header bell count stays in sync (shared query key).

EXTRA
- "Refresh alerts" for BUREAU_HEAD/ADMIN (POST /alerts/refresh).

## 8. Bureau queue `/bureau-queue` (Kevin)

CORE
- Bureau from the shell context. GET /bureaus/:id/queue. PageHeader with bureau name and quiet totals (open, overdue, unassigned).
- Tabs: Unassigned, Due soon (48h), Overdue, All open. DataTable like the complaints list, with overlap flags linking to the investigation.

EXTRA
- Assign officer (GET /bureaus/:id/officers, ReasonDialog, PATCH assignedToId).

## 9. Reports `/reports` (Kevin)

CORE
- Filters in the URL: date range presets (this month, last quarter, last 12 months), bureau (shell context), regional office.
- Panels, each with a chart (reuse the dashboard's chart styling and useChartTokens), a small table and a one-line summary:
  1. Status summary and disposal rate
  2. Bureau-wise
  3. Region-wise
  4. Pending case ageing with the 30-day line
  5. Overlapping cases per month (flagged, confirmed, rejected, open)
- Numbers come from the same data as the dashboard, so they match for the same filters.

EXTRA
- Monthly/quarterly toggle, institution-wise history picker, CSV download per panel, print style.

---

## Verification in deadline mode

For each page: typecheck, lint, build, then one quick Playwright screenshot of the page at 1366x768 and 390x844 in mock mode, plus a click-through of its CORE flow. Fix what's broken. Don't run long test suites. Commit after each page, so a dropped connection never loses finished work.
