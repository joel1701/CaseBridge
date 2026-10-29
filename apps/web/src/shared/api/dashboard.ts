import { api, useMocks } from './client';
import { reviewLink } from './intelligence';
import { callOne } from './request';
import { actions, cases, links } from './synthetic/store';
import { buildOverview } from './synthetic/overview';
import type {
  ApiSuccess,
  DashboardOverview,
  DashboardSummary,
  OverlapAlert,
  OverviewFilters,
} from '../types';

export async function getDashboardSummary(): Promise<DashboardSummary> {
  if (useMocks)
    return {
      totalComplaints: cases.length,
      pendingOverlapReviews: links.filter((l) => l.status === 'SUGGESTED')
        .length,
      activeActions: actions.filter(
        (a) => a.status === 'PLANNED' || a.status === 'IN_PROGRESS',
      ).length,
      scope: 'SYNTHETIC',
    };
  return (await api.get<ApiSuccess<DashboardSummary>>('/dashboard/summary'))
    .data.data;
}

const RANGE_DAYS = { '30d': 30, '90d': 90, '12m': 365 } as const;

// Coordination overview. GET /api/dashboard/overview is proposed and not built yet:
// until it exists the whole response comes from the synthetic store (scope SYNTHETIC),
// never a mix of real and synthetic numbers.
export async function getDashboardOverview(
  filters: OverviewFilters,
): Promise<DashboardOverview> {
  const to = new Date();
  const from =
    filters.range === 'all'
      ? undefined
      : new Date(to.getTime() - RANGE_DAYS[filters.range] * 86_400_000);
  const { data } = await callOne<DashboardOverview>(
    () =>
      api.get('/dashboard/overview', {
        params: {
          region: filters.region,
          bureau: filters.bureau,
          from: from?.toISOString(),
          to: from ? to.toISOString() : undefined,
        },
      }),
    () => buildOverview(filters),
  );
  return data;
}

// "Link cases": confirms every pairwise link of the overlap through the review API
// (synthetic data updates the shared store, so every page sees the change).
export async function linkOverlap(alert: OverlapAlert): Promise<void> {
  for (const id of alert.linkIds ?? [alert.linkId]) {
    const current = links.find((l) => l.id === id);
    await reviewLink(id, {
      status: 'CONFIRMED',
      reason: 'Linked from coordination overview',
      expectedUpdatedAt: current
        ? new Date(current.updatedAt).toISOString()
        : alert.updatedAt,
    });
  }
}
