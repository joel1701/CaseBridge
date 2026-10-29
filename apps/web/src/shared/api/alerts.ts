import { api, useMocks } from './client';
import { alerts } from './mock';
import type { Alert, ApiSuccess } from '../types';

export interface UnreadAlerts {
  items: Alert[];
  total: number;
}

// Latest unread alerts for the header bell (GET /api/alerts?unreadOnly=true).
export async function getUnreadAlerts(): Promise<UnreadAlerts> {
  if (useMocks) {
    const items = structuredClone(alerts).filter((a) => !a.readAt);
    return { items, total: items.length };
  }
  const res = await api.get<ApiSuccess<{ items: Alert[] }>>('/alerts', {
    params: { unreadOnly: true, pageSize: 5 },
  });
  const items = res.data.data.items;
  return { items, total: res.data.meta?.total ?? items.length };
}
