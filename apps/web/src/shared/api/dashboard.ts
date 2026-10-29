import { isAxiosError } from 'axios';
import { api, useMocks } from './client';
import { summary } from './mock';
import { buildOverview, markOverlapLinked } from './overviewMock';
import type {
  ApiSuccess,
  DashboardOverview,
  DashboardSummary,
  OverlapAlert,
  OverviewFilters,
} from '../types';
export async function getDashboardSummary(): Promise<DashboardSummary> {
  if (useMocks) return structuredClone(summary);
  return (await api.get<ApiSuccess<DashboardSummary>>('/dashboard/summary'))
    .data.data;
}

const RANGE_DAYS = { '30d': 30, '90d': 90, '12m': 365 } as const;

// Coordination overview. GET /api/dashboard/overview is proposed and not built yet:
// until it exists the whole response comes from the synthetic mock (scope SYNTHETIC),
// never a mix of real and synthetic numbers.
export async function getDashboardOverview(
  filters: OverviewFilters,
): Promise<DashboardOverview> {
  if (useMocks) {
    await new Promise((r) => setTimeout(r, 400));
    return buildOverview(filters);
  }
  const to = new Date();
  const from =
    filters.range === 'all'
      ? undefined
      : new Date(to.getTime() - RANGE_DAYS[filters.range] * 86_400_000);
  try {
    const res = await api.get<ApiSuccess<DashboardOverview>>(
      '/dashboard/overview',
      {
        params: {
          region: filters.region,
          bureau: filters.bureau,
          from: from?.toISOString(),
          to: from ? to.toISOString() : undefined,
        },
      },
    );
    return res.data.data;
  } catch (err) {
    const status = isAxiosError(err) ? err.response?.status : undefined;
    if (status === 404 || status === 501) return buildOverview(filters);
    throw err;
  }
}

// "Link cases": confirms the suggested relationship. On synthetic data nothing is sent.
export async function linkOverlap(
  alert: OverlapAlert,
  scope: DashboardOverview['scope'],
): Promise<void> {
  if (scope === 'SYNTHETIC') {
    await new Promise((r) => setTimeout(r, 300));
    markOverlapLinked(alert.id);
    return;
  }
  await api.post(`/intelligence/links/${alert.linkId}/review`, {
    status: 'CONFIRMED',
    reason: 'Linked from coordination overview',
    expectedUpdatedAt: alert.updatedAt,
  });
}
