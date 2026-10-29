import { api } from './client';
import { callOne, callPage, params } from './request';
import * as mock from './synthetic/handlers/operations';
import type {
  CoordinationDecision,
  CoordinationDecisionInput,
  Workspace,
  WorkspaceHistoryEntry,
  WorkspaceListQuery,
  WorkspaceUpdate,
} from '../types';

// Coordination decisions (POST /api/coordination) and coordination workspaces.

export const coordinationKeys = {
  all: ['coordination'] as const,
  workspaces: (q: WorkspaceListQuery = {}) =>
    ['coordination', 'workspaces', q] as const,
  workspace: (id: string) => ['coordination', 'workspace', id] as const,
  history: (id: string) => ['coordination', 'history', id] as const,
};

/** BUREAU_HEAD/ADMIN; rationale 1..2000; a confirmed link unless KEEP_SEPARATE (409 INVALID_STATE). */
export const recordCoordination = (body: CoordinationDecisionInput) =>
  callOne<CoordinationDecision>(
    () => api.post('/coordination', body),
    () => mock.recordCoordination(body),
  );

/** One workspace per confirmed link; 409 DUPLICATE_REFERENCE for a second. */
export const createWorkspace = (body: { caseLinkId: string }) =>
  callOne<Workspace>(
    () => api.post('/coordination/workspaces', body),
    () => mock.createWorkspace(body),
  );

export const listWorkspaces = (q: WorkspaceListQuery = {}) =>
  callPage<Workspace>(
    () => api.get('/coordination/workspaces', { params: params(q) }),
    () => mock.listWorkspaces(q),
  );

export const getWorkspace = (id: string) =>
  callOne<Workspace>(
    () => api.get(`/coordination/workspaces/${encodeURIComponent(id)}`),
    () => mock.getWorkspace(id),
  );

export const getWorkspaceHistory = (id: string) =>
  callPage<WorkspaceHistoryEntry>(
    () => api.get(`/coordination/workspaces/${encodeURIComponent(id)}/history`),
    () => mock.workspaceHistory(id),
  );

/** 409 STALE_COORDINATION / INVALID_STATE / CASE_CHANGED. */
export const updateWorkspace = (id: string, body: WorkspaceUpdate) =>
  callOne<Workspace>(
    () => api.patch(`/coordination/workspaces/${encodeURIComponent(id)}`, body),
    () => mock.updateWorkspace(id, body),
  );
