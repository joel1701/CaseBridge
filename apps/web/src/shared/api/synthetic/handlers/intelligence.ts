import { iso } from '../core';
import {
  actions,
  advance,
  caseById,
  cases,
  headOf,
  institutionById,
  linkById,
  links,
  now,
} from '../store';
import { conflict, done, notFound, paginate, reasonField } from './util';
import type {
  AnalyzeResult,
  Graph,
  LinkReview,
  LinkReviewResult,
  LinkSummary,
  PageQuery,
} from '../../../types';

const MODEL = 'synthetic-mock:not-a-model';
const mineOf = (caseId: string) =>
  links.filter(
    (l) => l.sourceComplaintId === caseId || l.targetComplaintId === caseId,
  );
const otherOf = (l: (typeof links)[number], caseId: string) =>
  l.sourceComplaintId === caseId ? l.targetComplaintId : l.sourceComplaintId;

export function analyze(caseId: string): AnalyzeResult {
  const c = caseById(caseId);
  if (!c) notFound('Complaint');
  return {
    caseId,
    suggestions: mineOf(caseId).map((l) => {
      const other = caseById(otherOf(l, caseId))!;
      return {
        id: l.id,
        status: l.status,
        score: l.score,
        explanation: {
          institutionMatch: other.institutionId === c.institutionId,
          categoryMatch: other.category === c.category,
          semanticSimilarity: l.score,
          reasons: l.reasons,
        },
        modelVersion: MODEL,
      };
    }),
    recommendationOnly: true,
  };
}

export function listLinks(caseId: string, q: PageQuery = {}) {
  if (!caseById(caseId)) notFound('Complaint');
  const rows: LinkSummary[] = mineOf(caseId).map((l) => {
    const otherId = otherOf(l, caseId);
    return {
      id: l.id,
      status: l.status,
      score: l.score,
      // Synthetic scope is global, so the counterpart is never restricted here.
      otherComplaint: {
        id: otherId,
        bureauCode: caseById(otherId)!.bureau,
        restricted: false,
      },
      explanation: { reasons: l.reasons },
      updatedAt: iso(l.updatedAt),
    };
  });
  return paginate(rows, q);
}

export function review(id: string, body: LinkReview): LinkReviewResult {
  const l = linkById(id);
  if (!l) notFound('Link');
  const errs: { path: string[]; message: string }[] = [];
  if (body.status !== 'CONFIRMED' && body.status !== 'REJECTED')
    errs.push({ path: ['status'], message: 'Must be CONFIRMED or REJECTED' });
  reasonField(errs, 'reason', body.reason);
  if (!body.expectedUpdatedAt)
    errs.push({ path: ['expectedUpdatedAt'], message: 'Required' });
  done(errs);
  if (Date.parse(body.expectedUpdatedAt) !== l.updatedAt)
    conflict('STALE_REVIEW', 'Link changed since it was read');
  const t = advance();
  const reviewer =
    headOf(caseById(l.sourceComplaintId)!.bureau)?.id ?? 'demo-user-pgrc-head';
  Object.assign(l, {
    status: body.status,
    underReview: false,
    reviewedById: reviewer,
    reviewReason: body.reason.trim(),
    reviewedAt: t,
    updatedAt: t,
  });
  return {
    id: l.id,
    status: l.status,
    reviewedById: reviewer,
    reviewReason: l.reviewReason!,
    reviewedAt: iso(t),
    updatedAt: iso(t),
  };
}

/** Bounded graph: the institution, its bureaus, recent or linked cases (max 40) and their actions. */
export function graph(institutionId: string): Graph {
  const inst = institutionById(institutionId);
  if (!inst) notFound('Institution');
  const linked = new Set(
    links.flatMap((l) => [l.sourceComplaintId, l.targetComplaintId]),
  );
  const recent = now() - 120 * 86_400_000;
  const chosen = cases
    .filter(
      (c) =>
        c.institutionId === institutionId &&
        (linked.has(c.id) || c.createdAt > recent),
    )
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 40);
  const ids = new Set(chosen.map((c) => c.id));
  const bureaus = [...new Set(chosen.map((c) => c.bureau))];
  const acts = actions.filter((a) => ids.has(a.complaintId));
  return {
    nodes: [
      { id: inst.id, type: 'institution', label: inst.name },
      ...bureaus.map((b) => ({
        id: `bureau-${b}`,
        type: 'bureau' as const,
        label: b,
      })),
      ...chosen.map((c) => ({
        id: c.id,
        type: 'complaint' as const,
        label: c.originalId,
      })),
      ...acts.map((a) => ({
        id: a.id,
        type: 'action' as const,
        label: a.type.replace('_', ' ').toLowerCase(),
      })),
    ],
    edges: [
      ...chosen.map((c) => ({
        id: `e-has-${c.id}`,
        source: inst.id,
        target: c.id,
        type: 'HAS_COMPLAINT' as const,
      })),
      ...chosen.map((c) => ({
        id: `e-own-${c.id}`,
        source: c.id,
        target: `bureau-${c.bureau}`,
        type: 'OWNED_BY' as const,
      })),
      ...acts.map((a) => ({
        id: `e-act-${a.id}`,
        source: a.complaintId,
        target: a.id,
        type: 'HAS_ACTION' as const,
      })),
      ...links
        .filter(
          (l) =>
            l.status !== 'REJECTED' &&
            ids.has(l.sourceComplaintId) &&
            ids.has(l.targetComplaintId),
        )
        .map((l) => ({
          id: `e-rel-${l.id}`,
          source: l.sourceComplaintId,
          target: l.targetComplaintId,
          type: 'RELATED_TO' as const,
        })),
    ],
  };
}
