import { api } from './client';
import { callOne } from './request';
import * as mock from './synthetic/handlers/operations';
import type {
  Action,
  ActionCreate,
  ActionDraft,
  ActionPreview,
} from '../types';

// The Action Firewall: preview a proposed action for overlaps, then create it.

export const actionKeys = {
  all: ['actions'] as const,
};

/** Read-only check; produces no approval. */
export const previewAction = (draft: ActionDraft) =>
  callOne<ActionPreview>(
    () => api.post('/actions/preview', draft),
    () => mock.previewAction(draft),
  );

/** 409 REVIEW_REQUIRED when warnings exist and no overrideReason (1..2000) is given. */
export const createAction = (body: ActionCreate) =>
  callOne<Action>(
    () => api.post('/actions', body),
    () => mock.createAction(body),
  );
