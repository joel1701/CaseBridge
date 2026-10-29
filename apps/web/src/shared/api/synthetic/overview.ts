// The dashboard overview, computed from the shared synthetic store (see store.ts).
import {
  APPROACHING_HOURS,
  type BaseCase,
  DAY,
  DISPOSAL_DAYS,
  institutions,
  iso,
  isOpenAt,
  lastEventAt,
  mockBureaus,
  regionOf,
  statusAt,
} from './core';
import {
  cases as storeCases,
  now,
  overlapAlerts as liveOverlaps,
} from './store';
import type {
  BureauCode,
  ComplaintStatus,
  CountWithPrevious,
  DashboardOverview,
  OverviewCountKey,
  OverviewFilters,
} from '../../types';

const RANGE_DAYS: Record<OverviewFilters['range'], number> = {
  '30d': 30,
  '90d': 90,
  '12m': 365,
  all: Infinity,
};
const OTHER = (b: BureauCode) => b !== 'RB' && b !== 'PGRC';

function matches(c: BaseCase, f: OverviewFilters, asOf: number) {
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
  asOfIso = iso(now()),
): DashboardOverview {
  const asOf = Date.parse(asOfIso);
  const prev = asOf - 30 * DAY;
  const cases = storeCases.filter((c) => matches(c, filters, asOf));
  // History (sparklines, monthly trend) always spans 12 months: same region and bureau, any period.
  const history = storeCases.filter((c) =>
    matches(c, { ...filters, range: 'all' }, asOf),
  );
  const ends = monthEnds(asOf);
  const inWindow = (at: number, to: number) => at > to - 30 * DAY && at <= to;

  // Stocks are counted at a moment; flows (received, transferred, disposed) over the 30 days before it.
  const measureOf = (
    cases: BaseCase[],
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

  const ageDays = (c: BaseCase) => (asOf - c.createdAt) / DAY;
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
  const overlapAlerts = liveOverlaps().filter((o) =>
    o.cases.some((c) => visibleIds.has(c.id)),
  );

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
