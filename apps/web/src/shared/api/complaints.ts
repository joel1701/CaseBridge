import { api } from './client';
import { callOne, callPage, params } from './request';
import * as mock from './synthetic/handlers/complaints';
import type {
  Action,
  ApiSuccess,
  ComplaintArchive,
  ComplaintCreate,
  ComplaintDetail,
  ComplaintListItem,
  ComplaintListQuery,
  ComplaintUpdate,
  ImportResult,
  PageQuery,
  TimelineEntry,
} from '../types';

// GET/POST/PATCH/DELETE /api/complaints… (API_CONTRACT.md, "Complaint additions").

export const complaintKeys = {
  all: ['complaints'] as const,
  list: (q: ComplaintListQuery) => ['complaints', 'list', q] as const,
  detail: (id: string) => ['complaints', 'detail', id] as const,
  timeline: (id: string, q: PageQuery = {}) =>
    ['complaints', 'timeline', id, q] as const,
  actions: (id: string, q: PageQuery = {}) =>
    ['complaints', 'actions', id, q] as const,
};

export const toQuery = (q: ComplaintListQuery) =>
  params({
    ...q,
    view: undefined,
    archived: q.archived === undefined ? undefined : String(q.archived),
  });

/**
 * The API has no parameter for the frontend views (open, overdue, due soon, unassigned).
 * Against the real API a view fetches the first 100 matches by due date and filters them
 * in the browser, so very large result sets are truncated; synthetic data filters fully.
 */
export async function withView(
  q: ComplaintListQuery,
  fetchPage: (
    q: ComplaintListQuery,
  ) => Promise<{ data: ApiSuccess<{ items: ComplaintListItem[] }> }>,
) {
  if (!q.view) return fetchPage(q);
  const res = await fetchPage({
    ...q,
    page: 1,
    pageSize: 100,
    sortBy: 'dueAt',
    sortOrder: 'asc',
  });
  const all = res.data.data.items.filter((c) =>
    mock.matchesView(c, q.view, Date.now()),
  );
  const page = q.page ?? 1;
  const pageSize = q.pageSize ?? 20;
  return {
    data: {
      ...res.data,
      data: { items: all.slice((page - 1) * pageSize, page * pageSize) },
      meta: { page, pageSize, total: all.length },
    },
  };
}

export const listComplaints = (q: ComplaintListQuery = {}) =>
  callPage<ComplaintListItem>(
    () =>
      withView(q, (query) =>
        api.get<ApiSuccess<{ items: ComplaintListItem[] }>>('/complaints', {
          params: toQuery(query),
        }),
      ),
    () => mock.list(q),
  );

export const getComplaint = (id: string) =>
  callOne<ComplaintDetail>(
    () => api.get(`/complaints/${encodeURIComponent(id)}`),
    () => mock.get(id),
  );

export const createComplaint = (body: ComplaintCreate) =>
  callOne<ComplaintDetail>(
    () => api.post('/complaints', body),
    () => mock.create(body),
  );

export const importComplaints = (items: ComplaintCreate[]) =>
  callOne<ImportResult>(
    () => api.post('/complaints/import', { items }),
    () => mock.importRows(items),
  );

export const importComplaintsCsv = (csv: string) =>
  callOne<ImportResult>(
    () => api.post('/complaints/import/csv', { csv }),
    () => mock.importCsv(csv),
  );

/** Needs expectedVersion and a reason (1..2000); 409 STALE_COMPLAINT when out of date. */
export const updateComplaint = (id: string, body: ComplaintUpdate) =>
  callOne<ComplaintDetail>(
    () => api.patch(`/complaints/${encodeURIComponent(id)}`, body),
    () => mock.update(id, body),
  );

/** ADMIN only; DISPOSED cases only (409 INVALID_STATE otherwise). Never a hard delete. */
export const archiveComplaint = (id: string, body: ComplaintArchive) =>
  callOne<ComplaintDetail>(
    () => api.delete(`/complaints/${encodeURIComponent(id)}`, { data: body }),
    () => mock.archive(id, body),
  );

export const getComplaintTimeline = (id: string, q: PageQuery = {}) =>
  callPage<TimelineEntry>(
    () =>
      api.get(`/complaints/${encodeURIComponent(id)}/timeline`, {
        params: params(q),
      }),
    () => mock.timeline(id, q),
  );

export const getComplaintActions = (id: string, q: PageQuery = {}) =>
  callPage<Action>(
    () =>
      api.get(`/complaints/${encodeURIComponent(id)}/actions`, {
        params: params(q),
      }),
    () => mock.actionsOf(id, q),
  );
