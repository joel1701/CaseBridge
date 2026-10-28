/** Run from repository root: npx tsx apps/api/src/modules/matching/evaluate.ts */
import { readFile, writeFile } from 'node:fs/promises';
import { parse } from 'csv-parse/sync';
import { z } from 'zod';
import { scoreMatch } from './scoring.js';
import { defaultMatchingConfig, type MatchingConfig } from './config.js';
import type { MatchComplaint } from './types.js';
const root = new URL('../../../../../', import.meta.url);
const raw = await readFile(new URL('data/sample_complaints.csv', root), 'utf8');
const rows = z
  .array(
    z.object({
      id: z.string(),
      institutionId: z.string(),
      bureauId: z.string(),
      title: z.string(),
      description: z.string(),
      category: z.string(),
    }),
  )
  .parse(parse(raw, { columns: true, skip_empty_lines: true }));
const records = new Map(
  rows.map((r) => [
    r.id,
    { ...r, updatedAt: new Date(0) } satisfies MatchComplaint,
  ]),
);
const measurements = z
  .object({
    mode: z.literal('transformer'),
    modelVersion: z.string(),
    pairs: z.array(
      z.object({
        sourceComplaintId: z.string(),
        targetComplaintId: z.string(),
        related: z.boolean(),
        semanticSimilarity: z.number().min(-1).max(1),
      }),
    ),
  })
  .parse(
    JSON.parse(
      await readFile(new URL('apps/ai/evaluation-local.json', root), 'utf8'),
    ),
  );
function evaluate(config: MatchingConfig) {
  const predictions = measurements.pairs.map((p) => {
    const left = records.get(p.sourceComplaintId)!,
      right = records.get(p.targetComplaintId)!;
    const result = scoreMatch(left, right, p.semanticSimilarity, config);
    return {
      ...p,
      predicted: result.suggested,
      rankingScore: result.score,
      reasons: result.explanation.reasons,
    };
  });
  const tp = predictions.filter((p) => p.related && p.predicted).length,
    fp = predictions.filter((p) => !p.related && p.predicted).length,
    fn = predictions.filter((p) => p.related && !p.predicted).length,
    tn = predictions.filter((p) => !p.related && !p.predicted).length;
  const precision = tp + fp ? tp / (tp + fp) : 0,
    recall = tp + fn ? tp / (tp + fn) : 0;
  return {
    config,
    confusion: { tp, fp, fn, tn },
    precision,
    recall,
    f1:
      precision + recall ? (2 * precision * recall) / (precision + recall) : 0,
    falsePositives: predictions.filter((p) => p.predicted && !p.related),
    predictions,
  };
}
const report = {
  modelVersion: measurements.modelVersion,
  mode: measurements.mode,
  dataset: 'data/known_case_pairs.json',
  caveat:
    'Seven synthetic development pairs, with repeated paraphrases. Defaults were selected after inspecting these pairs. This is an in-sample smoke evaluation, not held-out accuracy or statistical confidence. Zero predicted positives uses precision=0.',
  baseline: evaluate({
    ...defaultMatchingConfig,
    threshold: 0.66,
    semanticThreshold: 0.55,
  }),
  current: evaluate(defaultMatchingConfig),
};
await writeFile(
  new URL('evaluation-results.json', import.meta.url),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(
  JSON.stringify(
    {
      model: report.modelVersion,
      baseline: report.baseline.confusion,
      current: report.current.confusion,
      precision: report.current.precision,
      recall: report.current.recall,
      f1: report.current.f1,
      caveat: report.caveat,
    },
    null,
    2,
  ),
);
