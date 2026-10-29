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

const toQuery = (q: ComplaintListQuery) =>
  params({
    ...q,
    archived: q.archived === undefined ? undefined : String(q.archived),
  });

export const listComplaints = (q: ComplaintListQuery = {}) =>
  callPage<ComplaintListItem>(
    () =>
      api.get<ApiSuccess<{ items: ComplaintListItem[] }>>('/complaints', {
        params: toQuery(q),
      }),
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
