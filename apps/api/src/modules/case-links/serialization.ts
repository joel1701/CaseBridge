import type { Prisma } from '../../generated/prisma/client.js';
/** Never forward arbitrary explanation JSON across a bureau boundary. */
export function permittedExplanation(
  value: Prisma.JsonValue,
  restricted: boolean,
) {
  if (!restricted) return value;
  const record =
    value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  return {
    reasons: [
      'Potential relationship at the same registered institution; review authorized evidence before deciding.',
    ],
    ...(typeof record.institutionMatch === 'boolean'
      ? { institutionMatch: record.institutionMatch }
      : {}),
    ...(typeof record.categoryMatch === 'boolean'
      ? { categoryMatch: record.categoryMatch }
      : {}),
    ...(typeof record.semanticSimilarity === 'number' &&
    Number.isFinite(record.semanticSimilarity)
      ? { semanticSimilarity: record.semanticSimilarity }
      : {}),
    scoreKind: 'HEURISTIC_RANKING_NOT_PROBABILITY',
  };
}
