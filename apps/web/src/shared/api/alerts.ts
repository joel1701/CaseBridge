import { api } from './client';
import { callOne, callPage, params } from './request';
import * as mock from './synthetic/handlers/operations';
import type { AlertItem, AlertListQuery } from '../types';

// GET/PATCH /api/alerts and POST /api/alerts/refresh. Read/resolved states are bureau-shared.

export const alertKeys = {
  all: ['alerts'] as const,
  list: (q: AlertListQuery) => ['alerts', 'list', q] as const,
  unread: ['alerts', 'unread'] as const,
};

export const listAlerts = (q: AlertListQuery = {}) =>
  callPage<AlertItem>(
    () =>
      api.get('/alerts', {
        params: params({
          ...q,
          unreadOnly:
            q.unreadOnly === undefined ? undefined : String(q.unreadOnly),
        }),
      }),
    () => mock.listAlerts(q),
  );

/** BUREAU_HEAD/ADMIN. */
export const refreshAlerts = () =>
  callOne<{ processed: number }>(
    () => api.post('/alerts/refresh', {}),
    () => mock.refreshAlerts(),
  );

export const updateAlert = (
  id: string,
  body: { read?: boolean; resolved?: boolean },
) =>
  callOne<AlertItem>(
    () => api.patch(`/alerts/${encodeURIComponent(id)}`, body),
    () => mock.updateAlert(id, body),
  );

export interface UnreadAlerts {
  items: AlertItem[];
  total: number;
}
/** Latest unread alerts for the header bell. */
export async function getUnreadAlerts(): Promise<UnreadAlerts> {
  const page = await listAlerts({ unreadOnly: true, pageSize: 5 });
  return { items: page.items, total: page.meta.total };
}
