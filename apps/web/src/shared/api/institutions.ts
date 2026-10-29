import { api } from './client';
import { callOne, callPage, params } from './request';
import * as mock from './synthetic/handlers/directory';
import type {
  InstitutionProfile,
  InstitutionSummary,
  PageQuery,
} from '../types';

// GET /api/institutions and /api/institutions/:id (shared reference records).

export const institutionKeys = {
  all: ['institutions'] as const,
  list: (q: PageQuery & { q?: string }) => ['institutions', 'list', q] as const,
  detail: (id: string) => ['institutions', 'detail', id] as const,
};

export const listInstitutions = (q: PageQuery & { q?: string } = {}) =>
  callPage<InstitutionSummary>(
    () => api.get('/institutions', { params: params(q) }),
    () => mock.listInstitutions(q),
  );

/** Profile with region, scoped byStatus/byBureau groups and the latest 20 complaints. */
export const getInstitution = (id: string) =>
  callOne<InstitutionProfile>(
    () => api.get(`/institutions/${encodeURIComponent(id)}`),
    () => mock.getInstitution(id),
  );
