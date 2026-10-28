import type { MatchComplaint, MatchExplanation } from './types.js';
import { defaultMatchingConfig, type MatchingConfig } from './config.js';
const stopWords = new Set(
  'the a an at of to for in on and or is are was were be been by from with this that students report institute college institution engineering'.split(
    ' ',
  ),
);
export function tokens(value: string): Set<string> {
  return new Set(
    (
      value
        .toLowerCase()
        .normalize('NFKC')
        .match(/[\p{L}\p{N}]+/gu) ?? []
    ).filter((word) => word.length > 2 && !stopWords.has(word)),
  );
}
export function jaccard(left: Set<string>, right: Set<string>): number {
  const union = new Set([...left, ...right]);
  return union.size
    ? [...left].filter((t) => right.has(t)).length / union.size
    : 0;
}
export function distinctPeriods(left: string, right: string): boolean {
  const a = new Set(
    left
      .match(/\b(?:19|20)\d{2}(?:[- ]?Q[1-4])?\b/gi)
      ?.map((x) => x.toUpperCase().replace(/[- ]/g, '')) ?? [],
  );
  const b = new Set(
    right
      .match(/\b(?:19|20)\d{2}(?:[- ]?Q[1-4])?\b/gi)
      ?.map((x) => x.toUpperCase().replace(/[- ]/g, '')) ?? [],
  );
  // A year-only scope can contain any quarter; only disjoint explicit periods conflict.
  return (
    a.size > 0 &&
    b.size > 0 &&
    ![...a].some((x) =>
      [...b].some(
        (y) =>
          x === y ||
          (x.slice(0, 4) === y.slice(0, 4) &&
            (x.length === 4 || y.length === 4)),
      ),
    )
  );
}
function category(value: string) {
  const normalized = value.trim().toUpperCase().replace(/\s+/g, '_');
  return ['UNKNOWN', 'OTHER', 'UNCLASSIFIED', ''].includes(normalized)
    ? null
    : normalized;
}
export function scoreMatch(
  source: MatchComplaint,
  target: MatchComplaint,
  semanticSimilarity: number,
  config: MatchingConfig = defaultMatchingConfig,
) {
  if (
    !Number.isFinite(semanticSimilarity) ||
    semanticSimilarity < -1 ||
    semanticSimilarity > 1
  )
    throw new Error('Invalid cosine similarity');
  const institutionMatch = source.institutionId === target.institutionId;
  const a = category(source.category),
    b = category(target.category);
  const categoryMatch = a !== null && a === b;
  const categoryConflict = a !== null && b !== null && a !== b;
  const contextOverlap = jaccard(
    tokens(source.description),
    tokens(target.description),
  );
  const periodConflict = distinctPeriods(
    source.description,
    target.description,
  );
  const components = {
    institution: institutionMatch ? config.weights.institution : 0,
    semantic: Math.max(0, semanticSimilarity) * config.weights.semantic,
    category: categoryMatch ? config.weights.category : 0,
    context: contextOverlap * config.weights.context,
  };
  const score = Object.values(components).reduce(
    (sum, value) => sum + value,
    0,
  );
  const suggested =
    source.id !== target.id &&
    institutionMatch &&
    !categoryConflict &&
    !periodConflict &&
    semanticSimilarity >= config.semanticThreshold &&
    score >= config.threshold;
  const reasons = [
    institutionMatch
      ? 'Same registered institution'
      : 'Different registered institutions',
    categoryMatch
      ? 'Same recorded allegation category'
      : categoryConflict
        ? 'Different recorded allegation categories'
        : 'Category is unknown',
    semanticSimilarity >= config.semanticThreshold
      ? 'Text similarity meets configured threshold'
      : 'Text similarity below configured threshold',
    ...(periodConflict ? ['Explicit complaint periods differ'] : []),
  ];
  const explanation: MatchExplanation = {
    institutionMatch,
    categoryMatch,
    categoryConflict,
    semanticSimilarity,
    contextOverlap,
    periodConflict,
    reasons,
    components,
    threshold: config.threshold,
    semanticThreshold: config.semanticThreshold,
    ruleVersion: 'matching-v1',
    scoreKind: 'HEURISTIC_RANKING_NOT_PROBABILITY',
  };
  return { score, suggested, explanation };
}
