import { api } from './client';
import { callOne, params } from './request';
import * as mock from './synthetic/handlers/operations';
import type {
  DateRange,
  OverlapMonth,
  OverviewFilters,
  ReportsSummary,
} from '../types';

// GET /api/reports/summary: bureau-scoped aggregates, optional inclusive from/to on createdAt.

export const reportKeys = {
  all: ['reports'] as const,
  summary: (range: DateRange) => ['reports', 'summary', range] as const,
  overlaps: (f: OverviewFilters) => ['reports', 'overlaps', f] as const,
};

export const getReportsSummary = (range: DateRange = {}) =>
  callOne<ReportsSummary>(
    () => api.get('/reports/summary', { params: params(range) }),
    () => mock.reportsSummary(range),
  );

/** Proposed endpoint; synthetic until the API ships it (same filters as the dashboard overview). */
export const getOverlapTrend = (f: OverviewFilters) =>
  callOne<OverlapMonth[]>(
    () =>
      api.get('/reports/overlaps', {
        params: params({ region: f.region, bureau: f.bureau, range: f.range }),
      }),
    () => mock.overlapTrend(f),
  );
