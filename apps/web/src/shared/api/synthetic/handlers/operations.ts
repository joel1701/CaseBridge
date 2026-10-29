// Action Firewall, coordination, alerts and reports.
import { DAY, iso, isOpenAt, regionOf, statusAt } from '../core';
import {
  actions,
  advance,
  alertState,
  alertsNow,
  audit,
  caseById,
  cases,
  decisions,
  linkById,
  links,
  now,
  officers,
  overlapAlerts,
  workspaces,
} from '../store';
import { ApiError } from '../../request';
import {
  conflict,
  done,
  invalid,
  notFound,
  paginate,
  reasonField,
  text,
} from './util';
import type {
  Action,
  ActionCreate,
  ActionDraft,
  ActionPreview,
  AlertItem,
  AlertListQuery,
  ComplaintStatus,
  CoordinationDecision,
  CoordinationDecisionInput,
  DateRange,
  OverlapMonth,
  OverviewFilters,
  ReportsSummary,
  Workspace,
  WorkspaceHistoryEntry,
  WorkspaceListQuery,
  WorkspaceUpdate,
} from '../../../types';

const ACTOR = 'demo-user-pgrc-head';
const TYPES = ['EVIDENCE_REQUEST', 'INSPECTION', 'NOTICE', 'REVIEW'];

// Actions ----------------------------------------------------------------------------------
function validateDraft(d: ActionDraft) {
  const errs: { path: string[]; message: string }[] = [];
  text(errs, 'complaintId', d.complaintId, 128);
  if (!TYPES.includes(d.type))
    errs.push({ path: ['type'], message: 'Invalid action type' });
  text(errs, 'summary', d.summary, 2000);
  if (d.evidenceScope !== undefined && d.evidenceScope.length > 200)
    errs.push({
      path: ['evidenceScope'],
      message: 'Must be at most 200 characters',
    });
  done(errs);
  if (!caseById(d.complaintId)) notFound('Complaint');
}

/** Open actions elsewhere at the same institution with the same type or evidence scope. */
function warningsFor(d: ActionDraft): ActionPreview['warnings'] {
  const c = caseById(d.complaintId)!;
  return actions
    .filter((a) => {
      const other = caseById(a.complaintId);
      if (!other || a.complaintId === c.id) return false;
      if (a.status !== 'PLANNED' && a.status !== 'IN_PROGRESS') return false;
      return (
        other.institutionId === c.institutionId &&
        (a.type === d.type ||
          (!!d.evidenceScope && a.evidenceScope === d.evidenceScope))
      );
    })
    .map((a) => ({
      code: 'POSSIBLE_DUPLICATE',
      message:
        a.type === 'EVIDENCE_REQUEST'
          ? 'Similar evidence request exists'
          : 'Similar action exists at this institution',
      // Another bureau's action stays private.
      relatedActionId: a.bureauId === c.bureau ? a.id : null,
    }));
}

export function previewAction(d: ActionDraft): ActionPreview {
  validateDraft(d);
  const warnings = warningsFor(d);
  return {
    warnings,
    recommendation: warnings.length
      ? 'Coordinate before sending'
      : 'No related work found',
    recommendationOnly: true,
  };
}

export function createAction(d: ActionCreate): Action {
  validateDraft(d);
  const warnings = warningsFor(d);
  if (d.overrideReason !== undefined) {
    const errs: { path: string[]; message: string }[] = [];
    reasonField(errs, 'overrideReason', d.overrideReason);
    done(errs);
  }
  if (warnings.length && !d.overrideReason)
    conflict(
      'REVIEW_REQUIRED',
      'Related work exists; a reason is required to proceed',
    );
  const t = advance();
  const c = caseById(d.complaintId)!;
  const action: Action = {
    id: `act-syn-${t}`,
    complaintId: c.id,
    bureauId: c.bureau,
    createdById: ACTOR,
    type: d.type,
    status: 'PLANNED',
    summary: d.summary.trim(),
    evidenceScope: d.evidenceScope ?? null,
    dueAt: d.dueAt ?? null,
    createdAt: iso(t),
  };
  actions.push(action);
  if (d.overrideReason)
    audit(c.id, 'ACTION_OVERRIDE_CREATED', ACTOR, {
      actionId: action.id,
      reason: d.overrideReason.trim(),
    });
  return action;
}

// Coordination -----------------------------------------------------------------------------
const COORDINATION = [
  'SHARE_EVIDENCE',
  'JOINT_INVESTIGATION',
  'DEFER_ACTION',
  'KEEP_SEPARATE',
];

export function recordCoordination(
  body: CoordinationDecisionInput,
): CoordinationDecision {
  const errs: { path: string[]; message: string }[] = [];
  if (!COORDINATION.includes(body.type))
    errs.push({ path: ['type'], message: 'Invalid coordination type' });
  reasonField(errs, 'rationale', body.rationale);
  done(errs);
  const l = linkById(body.caseLinkId);
  if (!l) notFound('Link');
  if (body.type !== 'KEEP_SEPARATE' && l.status !== 'CONFIRMED')
    conflict('INVALID_STATE', 'Coordination requires a confirmed link');
  const t = advance();
  const d: CoordinationDecision = {
    id: `decision-syn-${t}`,
    ...body,
    rationale: body.rationale.trim(),
    decidedById: ACTOR,
    createdAt: iso(t),
  };
  decisions.push(d);
  for (const id of [l.sourceComplaintId, l.targetComplaintId])
    audit(id, 'COORDINATION_RECORDED', ACTOR, {
      caseLinkId: l.id,
      type: body.type,
    });
  return d;
}

const publicWorkspace = ({
  history: _h,
  ...w
}: (typeof workspaces)[number]): Workspace => {
  void _h;
  return structuredClone(w);
};
const workspaceById = (id: string) => workspaces.find((w) => w.id === id);

export function createWorkspace(body: { caseLinkId: string }): Workspace {
  const l = linkById(body.caseLinkId);
  if (!l) notFound('Link');
  if (l.status !== 'CONFIRMED')
    conflict('INVALID_STATE', 'A confirmed relationship is required');
  if (workspaces.some((w) => w.caseLinkId === l.id))
    conflict('DUPLICATE_REFERENCE', 'This link already has a workspace');
  const t = advance();
  const w = {
    id: `ws-syn-${t}`,
    caseLinkId: l.id,
    status: 'OPEN' as const,
    version: 0,
    createdAt: iso(t),
    updatedAt: iso(t),
    coordinatorId: null,
    coordinatorRestricted: false,
    involvedBureauIds: [
      ...new Set([
        caseById(l.sourceComplaintId)!.bureau,
        caseById(l.targetComplaintId)!.bureau,
      ]),
    ],
    complaintIds: [l.sourceComplaintId, l.targetComplaintId],
    sharedActionIds: [],
    history: [
      {
        event: 'COORDINATION_WORKSPACE_CREATED' as const,
        operation: null,
        version: 0,
        fromStatus: null,
        toStatus: 'OPEN' as const,
        actorId: ACTOR,
        fromCoordinatorId: null,
        toCoordinatorId: null,
        coordinatorRestricted: false,
        actionId: null,
        actionRestricted: false,
        createdAt: iso(t),
      },
    ],
  };
  workspaces.push(w);
  for (const id of w.complaintIds)
    audit(id, 'COORDINATION_WORKSPACE_CREATED', ACTOR, { workspaceId: w.id });
  return publicWorkspace(w);
}

export function listWorkspaces(q: WorkspaceListQuery = {}) {
  if (q.complaintId && !caseById(q.complaintId)) notFound('Complaint');
  const rows = workspaces
    .filter(
      (w) =>
        (!q.caseLinkId || w.caseLinkId === q.caseLinkId) &&
        (!q.complaintId || w.complaintIds.includes(q.complaintId)) &&
        (!q.status || w.status === q.status),
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map(publicWorkspace);
  return paginate(rows, q);
}

export function getWorkspace(id: string): Workspace {
  const w = workspaceById(id);
  if (!w) notFound('Workspace');
  return publicWorkspace(w);
}

export function workspaceHistory(id: string): {
  items: WorkspaceHistoryEntry[];
  meta: { page: number; pageSize: number; total: number };
} {
  const w = workspaceById(id);
  if (!w) notFound('Workspace');
  return {
    items: structuredClone(w.history),
    meta: { page: 1, pageSize: w.history.length, total: w.history.length },
  };
}

export function updateWorkspace(id: string, body: WorkspaceUpdate): Workspace {
  const w = workspaceById(id);
  if (!w) notFound('Workspace');
  if (!Number.isInteger(body.expectedVersion))
    invalid([{ path: ['expectedVersion'], message: 'Required' }]);
  if (body.expectedVersion !== w.version)
    conflict('STALE_COORDINATION', 'Workspace changed since it was read');
  const cmd = body.command;
  const entry: WorkspaceHistoryEntry = {
    event: 'COORDINATION_WORKSPACE_UPDATED',
    operation: cmd.kind,
    version: w.version + 1,
    fromStatus: w.status,
    toStatus: w.status,
    actorId: ACTOR,
    fromCoordinatorId: w.coordinatorId,
    toCoordinatorId: w.coordinatorId,
    coordinatorRestricted: false,
    actionId: null,
    actionRestricted: false,
    createdAt: '',
  };
  if (cmd.kind === 'ASSIGN') {
    const o = officers.find((x) => x.id === cmd.officerId);
    if (!o) notFound('Officer');
    if (!w.involvedBureauIds.includes(o.bureauId ?? ''))
      throw new ApiError(
        403,
        'FORBIDDEN',
        'Coordinator must belong to an involved bureau',
      );
    w.coordinatorId = o.id;
    entry.toCoordinatorId = o.id;
  } else if (cmd.kind === 'TRACK_ACTION') {
    const a = actions.find(
      (x) => x.id === cmd.actionId && w.complaintIds.includes(x.complaintId),
    );
    if (!a) notFound('Action');
    if (!w.sharedActionIds.includes(a.id)) w.sharedActionIds.push(a.id);
    entry.actionId = a.id;
  } else if (cmd.kind === 'SET_STATUS') {
    if (!['OPEN', 'IN_PROGRESS', 'COMPLETED'].includes(cmd.status))
      invalid([{ path: ['command', 'status'], message: 'Invalid status' }]);
    if (w.status === 'COMPLETED')
      conflict('INVALID_STATE', 'Completed workspaces cannot change');
    w.status = cmd.status;
    entry.toStatus = cmd.status;
  } else invalid([{ path: ['command', 'kind'], message: 'Unknown command' }]);
  const t = advance();
  w.version += 1;
  w.updatedAt = iso(t);
  entry.createdAt = iso(t);
  w.history.push(entry);
  for (const cid of w.complaintIds)
    audit(cid, 'COORDINATION_WORKSPACE_UPDATED', ACTOR, {
      workspaceId: w.id,
      operation: cmd.kind,
      version: w.version,
    });
  return publicWorkspace(w);
}

// Alerts -----------------------------------------------------------------------------------
export function listAlerts(q: AlertListQuery = {}) {
  const resolved = q.resolved ?? 'false';
  const rows = alertsNow().filter(
    (a) =>
      (!q.unreadOnly || !a.readAt) &&
      (resolved === 'all' ||
        (resolved === 'true' ? !!a.resolvedAt : !a.resolvedAt)),
  );
  return paginate(rows, q);
}

export function refreshAlerts(): { processed: number } {
  advance();
  return { processed: cases.filter((c) => isOpenAt(c, now())).length };
}

export function updateAlert(
  id: string,
  body: { read?: boolean; resolved?: boolean },
): AlertItem {
  const a = alertsNow().find((x) => x.id === id);
  if (!a) notFound('Alert');
  const t = iso(advance());
  const state = { readAt: a.readAt, resolvedAt: a.resolvedAt };
  if (body.read !== undefined)
    state.readAt = body.read ? (a.readAt ?? t) : null;
  if (body.resolved !== undefined)
    state.resolvedAt = body.resolved ? (a.resolvedAt ?? t) : null;
  alertState.set(id, state);
  return { ...a, ...state };
}

// Reports ----------------------------------------------------------------------------------
export function reportsSummary(range: DateRange = {}): ReportsSummary {
  const from = range.from ? Date.parse(range.from) : -Infinity;
  const to = range.to ? Date.parse(range.to) : Infinity;
  if (from > to)
    invalid([{ path: ['from'], message: 'from must not be after to' }]);
  const t = now();
  const scoped = cases.filter((c) => c.createdAt >= from && c.createdAt <= to);
  const status = (c: (typeof cases)[number]) => statusAt(c, t) ?? 'RECEIVED';
  const byStatus = {
    RECEIVED: 0,
    UNDER_PROCESS: 0,
    TRANSFERRED: 0,
    ESCALATED: 0,
    DISPOSED: 0,
  } as Record<ComplaintStatus, number>;
  for (const c of scoped) byStatus[status(c)] += 1;
  const group = (key: (c: (typeof cases)[number]) => string) => {
    const m = new Map<string, number>();
    for (const c of scoped) m.set(key(c), (m.get(key(c)) ?? 0) + 1);
    return [...m].sort((a, b) => b[1] - a[1]);
  };
  const resolved = scoped.flatMap((c) => {
    const d = c.events.find((e) => e.status === 'DISPOSED');
    return d ? [(d.at - c.createdAt) / 3_600_000] : [];
  });
  const ids = new Set(scoped.map((c) => c.id));
  const openOverlaps = overlapAlerts().filter(
    (o) => o.status !== 'LINKED' && o.cases.some((c) => ids.has(c.id)),
  );
  return {
    totalComplaints: scoped.length,
    pendingComplaints: scoped.length - byStatus.DISPOSED,
    disposedComplaints: byStatus.DISPOSED,
    escalatedComplaints: byStatus.ESCALATED,
    overdueCount: scoped.filter((c) => status(c) !== 'DISPOSED' && c.dueAt < t)
      .length,
    pendingOverlapReviews: links.filter(
      (l) =>
        l.status === 'SUGGESTED' &&
        (ids.has(l.sourceComplaintId) || ids.has(l.targetComplaintId)),
    ).length,
    activeActions: actions.filter(
      (a) =>
        ids.has(a.complaintId) &&
        (a.status === 'PLANNED' || a.status === 'IN_PROGRESS'),
    ).length,
    byStatus,
    byBureau: group((c) => c.bureau).map(([bureauId, _count]) => ({
      bureauId,
      _count,
    })),
    byCategory: group((c) => c.category).map(([category, _count]) => ({
      category,
      _count,
    })),
    byInstitution: group((c) => c.institutionId).map(
      ([institutionId, _count]) => ({ institutionId, _count }),
    ),
    trends: group((c) => iso(c.createdAt).slice(0, 7))
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month)),
    averageResolutionHours: resolved.length
      ? Math.round(resolved.reduce((s, h) => s + h, 0) / resolved.length)
      : null,
    coordinationRequiredCount: openOverlaps.length,
    scope: 'SYNTHETIC',
  };
}

const RANGE_DAYS: Record<OverviewFilters['range'], number> = {
  '30d': 30,
  '90d': 90,
  '12m': 365,
  all: Infinity,
};

/** Links by flagged month, filtered like the dashboard overview (either case matching counts). */
export function overlapTrend(f: OverviewFilters): OverlapMonth[] {
  const t = now();
  const matches = (id: string) => {
    const c = caseById(id);
    if (!c) return false;
    if (f.region && regionOf(c.institutionId) !== f.region) return false;
    if (f.bureau === 'OTHER') return c.bureau !== 'RB' && c.bureau !== 'PGRC';
    return !f.bureau || c.bureau === f.bureau;
  };
  const chosen = links.filter(
    (l) =>
      t - l.createdAt <= RANGE_DAYS[f.range] * DAY &&
      (matches(l.sourceComplaintId) || matches(l.targetComplaintId)),
  );
  // Every month in the period (12 at most), oldest first, so empty months show as zero.
  const span = Math.min(12, Math.max(1, Math.ceil(RANGE_DAYS[f.range] / 30)));
  const d = new Date(t);
  const months = Array.from({ length: span }, (_, i) =>
    iso(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - span + 1 + i, 1)).slice(
      0,
      7,
    ),
  );
  return months.map((month) => {
    const mine = chosen.filter((l) => iso(l.createdAt).startsWith(month));
    return {
      month,
      flagged: mine.length,
      confirmed: mine.filter((l) => l.status === 'CONFIRMED').length,
      rejected: mine.filter((l) => l.status === 'REJECTED').length,
      open: mine.filter((l) => l.status === 'SUGGESTED').length,
    };
  });
}
