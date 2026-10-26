import { api, useMocks } from './client';
import { summary } from './mock';
import type { ApiSuccess, DashboardSummary } from '../types';
export async function getDashboardSummary(): Promise<DashboardSummary> {
  if (useMocks) return structuredClone(summary);
  return (await api.get<ApiSuccess<DashboardSummary>>('/dashboard/summary'))
    .data.data;
}
