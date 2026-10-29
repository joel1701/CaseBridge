import { api } from './client';
import { callOne, params } from './request';
import * as mock from './synthetic/handlers/operations';
import type { DateRange, ReportsSummary } from '../types';

// GET /api/reports/summary: bureau-scoped aggregates, optional inclusive from/to on createdAt.

export const reportKeys = {
  all: ['reports'] as const,
  summary: (range: DateRange) => ['reports', 'summary', range] as const,
};

export const getReportsSummary = (range: DateRange = {}) =>
  callOne<ReportsSummary>(
    () => api.get('/reports/summary', { params: params(range) }),
    () => mock.reportsSummary(range),
  );
