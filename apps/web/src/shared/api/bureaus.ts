import { api } from './client';
import { toQuery, withView } from './complaints';
import { callPage, params } from './request';
import * as mock from './synthetic/handlers/directory';
import type {
  Bureau,
  ComplaintListItem,
  ComplaintListQuery,
  Officer,
  PageQuery,
} from '../types';

// GET /api/bureaus, /api/bureaus/:id/officers and /api/bureaus/:id/queue.

export const bureauKeys = {
  all: ['bureaus'] as const,
  list: () => ['bureaus', 'list'] as const,
  officers: (id: string, q: PageQuery = {}) =>
    ['bureaus', 'officers', id, q] as const,
  queue: (id: string, q: ComplaintListQuery = {}) =>
    ['bureaus', 'queue', id, q] as const,
};

export const listBureaus = () =>
  callPage<Bureau>(
    () => api.get('/bureaus'),
    () => mock.listBureaus(),
  );

/** Own bureau or ADMIN. Active users only; never email or hash. */
export const listOfficers = (bureauId: string, q: PageQuery = {}) =>
  callPage<Officer>(
    () =>
      api.get(`/bureaus/${encodeURIComponent(bureauId)}/officers`, {
        params: params(q),
      }),
    () => mock.listOfficers(bureauId, q),
  );

/** Complaint-list filters with the bureau forced by the path. */
export const getBureauQueue = (bureauId: string, q: ComplaintListQuery = {}) =>
  callPage<ComplaintListItem>(
    () =>
      withView(q, (query) =>
        api.get(`/bureaus/${encodeURIComponent(bureauId)}/queue`, {
          params: toQuery({ ...query, bureauId: undefined }),
        }),
      ),
    () => mock.bureauQueue(bureauId, q),
  );
