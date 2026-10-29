import { api } from './client';
import { callOne, callPage, params } from './request';
import * as mock from './synthetic/handlers/intelligence';
import type {
  AnalyzeResult,
  Graph,
  LinkReview,
  LinkReviewResult,
  LinkSummary,
  PageQuery,
} from '../types';

// The intelligence APIs: matching suggestions, link review and the institution graph.
// Every result is a recommendation; officers decide.

export const intelligenceKeys = {
  all: ['intelligence'] as const,
  links: (caseId: string, q: PageQuery = {}) =>
    ['intelligence', 'links', caseId, q] as const,
  graph: (institutionId: string) =>
    ['intelligence', 'graph', institutionId] as const,
};

/** 503 AI_UNAVAILABLE when the matching service is down. */
export const analyzeCase = (caseId: string) =>
  callOne<AnalyzeResult>(
    () => api.post(`/intelligence/analyze/${encodeURIComponent(caseId)}`, {}),
    () => mock.analyze(caseId),
  );

export const listLinks = (caseId: string, q: PageQuery = {}) =>
  callPage<LinkSummary>(
    () =>
      api.get(`/intelligence/links/${encodeURIComponent(caseId)}`, {
        params: params(q),
      }),
    () => mock.listLinks(caseId, q),
  );

/** BUREAU_HEAD/ADMIN; reason 1..2000; 409 STALE_REVIEW when expectedUpdatedAt is out of date. */
export const reviewLink = (id: string, body: LinkReview) =>
  callOne<LinkReviewResult>(
    () =>
      api.post(`/intelligence/links/${encodeURIComponent(id)}/review`, body),
    () => mock.review(id, body),
  );

export const getGraph = (institutionId: string) =>
  callOne<Graph>(
    () => api.get(`/intelligence/graph/${encodeURIComponent(institutionId)}`),
    () => mock.graph(institutionId),
  );
