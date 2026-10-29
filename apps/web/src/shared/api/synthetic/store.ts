// Mutable in-memory state built on the deterministic generator. Mock mutations change
// it, so an edit on one page shows on every other page (and the dashboard) until reload.
//
// Scope: the synthetic data answers with ADMIN-like global scope for every demo account.
// Bureau scoping and redacted counterparts (otherComplaint.id = null) only exist on real data.
import {
  APPROACHING_HOURS,
  DAY,
  MOCK_TODAY,
  type BaseCase,
  generateCases,
  institutions,
  iso,
  isOpenAt,
  lastEventAt,
  mockBureaus,
  pick,
  rng,
  statusAt,
} from './core';
import type {
  Action,
  ActionStatus,
  ActionType,
  AlertItem,
  BureauCode,
  CaseLinkStatus,
  ComplaintDetail,
  ComplaintListItem,
  ComplaintStatus,
  CoordinationDecision,
  Officer,
  OverlapAlert,
  OverlapReviewStatus,
  TimelineEntry,
  Workspace,
  WorkspaceHistoryEntry,
} from '../../types';

// Clock: the data is "as of" MOCK_TODAY; each mutation moves time on by a second,
// so changes made in this session are always the newest events.
let ticks = 0;
export const now = () => Date.parse(MOCK_TODAY) + ticks * 1000;
export const advance = () => {
  ticks += 1;
  return now();
};

// Officers: 4 officers and 1 head per bureau. The PGRC and RB demo logins are among them.
const officerNames = [
  'S. Rao',
  'A. Menon',
  'K. Iyer',
  'P. Das',
  'R. Gill',
  'M. Shah',
  'N. Kulkarni',
  'T. Bose',
  'V. Reddy',
  'L. Thomas',
  'G. Sandhu',
  'H. Nair',
  'D. Joshi',
  'F. Khan',
  'J. Pillai',
  'B. Sen',
];
export const officers: Officer[] = mockBureaus.flatMap(({ code }, b) => {
  const lower = code.toLowerCase();
  const demo = code === 'PGRC' || code === 'RB';
  return [
    {
      id: demo ? `demo-user-${lower}-head` : `head-${lower}`,
      displayName: demo
        ? `Fictional ${lower}-head`
        : `${officerNames[b * 4]} (head)`,
      role: 'BUREAU_HEAD' as const,
      bureauId: code,
    },
    ...[0, 1, 2, 3].map((k) => ({
      id:
        demo && k === 0
          ? `demo-user-${lower}-officer`
          : `off-${lower}-${k + 1}`,
      displayName:
        demo && k === 0
          ? `Fictional ${lower}-officer`
          : officerNames[b * 4 + k],
      role: 'OFFICER' as const,
      bureauId: code,
    })),
  ];
});
const officersOf = (bureau: BureauCode) =>
  officers.filter((o) => o.bureauId === bureau && o.role === 'OFFICER');
export const headOf = (bureau: BureauCode) =>
  officers.find((o) => o.bureauId === bureau && o.role === 'BUREAU_HEAD');

// Cases ------------------------------------------------------------------------------------
export interface StoreCase extends BaseCase {
  sourceBureau: BureauCode;
  title: string;
  description: string;
  category: string;
  assignedToId: string | null;
  createdById: string | null;
  version: number;
  updatedAt: number;
  archivedAt: number | null;
}

const categoriesByBureau: Record<string, [string, number][]> = {
  PGRC: [
    ['FEES', 4],
    ['ADMISSION', 3],
    ['FACULTY', 2],
  ],
  RB: [
    ['FEES', 3],
    ['INFRASTRUCTURE', 3],
    ['FACULTY', 2],
  ],
  AB: [
    ['APPROVAL', 4],
    ['INFRASTRUCTURE', 2],
  ],
  AC: [
    ['ACADEMIC', 4],
    ['FACULTY', 2],
  ],
};
const titles: Record<string, string[]> = {
  FEES: [
    'Unapproved admission fees',
    'Capitation fee demanded',
    'Fee refund withheld',
    'Hostel charges above approved limit',
  ],
  ADMISSION: [
    'Admission beyond approved intake',
    'Seat cancelled without notice',
    'Merit list not published',
  ],
  FACULTY: [
    'Faculty shortage in department',
    'Faculty salaries withheld',
    'Unqualified faculty appointed',
  ],
  INFRASTRUCTURE: [
    'Laboratory not functional',
    'Library below norms',
    'Unsafe building reported',
  ],
  APPROVAL: [
    'Course run without extension of approval',
    'Change of site not approved',
    'Intake increased without approval',
  ],
  ACADEMIC: [
    'Examination results delayed',
    'Syllabus not followed',
    'Internship not arranged',
  ],
};

const base = generateCases();

// The four overlap suggestions (same as the dashboard had). Cases are the latest per bureau
// at that institution unless given; an unreviewed suggestion keeps its cases open.
const overlapSpecs: {
  id: string;
  institutionId: string;
  bureaus: BureauCode[];
  caseIds?: string[];
  confidence: number;
  reasons: string[];
  state: OverlapAlert['status'] | 'REJECTED';
  detectedAt: string;
  /** Past overlaps already decided: in links, reports and the graph, not on the dashboard. */
  historical?: boolean;
}[] = [
  {
    id: 'ovl-001',
    institutionId: 'inst-01',
    bureaus: ['PGRC', 'RB'],
    caseIds: ['cmp-001', 'cmp-002'],
    confidence: 0.91,
    reasons: [
      'Same AICTE permanent ID',
      'Name variant of the same college',
      'Same category, one day apart',
    ],
    state: 'NEW',
    detectedAt: '2026-10-02T09:15:00Z',
  },
  {
    id: 'ovl-002',
    institutionId: 'inst-02',
    bureaus: ['RB', 'AB'],
    confidence: 0.84,
    reasons: [
      'Same AICTE permanent ID',
      'Approval condition linked to the regulation complaint',
    ],
    state: 'UNDER_REVIEW',
    detectedAt: '2026-10-21T06:40:00Z',
  },
  {
    id: 'ovl-003',
    institutionId: 'inst-05',
    bureaus: ['PGRC', 'RB', 'AC'],
    confidence: 0.72,
    reasons: [
      'Name variant of the same college',
      'Same address',
      'Related fee allegation',
    ],
    state: 'NEW',
    detectedAt: '2026-10-26T11:05:00Z',
  },
  {
    id: 'ovl-004',
    institutionId: 'inst-07',
    bureaus: ['PGRC', 'RB'],
    confidence: 0.95,
    reasons: ['Same AICTE permanent ID', 'Same category, two days apart'],
    state: 'LINKED',
    detectedAt: '2026-10-12T08:20:00Z',
  },
];
const overlapCases = overlapSpecs.map((spec) => {
  const chosen = spec.caseIds
    ? spec.caseIds.map((id) => base.find((c) => c.id === id)!)
    : spec.bureaus.map(
        (b) =>
          base
            .filter(
              (c) => c.institutionId === spec.institutionId && c.bureau === b,
            )
            .sort((x, y) => y.createdAt - x.createdAt)[0],
      );
  if (spec.state === 'NEW' || spec.state === 'UNDER_REVIEW')
    for (const c of chosen)
      if (c) c.events = c.events.filter((e) => e.status !== 'DISPOSED');
  return chosen.filter(Boolean).map((c) => c.id);
});

// Past overlaps across the last 12 months, so the overlaps-per-month report has a shape:
// mostly confirmed or rejected (historical), plus two still open. They reuse existing
// cases (never reopening one), so every dashboard count stays the same.
{
  const r3 = rng(9026);
  const today = Date.parse(MOCK_TODAY);
  const used = new Set(overlapCases.flat());
  const reasonSets = [
    ['Same AICTE permanent ID', 'Same category, a few days apart'],
    ['Name variant of the same college', 'Same address'],
    ['Same AICTE permanent ID', 'Related fee allegation'],
    ['Same category', 'Same complainant group'],
  ];
  const pairIn = (from: number, to: number, needOpen: boolean) => {
    const pool = base
      .filter(
        (c) =>
          c.createdAt >= from &&
          c.createdAt < to &&
          !used.has(c.id) &&
          (!needOpen || isOpenAt(c, today)),
      )
      .sort((x, y) => x.createdAt - y.createdAt);
    // Seeded Fisher-Yates shuffle, so the same pairs come out on every load.
    const starts = [...pool];
    for (let i = starts.length - 1; i > 0; i--) {
      const j = Math.floor(r3() * (i + 1));
      [starts[i], starts[j]] = [starts[j], starts[i]];
    }
    for (const a of starts) {
      const b = pool.find(
        (c) =>
          c.id !== a.id &&
          c.institutionId === a.institutionId &&
          c.bureau !== a.bureau &&
          Math.abs(c.createdAt - a.createdAt) <= 6 * DAY,
      );
      if (b) return [a, b].sort((x, y) => x.createdAt - y.createdAt);
    }
    return null;
  };
  // Overlaps decided per month, Nov 2025 to Sep 2026 (peaking with admissions), then two open.
  const perMonth = [1, 1, 1, 1, 2, 1, 2, 2, 3, 2, 2];
  const plan: {
    from: number;
    to: number;
    open: boolean;
    state: (typeof overlapSpecs)[number]['state'];
  }[] = [];
  perMonth.forEach((n, i) => {
    const from = Date.UTC(2025, 10 + i, 1);
    const to = Date.UTC(2025, 11 + i, 1);
    for (let k = 0; k < n; k++)
      plan.push({
        from,
        to,
        open: false,
        state: r3() < 0.7 ? 'LINKED' : 'REJECTED',
      });
  });
  plan.push({
    from: Date.UTC(2026, 7, 1),
    to: Date.UTC(2026, 9, 1),
    open: true,
    state: 'NEW',
  });
  plan.push({
    from: Date.UTC(2026, 7, 1),
    to: Date.UTC(2026, 9, 1),
    open: true,
    state: 'UNDER_REVIEW',
  });
  plan.forEach((p, n) => {
    const pair = pairIn(p.from, p.to, p.open);
    if (!pair) return;
    for (const c of pair) used.add(c.id);
    const id = `ovl-past-${String(n + 1).padStart(2, '0')}`;
    overlapSpecs.push({
      id,
      institutionId: pair[0].institutionId,
      bureaus: pair.map((c) => c.bureau),
      caseIds: pair.map((c) => c.id),
      confidence: Math.round((0.66 + r3() * 0.3) * 100) / 100,
      reasons: reasonSets[Math.floor(r3() * reasonSets.length)],
      state: p.state,
      detectedAt: new Date(pair[1].createdAt + 6 * 3_600_000).toISOString(),
      historical: !p.open,
    });
    overlapCases.push(pair.map((c) => c.id));
  });
}

// Details come from a second seed so the base cases (and every dashboard number) don't move.
const r2 = rng(1847);
const known = new Map<
  string,
  { title: string; description: string; category: string }
>([
  [
    'cmp-001',
    {
      title: 'Unapproved admission fees',
      description: 'Students report unauthorised collection of admission fees.',
      category: 'FEES',
    },
  ],
  [
    'cmp-002',
    {
      title: 'Additional admission payments',
      description:
        'Institute demanding extra payments beyond approved charges.',
      category: 'FEES',
    },
  ],
]);
export const cases: StoreCase[] = base.map((c) => {
  const category =
    known.get(c.id)?.category ?? pick(r2, categoriesByBureau[c.bureau]);
  const options = titles[category];
  const title =
    known.get(c.id)?.title ?? options[Math.floor(r2() * options.length)];
  const team = officersOf(c.bureau);
  const handled = c.events.some((e) => e.status !== 'RECEIVED');
  return {
    ...c,
    sourceBureau: c.bureau,
    title,
    description:
      known.get(c.id)?.description ??
      `${title}. Reported by a student or parent; every detail in this record is synthetic.`,
    category,
    assignedToId: handled ? team[Math.floor(r2() * team.length)].id : null,
    createdById: team[Math.floor(r2() * team.length)].id,
    version: c.events.length,
    updatedAt: lastEventAt(c),
    archivedAt: null,
  };
});
export const caseById = (id: string) => cases.find((c) => c.id === id);
export const institutionById = (id: string) =>
  institutions.find((i) => i.id === id);

// Case links: one per pair (the first case of an overlap with each other case).
export interface StoreLink {
  id: string;
  overlapId: string;
  sourceComplaintId: string;
  targetComplaintId: string;
  status: CaseLinkStatus;
  /** Suggestions an officer has started looking at show as "under review". */
  underReview: boolean;
  score: number;
  reasons: string[];
  createdAt: number;
  updatedAt: number;
  reviewedById: string | null;
  reviewReason: string | null;
  reviewedAt: number | null;
}
export const links: StoreLink[] = overlapSpecs.flatMap((spec, n) => {
  const [first, ...rest] = overlapCases[n];
  return rest.map((other, k) => {
    const detected = Date.parse(spec.detectedAt);
    const confirmed = spec.state === 'LINKED';
    const rejected = spec.state === 'REJECTED';
    const decided = confirmed || rejected;
    return {
      id: rest.length > 1 ? `link-${spec.id}-${k + 1}` : `link-${spec.id}`,
      overlapId: spec.id,
      sourceComplaintId: first,
      targetComplaintId: other,
      status: confirmed
        ? ('CONFIRMED' as const)
        : rejected
          ? ('REJECTED' as const)
          : ('SUGGESTED' as const),
      underReview: spec.state === 'UNDER_REVIEW',
      score: spec.confidence,
      reasons: spec.reasons,
      createdAt: detected,
      updatedAt: decided ? detected + 3 * DAY : detected,
      reviewedById: decided ? (headOf('PGRC')?.id ?? null) : null,
      reviewReason: confirmed
        ? 'Same institution and category; one record for both bureaus.'
        : rejected
          ? 'Different allegations; the cases stay separate.'
          : null,
      reviewedAt: decided ? detected + 3 * DAY : null,
    };
  });
});
export const linkById = (id: string) => links.find((l) => l.id === id);

/**
 * Matching for a case that has no suggestions yet (mock analyze): one suggested link to
 * the latest open case at each other bureau at the same institution, registered as an
 * overlap so the dashboard, alerts and links all show it.
 */
export function suggestOverlaps(caseId: string): StoreLink[] {
  const c = caseById(caseId);
  if (!c) return [];
  const t = now();
  const others = mockBureaus
    .map((b) => b.code)
    .filter((b) => b !== c.bureau)
    .map(
      (b) =>
        cases
          .filter(
            (x) =>
              x.institutionId === c.institutionId &&
              x.bureau === b &&
              isOpenAt(x, t) &&
              !x.archivedAt,
          )
          .sort((x, y) => y.createdAt - x.createdAt)[0],
    )
    .filter((x): x is StoreCase => !!x)
    .slice(0, 2);
  if (!others.length) return [];
  const id = `ovl-syn-${t}`;
  const reasons = ['Same AICTE permanent ID'];
  if (others.some((o) => o.category === c.category))
    reasons.push('Same category');
  reasons.push('Open cases at another bureau');
  const score = others.some((o) => o.category === c.category) ? 0.86 : 0.74;
  overlapSpecs.push({
    id,
    institutionId: c.institutionId,
    bureaus: [c.bureau, ...others.map((o) => o.bureau)],
    caseIds: [c.id, ...others.map((o) => o.id)],
    confidence: score,
    reasons,
    state: 'NEW',
    detectedAt: iso(t),
  });
  const made = others.map((o, k) => ({
    id: others.length > 1 ? `link-${id}-${k + 1}` : `link-${id}`,
    overlapId: id,
    sourceComplaintId: c.id,
    targetComplaintId: o.id,
    status: 'SUGGESTED' as const,
    underReview: false,
    score,
    reasons,
    createdAt: t,
    updatedAt: t,
    reviewedById: null,
    reviewReason: null,
    reviewedAt: null,
  }));
  links.push(...made);
  return made;
}

/** The dashboard's overlap view of the links, live. Rejected overlaps drop out. */
export function overlapAlerts(): OverlapAlert[] {
  return overlapSpecs
    .filter((spec) => !spec.historical)
    .map((spec) => {
      const mine = links.filter((l) => l.overlapId === spec.id);
      if (mine.some((l) => l.status === 'REJECTED')) return null;
      const inst = institutionById(spec.institutionId)!;
      const status: OverlapAlert['status'] = mine.every(
        (l) => l.status === 'CONFIRMED',
      )
        ? 'LINKED'
        : mine.some((l) => l.underReview)
          ? 'UNDER_REVIEW'
          : 'NEW';
      const ids = [
        mine[0].sourceComplaintId,
        ...mine.map((l) => l.targetComplaintId),
      ];
      return {
        id: spec.id,
        linkId: mine[0].id,
        linkIds: mine.map((l) => l.id),
        updatedAt: iso(Math.max(...mine.map((l) => l.updatedAt))),
        institution: {
          id: inst.id,
          name: inst.name,
          permanentId: inst.permanentId,
        },
        bureaus: spec.bureaus,
        cases: ids.map((id) => {
          const c = caseById(id)!;
          return { id: c.id, originalId: c.originalId, bureau: c.bureau };
        }),
        confidence: spec.confidence,
        reasons: spec.reasons,
        status,
        detectedAt: spec.detectedAt,
      };
    })
    .filter((o): o is OverlapAlert & { linkIds: string[] } => o !== null);
}

export function overlapReviewStatus(caseId: string): OverlapReviewStatus {
  const mine = links.filter(
    (l) => l.sourceComplaintId === caseId || l.targetComplaintId === caseId,
  );
  if (!mine.length) return 'NOT_REVIEWED';
  return mine.every((l) => l.status !== 'SUGGESTED') ? 'REVIEWED' : 'PENDING';
}

// Actions ----------------------------------------------------------------------------------
const actionSummaries: Record<ActionType, string[]> = {
  EVIDENCE_REQUEST: [
    'Request fee ledger',
    'Request admission register',
    'Request faculty attendance records',
  ],
  INSPECTION: [
    'Inspect laboratories',
    'Inspect hostel and library',
    'Site visit to verify infrastructure',
  ],
  NOTICE: ['Notice to institution', 'Show-cause notice', 'Reminder notice'],
  REVIEW: ['Review institution reply', 'Review submitted documents'],
};
export const actions: Action[] = [];
for (const c of cases) {
  const taken = c.events.find((e) => e.status === 'UNDER_PROCESS');
  if (!taken || r2() > 0.33) continue;
  const type = pick<ActionType>(r2, [
    ['EVIDENCE_REQUEST', 4],
    ['NOTICE', 3],
    ['INSPECTION', 2],
    ['REVIEW', 1],
  ]);
  const createdAt = taken.at + (1 + r2() * 3) * DAY;
  if (createdAt >= now()) continue;
  const status: ActionStatus = !isOpenAt(c, now())
    ? 'COMPLETED'
    : r2() < 0.5
      ? 'IN_PROGRESS'
      : 'PLANNED';
  const options = actionSummaries[type];
  actions.push({
    id: `act-${String(actions.length + 1).padStart(4, '0')}`,
    complaintId: c.id,
    bureauId: c.bureau,
    createdById: c.assignedToId,
    type,
    status,
    summary: options[Math.floor(r2() * options.length)],
    evidenceScope:
      type === 'EVIDENCE_REQUEST' ? `${c.category.toLowerCase()}:2026` : null,
    dueAt: iso(createdAt + 10 * DAY),
    createdAt: iso(createdAt),
  });
}
// Both Aaravika desks asked for the same evidence, so the Action Firewall has something to catch.
for (const [complaintId, day] of [
  ['cmp-001', 3],
  ['cmp-002', 4],
] as const) {
  const c = caseById(complaintId)!;
  actions.push({
    id: `act-${complaintId}`,
    complaintId,
    bureauId: c.bureau,
    createdById: c.assignedToId ?? officersOf(c.bureau)[0].id,
    type: 'EVIDENCE_REQUEST',
    status: 'PLANNED',
    summary: 'Request fee ledger',
    evidenceScope: 'admission-fees:2026-Q3',
    dueAt: iso(c.createdAt + (day + 10) * DAY),
    createdAt: iso(c.createdAt + day * DAY),
  });
}

// Coordination -----------------------------------------------------------------------------
export const decisions: CoordinationDecision[] = [];
const confirmedLink = links.find((l) => l.overlapId === 'ovl-004')!;
const wsCreated = confirmedLink.reviewedAt! + 2 * 3_600_000;
export const workspaces: (Workspace & { history: WorkspaceHistoryEntry[] })[] =
  [
    {
      id: 'ws-001',
      caseLinkId: confirmedLink.id,
      status: 'IN_PROGRESS',
      version: 2,
      createdAt: iso(wsCreated),
      updatedAt: iso(wsCreated + DAY),
      coordinatorId: headOf('RB')!.id,
      coordinatorRestricted: false,
      involvedBureauIds: ['PGRC', 'RB'],
      complaintIds: [
        confirmedLink.sourceComplaintId,
        confirmedLink.targetComplaintId,
      ],
      sharedActionIds: [],
      history: [
        {
          event: 'COORDINATION_WORKSPACE_CREATED',
          operation: null,
          version: 0,
          fromStatus: null,
          toStatus: 'OPEN',
          actorId: headOf('PGRC')!.id,
          fromCoordinatorId: null,
          toCoordinatorId: null,
          coordinatorRestricted: false,
          actionId: null,
          actionRestricted: false,
          createdAt: iso(wsCreated),
        },
        {
          event: 'COORDINATION_WORKSPACE_UPDATED',
          operation: 'ASSIGN',
          version: 1,
          fromStatus: 'OPEN',
          toStatus: 'OPEN',
          actorId: headOf('PGRC')!.id,
          fromCoordinatorId: null,
          toCoordinatorId: headOf('RB')!.id,
          coordinatorRestricted: false,
          actionId: null,
          actionRestricted: false,
          createdAt: iso(wsCreated + 3_600_000),
        },
        {
          event: 'COORDINATION_WORKSPACE_UPDATED',
          operation: 'SET_STATUS',
          version: 2,
          fromStatus: 'OPEN',
          toStatus: 'IN_PROGRESS',
          actorId: headOf('RB')!.id,
          fromCoordinatorId: headOf('RB')!.id,
          toCoordinatorId: headOf('RB')!.id,
          coordinatorRestricted: false,
          actionId: null,
          actionRestricted: false,
          createdAt: iso(wsCreated + DAY),
        },
      ],
    },
  ];

// Audit entries written by mutations (status changes come from case events instead).
export const auditExtras = new Map<string, TimelineEntry[]>();
export function audit(
  caseId: string,
  event: string,
  actorId: string | null,
  metadata: Record<string, unknown> = {},
) {
  const list = auditExtras.get(caseId) ?? [];
  list.push({
    id: `audit-${caseId}-${now()}-${list.length}`,
    event,
    actorId,
    createdAt: iso(now()),
    metadata,
  });
  auditExtras.set(caseId, list);
}

/** Full append-only history for a case, newest first (as the API orders it). */
export function timelineOf(c: StoreCase): TimelineEntry[] {
  const entries: TimelineEntry[] = [
    {
      id: `${c.id}-created`,
      event: 'COMPLAINT_CREATED',
      actorId: c.createdById,
      createdAt: iso(c.createdAt),
      metadata: { bureauId: c.sourceBureau },
    },
  ];
  let prev: ComplaintStatus = 'RECEIVED';
  c.events.forEach((e, i) => {
    if (e.status === 'UNDER_PROCESS' && prev === 'RECEIVED' && c.assignedToId)
      entries.push({
        id: `${c.id}-assigned-${i}`,
        event: 'COMPLAINT_ASSIGNED',
        actorId: headOf(c.bureau)?.id ?? null,
        createdAt: iso(e.at),
        metadata: { assignedToId: c.assignedToId },
      });
    entries.push({
      id: `${c.id}-status-${i}`,
      event: 'COMPLAINT_STATUS_CHANGED',
      actorId: c.assignedToId,
      createdAt: iso(e.at),
      metadata: { fromStatus: prev, toStatus: e.status },
    });
    prev = e.status;
  });
  for (const a of actions.filter((a) => a.complaintId === c.id))
    entries.push({
      id: `${a.id}-created`,
      event: 'ACTION_CREATED',
      actorId: a.createdById,
      createdAt: a.createdAt,
      metadata: { actionId: a.id, type: a.type },
    });
  for (const l of links.filter(
    (l) =>
      l.reviewedAt &&
      (l.sourceComplaintId === c.id || l.targetComplaintId === c.id),
  ))
    entries.push({
      id: `${l.id}-reviewed-${c.id}`,
      event: 'CASE_LINK_REVIEWED',
      actorId: l.reviewedById,
      createdAt: iso(l.reviewedAt!),
      metadata: { caseLinkId: l.id, status: l.status },
    });
  entries.push(...(auditExtras.get(c.id) ?? []));
  return entries.sort(
    (a, b) =>
      b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id),
  );
}

// Alerts: derived from the live state; read/resolved choices are kept per alert id.
export const alertState = new Map<
  string,
  { readAt: string | null; resolvedAt: string | null }
>();
export function alertsNow(): AlertItem[] {
  const t = now();
  const out: AlertItem[] = [];
  for (const o of overlapAlerts().filter((o) => o.status !== 'LINKED'))
    out.push({
      id: `alert-${o.id}`,
      type: 'OVERLAP',
      complaintId: o.cases[0].id,
      message: 'Overlap awaits review',
      readAt: null,
      createdAt: o.detectedAt,
      resolvedAt: null,
      userId: null,
      dedupeKey: `review:${o.cases[0].id}`,
    });
  for (const c of cases) {
    if (!isOpenAt(c, t) || c.archivedAt) continue;
    const left = c.dueAt - t;
    if (left < 0) {
      const days = Math.max(1, Math.round(-left / DAY));
      out.push({
        id: `alert-overdue-${c.id}`,
        type: 'DEADLINE',
        complaintId: c.id,
        message: `Disposal timeline passed ${days} ${days === 1 ? 'day' : 'days'} ago`,
        // Older overdue alerts have been seen already.
        readAt: days > 7 ? iso(c.dueAt + DAY) : null,
        createdAt: iso(c.dueAt),
        resolvedAt: null,
        userId: c.assignedToId,
        dedupeKey: `deadline:${c.id}:${iso(c.dueAt)}:overdue`,
      });
    } else if (left <= APPROACHING_HOURS * 3_600_000) {
      out.push({
        id: `alert-approaching-${c.id}`,
        type: 'DEADLINE',
        complaintId: c.id,
        message: `Disposal timeline ends in ${Math.max(1, Math.round(left / 3_600_000))} hours`,
        readAt: null,
        createdAt: iso(c.dueAt - APPROACHING_HOURS * 3_600_000),
        resolvedAt: null,
        userId: c.assignedToId,
        dedupeKey: `deadline:${c.id}:${iso(c.dueAt)}:approaching`,
      });
    }
    const last = c.events.at(-1);
    if (last && t - last.at <= 3 * DAY)
      out.push({
        id: `alert-status-${c.id}-${c.version}`,
        type: 'STATUS_CHANGE',
        complaintId: c.id,
        message: `Status changed to ${statusLabel[last.status]}`,
        readAt: null,
        createdAt: iso(last.at),
        resolvedAt: null,
        userId: c.assignedToId,
        dedupeKey: `status:${c.id}:${c.version}`,
      });
  }
  return out
    .map((a) => ({ ...a, ...alertState.get(a.id) }))
    .sort(
      (a, b) =>
        b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id),
    );
}
export const statusLabel: Record<ComplaintStatus, string> = {
  RECEIVED: 'Received',
  UNDER_PROCESS: 'Under process',
  TRANSFERRED: 'Transferred',
  ESCALATED: 'Escalated',
  DISPOSED: 'Disposed',
};

// Serialisers matching the API's selects -----------------------------------------------------
export function toListItem(c: StoreCase): ComplaintListItem {
  return {
    id: c.id,
    originalId: c.originalId,
    institutionId: c.institutionId,
    bureauId: c.bureau,
    sourceBureauId: c.sourceBureau,
    title: c.title,
    category: c.category,
    status: statusAt(c, now()) ?? 'RECEIVED',
    overlapReviewStatus: overlapReviewStatus(c.id),
    assignedToId: c.assignedToId,
    dueAt: iso(c.dueAt),
    version: c.version,
    createdAt: iso(c.createdAt),
    updatedAt: iso(c.updatedAt),
    archivedAt: c.archivedAt ? iso(c.archivedAt) : null,
  };
}
export function toDetail(c: StoreCase): ComplaintDetail {
  const disposed = [...c.events].reverse().find((e) => e.status === 'DISPOSED');
  return {
    ...toListItem(c),
    description: c.description,
    createdById: c.createdById,
    resolvedAt: disposed ? iso(disposed.at) : null,
  };
}
