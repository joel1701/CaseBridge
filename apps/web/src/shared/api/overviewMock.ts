// Synthetic data for the coordination overview. Every number is derived from one
// deterministic set of ~600 fictional cases, so the panels agree with each other.
// Nothing here is real: institutions are "(Fictional)", AB and AC are synthetic bureaus.
import { complaints, institutions } from './mock';
import type {
  BureauCode,
  ComplaintStatus,
  CountWithPrevious,
  DashboardOverview,
  OverlapAlert,
  OverviewCountKey,
  OverviewFilters,
  Region,
} from '../types';

export const MOCK_TODAY = '2026-10-29T12:00:00Z';
const DAY = 86_400_000;
const DISPOSAL_DAYS = 30;
const APPROACHING_HOURS = 48; // DEADLINE_ALERT_HOURS default on the API

export const mockBureaus: { code: BureauCode; name: string }[] = [
  { code: 'PGRC', name: 'Public Grievance Redressal Cell' },
  { code: 'RB', name: 'Regulation Bureau' },
  { code: 'AB', name: 'Approval Bureau (synthetic)' },
  { code: 'AC', name: 'Academic Cell (synthetic)' },
];

// AICTE regional office for each state used by the fictional institutions.
const regionalOffice: Record<string, Region> = {
  Karnataka: 'Bengaluru',
  Telangana: 'Hyderabad',
  'Tamil Nadu': 'Chennai',
  Kerala: 'Thiruvananthapuram',
  'Madhya Pradesh': 'Bhopal',
  Gujarat: 'Vadodara',
  'West Bengal': 'Kolkata',
  Punjab: 'Chandigarh',
};
const regionOf = (institutionId: string): Region => {
  const inst = institutions.find((i) => i.id === institutionId);
  return (inst && regionalOffice[inst.state]) ?? 'Unassigned';
};

interface MockCase {
  id: string;
  originalId: string;
  institutionId: string;
  bureau: BureauCode;
  createdAt: number;
  dueAt: number;
  /** Status changes after RECEIVED, in time order. */
  events: { status: ComplaintStatus; at: number }[];
}

// Small seeded PRNG (mulberry32) so the data is the same on every load.
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = <T>(r: () => number, items: [T, number][]): T => {
  let x = r() * items.reduce((s, [, w]) => s + w, 0);
  for (const [v, w] of items) if ((x -= w) < 0) return v;
  return items[items.length - 1][0];
};

function generateCases(): MockCase[] {
  const r = rng(26264);
  const today = Date.parse(MOCK_TODAY);
  // Monthly intake, Nov 2025 to Oct 2026, peaking with July admissions.
  const months: [number, number][] = [
    [2025 * 12 + 10, 36],
    [2025 * 12 + 11, 31],
    [2026 * 12, 32],
    [2026 * 12 + 1, 38],
    [2026 * 12 + 2, 47],
    [2026 * 12 + 3, 44],
    [2026 * 12 + 4, 55],
    [2026 * 12 + 5, 66],
    [2026 * 12 + 6, 84],
    [2026 * 12 + 7, 74],
    [2026 * 12 + 8, 58],
    [2026 * 12 + 9, 35],
  ];
  const bureauWeights: [BureauCode, number][] = [
    ['PGRC', 40],
    ['RB', 30],
    ['AB', 18],
    ['AC', 12],
  ];
  const instWeights: [string, number][] = institutions.map((i, n) => [
    i.id,
    n === 0 ? 2 : 1,
  ]);
  const seq: Record<string, number> = {};
  const out: MockCase[] = [];
  for (const [ym, count] of months) {
    const start = Date.UTC(Math.floor(ym / 12), ym % 12, 1);
    const end = Math.min(
      Date.UTC(Math.floor((ym + 1) / 12), (ym + 1) % 12, 1),
      today - DAY,
    );
    for (let k = 0; k < count; k++) {
      const bureau = pick(r, bureauWeights);
      const createdAt = start + Math.floor(r() * (end - start));
      const year = new Date(createdAt).getUTCFullYear();
      const key = `${bureau}-${year}`;
      seq[key] = (seq[key] ?? 100) + 1 + Math.floor(r() * 3);
      const events: MockCase['events'] = [];
      let t = createdAt;
      if (r() < 0.07)
        events.push({ status: 'TRANSFERRED', at: (t += (2 + r() * 6) * DAY) });
      if (r() < 0.9)
        events.push({
          status: 'UNDER_PROCESS',
          at: (t += (1 + r() * 4) * DAY),
        });
      if (r() < 0.1)
        events.push({ status: 'ESCALATED', at: (t += (8 + r() * 20) * DAY) });
      // Most cases close inside the 30-day timeline; a tail runs late.
      const disposeAfter = r() < 0.55 ? 10 + r() * 19 : 31 + r() * 90;
      const disposedAt = Math.max(t + DAY, createdAt + disposeAfter * DAY);
      if (disposedAt < today)
        events.push({ status: 'DISPOSED', at: disposedAt });
      out.push({
        id: `syn-${String(out.length + 1).padStart(4, '0')}`,
        originalId: `${bureau}-${year}-${String(seq[key]).padStart(4, '0')}`,
        institutionId: pick(r, instWeights),
        bureau,
        createdAt,
        dueAt: createdAt + DISPOSAL_DAYS * DAY,
        events: events.filter((e) => e.at < today),
      });
    }
  }
  // The two fictional complaints the rest of the app already uses (mock.ts), still open.
  for (const c of complaints) {
    const createdAt = Date.parse(c.createdAt);
    out.push({
      id: c.id,
      originalId: c.originalId,
      institutionId: c.institutionId,
      bureau: c.bureauId,
      createdAt,
      dueAt: createdAt + DISPOSAL_DAYS * DAY,
      events:
        c.status === 'UNDER_PROCESS'
          ? [{ status: 'UNDER_PROCESS', at: createdAt + DAY }]
          : [],
    });
  }
  return out;
}

const CASES = generateCases();

function statusAt(c: MockCase, t: number): ComplaintStatus | null {
  if (c.createdAt > t) return null;
  let s: ComplaintStatus = 'RECEIVED';
  for (const e of c.events) if (e.at <= t) s = e.status;
  return s;
}
const isOpenAt = (c: MockCase, t: number) => {
  const s = statusAt(c, t);
  return s !== null && s !== 'DISPOSED';
};
const lastEventAt = (c: MockCase) => c.events.at(-1)?.at ?? c.createdAt;

// Hand-written overlap suggestions. Cases are picked from the generated set
// (the latest open case per bureau at that institution) unless given.
const overlapSpecs: {
  id: string;
  institutionId: string;
  bureaus: BureauCode[];
  caseIds?: string[];
  confidence: number;
  reasons: string[];
  status: OverlapAlert['status'];
  detectedAt: string;
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
    status: 'NEW',
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
    status: 'UNDER_REVIEW',
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
    status: 'NEW',
    detectedAt: '2026-10-26T11:05:00Z',
  },
  {
    id: 'ovl-004',
    institutionId: 'inst-07',
    bureaus: ['PGRC', 'RB'],
    confidence: 0.95,
    reasons: ['Same AICTE permanent ID', 'Same category, two days apart'],
    status: 'LINKED',
    detectedAt: '2026-10-12T08:20:00Z',
  },
];

const OVERLAPS: OverlapAlert[] = overlapSpecs.map((spec) => {
  const inst = institutions.find((i) => i.id === spec.institutionId)!;
  const chosen = spec.caseIds
    ? spec.caseIds.map((id) => CASES.find((c) => c.id === id)!)
    : spec.bureaus.map(
        (b) =>
          CASES.filter(
            (c) => c.institutionId === spec.institutionId && c.bureau === b,
          ).sort((x, y) => y.createdAt - x.createdAt)[0],
      );
  // A suggestion nobody has acted on yet keeps its cases open.
  if (spec.status !== 'LINKED')
    for (const c of chosen)
      if (c) c.events = c.events.filter((e) => e.status !== 'DISPOSED');
  return {
    id: spec.id,
    linkId: `link-${spec.id}`,
    updatedAt: spec.detectedAt,
    institution: {
      id: inst.id,
      name: inst.name,
      permanentId: inst.permanentId,
    },
    bureaus: spec.bureaus,
    cases: chosen
      .filter(Boolean)
      .map((c) => ({ id: c.id, originalId: c.originalId, bureau: c.bureau })),
    confidence: spec.confidence,
    reasons: spec.reasons,
    status: spec.status,
    detectedAt: spec.detectedAt,
  };
});

// Overlaps linked from the dashboard during this session (mock only).
const linkedThisSession = new Set<string>();
export function markOverlapLinked(id: string) {
  linkedThisSession.add(id);
}

const RANGE_DAYS: Record<OverviewFilters['range'], number> = {
  '30d': 30,
  '90d': 90,
  '12m': 365,
  all: Infinity,
};
const OTHER = (b: BureauCode) => b !== 'RB' && b !== 'PGRC';

function matches(c: MockCase, f: OverviewFilters, asOf: number) {
  if (f.region && regionOf(c.institutionId) !== f.region) return false;
  if (
    f.bureau === 'OTHER' ? !OTHER(c.bureau) : f.bureau && c.bureau !== f.bureau
  )
    return false;
  return asOf - c.createdAt <= RANGE_DAYS[f.range] * DAY;
}

const monthEnds = (asOf: number) =>
  Array.from({ length: 12 }, (_, i) => {
    const d = new Date(asOf);
    const end = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 10 + i, 1) - 1;
    return Math.min(end, asOf);
  });

export function buildOverview(
  filters: OverviewFilters,
  asOfIso = MOCK_TODAY,
): DashboardOverview {
  const asOf = Date.parse(asOfIso);
  const prev = asOf - 30 * DAY;
  const cases = CASES.filter((c) => matches(c, filters, asOf));
  // History (sparklines, monthly trend) always spans 12 months: same region and bureau, any period.
  const history = CASES.filter((c) =>
    matches(c, { ...filters, range: 'all' }, asOf),
  );
  const ends = monthEnds(asOf);
  const inWindow = (at: number, to: number) => at > to - 30 * DAY && at <= to;

  // Stocks are counted at a moment; flows (received, transferred, disposed) over the 30 days before it.
  const measureOf = (
    cases: MockCase[],
  ): Record<OverviewCountKey, (t: number) => number> => ({
    received: (t) => cases.filter((c) => inWindow(c.createdAt, t)).length,
    transferred: (t) =>
      cases.filter((c) =>
        c.events.some((e) => e.status === 'TRANSFERRED' && inWindow(e.at, t)),
      ).length,
    disposed: (t) =>
      cases.filter((c) =>
        c.events.some((e) => e.status === 'DISPOSED' && inWindow(e.at, t)),
      ).length,
    pending: (t) => cases.filter((c) => isOpenAt(c, t)).length,
    underProcess: (t) =>
      cases.filter((c) => statusAt(c, t) === 'UNDER_PROCESS').length,
    escalated: (t) =>
      cases.filter((c) => statusAt(c, t) === 'ESCALATED').length,
    approachingDeadline: (t) =>
      cases.filter(
        (c) =>
          isOpenAt(c, t) &&
          c.dueAt >= t &&
          c.dueAt - t <= APPROACHING_HOURS * 3_600_000,
      ).length,
    overdue: (t) => cases.filter((c) => isOpenAt(c, t) && c.dueAt < t).length,
  });
  const measure = measureOf(cases);
  const past = measureOf(history);
  const counts = Object.fromEntries(
    (Object.keys(measure) as OverviewCountKey[]).map((k) => [
      k,
      {
        current: measure[k](asOf),
        lastMonth: measure[k](prev),
        trend: [...ends.slice(0, -1).map(past[k]), measure[k](asOf)],
      } satisfies CountWithPrevious,
    ]),
  ) as Record<OverviewCountKey, CountWithPrevious>;

  const monthlyTrend = ends.map((end) => {
    const d = new Date(end);
    const from = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
    const inMonth = (t: number) => t >= from && t <= end;
    return {
      month: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`,
      received: history.filter((c) => inMonth(c.createdAt)).length,
      disposed: history.filter((c) =>
        c.events.some((e) => e.status === 'DISPOSED' && inMonth(e.at)),
      ).length,
    };
  });

  const open = cases.filter((c) => isOpenAt(c, asOf));
  const bureauWorkload = mockBureaus
    .map(({ code }) => {
      const mine = open.filter((c) => c.bureau === code);
      return {
        bureau: code,
        pending: mine.length,
        underProcess: mine.filter((c) => statusAt(c, asOf) === 'UNDER_PROCESS')
          .length,
        overdue: mine.filter((c) => c.dueAt < asOf).length,
      };
    })
    .filter((b) => b.pending > 0);

  const regions = [...new Set(institutions.map((i) => regionOf(i.id)))].sort();
  const regionBreakdown = regions
    .map((region) => {
      const mine = open.filter((c) => regionOf(c.institutionId) === region);
      return {
        region,
        open: mine.length,
        overdue: mine.filter((c) => c.dueAt < asOf).length,
      };
    })
    .filter((r) => r.open > 0);

  const ageDays = (c: MockCase) => (asOf - c.createdAt) / DAY;
  const bucket = (lo: number, hi: number) =>
    open.filter((c) => ageDays(c) >= lo && ageDays(c) < hi).length;
  const ageing: DashboardOverview['ageing'] = {
    thresholdDays: DISPOSAL_DAYS,
    buckets: [
      { key: '0-15', label: '0–15 days', count: bucket(0, 16) },
      { key: '16-30', label: '16–30 days', count: bucket(16, 31) },
      { key: '31-60', label: '31–60 days', count: bucket(31, 61) },
      { key: '60+', label: '60+ days', count: bucket(61, Infinity) },
    ],
  };

  const visibleIds = new Set(cases.map((c) => c.id));
  const overlapAlerts = OVERLAPS.filter((o) =>
    o.cases.some((c) => visibleIds.has(c.id)),
  ).map((o) => {
    const copy = structuredClone(o);
    if (linkedThisSession.has(o.id)) copy.status = 'LINKED';
    return copy;
  });

  const multiBureauInstitutions = institutions
    .map((inst) => {
      const mine = open.filter((c) => c.institutionId === inst.id);
      return {
        institutionId: inst.id,
        name: inst.name,
        permanentId: inst.permanentId,
        region: regionOf(inst.id),
        bureaus: mockBureaus
          .map((b) => b.code)
          .filter((b) => mine.some((c) => c.bureau === b)),
        openCases: mine.length,
        overlaps: overlapAlerts.filter((o) => o.institution.id === inst.id)
          .length,
        lastActivityAt: new Date(
          Math.max(
            0,
            ...cases
              .filter((c) => c.institutionId === inst.id)
              .map(lastEventAt),
          ),
        ).toISOString(),
      };
    })
    .filter((i) => i.bureaus.length >= 2)
    .sort((a, b) => b.openCases - a.openCases);

  const instName = (id: string) =>
    institutions.find((i) => i.id === id)?.name ?? id;
  const verb: Record<string, string> = {
    RECEIVED: 'Received',
    TRANSFERRED: 'Transferred',
    UNDER_PROCESS: 'Taken up',
    ESCALATED: 'Escalated to bureau head',
    DISPOSED: 'Disposed',
  };
  const recentActivity: DashboardOverview['recentActivity'] = [
    ...cases.flatMap((c) =>
      [{ status: 'RECEIVED' as ComplaintStatus, at: c.createdAt }, ...c.events]
        .filter((e) => e.status !== 'UNDER_PROCESS' && e.at <= asOf)
        .map((e) => ({
          id: `${c.id}-${e.status}`,
          at: new Date(e.at).toISOString(),
          kind: e.status as
            'RECEIVED' | 'TRANSFERRED' | 'ESCALATED' | 'DISPOSED',
          caseId: c.id,
          originalId: c.originalId,
          bureau: c.bureau,
          text: `${verb[e.status]} · ${instName(c.institutionId)}`,
        })),
    ),
    ...overlapAlerts
      .filter((o) => o.status === 'LINKED')
      .map((o) => ({
        id: `${o.id}-LINKED`,
        at: o.updatedAt,
        kind: 'LINKED' as const,
        caseId: o.cases[0].id,
        originalId: o.cases.map((c) => c.originalId).join(' + '),
        bureau: o.bureaus.join(' + '),
        text: `Cases linked · ${o.institution.name}`,
      })),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 8);

  const deadlineItems = open
    .map((c) => ({
      caseId: c.id,
      originalId: c.originalId,
      institution: instName(c.institutionId),
      bureau: c.bureau,
      dueAt: new Date(c.dueAt).toISOString(),
      hoursLeft: Math.round((c.dueAt - asOf) / 3_600_000),
      state: (c.dueAt < asOf ? 'OVERDUE' : 'APPROACHING') as
        'OVERDUE' | 'APPROACHING',
    }))
    .filter((d) => d.state === 'OVERDUE' || d.hoursLeft <= APPROACHING_HOURS);
  const deadlineAlerts = {
    approachingWindowHours: APPROACHING_HOURS,
    // At most 10 per state: soonest due first, then most overdue first.
    items: [
      ...deadlineItems
        .filter((d) => d.state === 'APPROACHING')
        .sort((a, b) => a.hoursLeft - b.hoursLeft)
        .slice(0, 10),
      ...deadlineItems
        .filter((d) => d.state === 'OVERDUE')
        .sort((a, b) => a.hoursLeft - b.hoursLeft)
        .slice(0, 10),
    ],
  };

  return {
    scope: 'SYNTHETIC',
    asOf: asOfIso,
    filters,
    regions,
    counts,
    monthlyTrend,
    bureauWorkload,
    regionBreakdown,
    ageing,
    overlapAlerts,
    multiBureauInstitutions,
    recentActivity,
    deadlineAlerts,
  };
}

/** For consistency checks: the raw synthetic cases. */
export const __mockCaseCount = CASES.length;
