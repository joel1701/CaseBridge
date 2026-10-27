import { z } from 'zod';
import { env } from '../../lib/env.js';
import { AppError } from '../../lib/errors.js';
import type {
  MatchComplaint,
  SimilarityProvider,
  SemanticResult,
} from './types.js';
const responseSchema = z.object({
  success: z.literal(true),
  data: z
    .array(
      z.object({ id: z.string(), cosineSimilarity: z.number().min(-1).max(1) }),
    )
    .max(100),
  modelVersion: z.string().min(1).max(300),
  mode: z.literal('transformer'),
  recommendationOnly: z.literal(true),
});
export class HttpSimilarityProvider implements SimilarityProvider {
  constructor(private fetcher: typeof fetch = fetch) {}
  async compare(source: MatchComplaint, candidates: MatchComplaint[]) {
    const secret = process.env.AI_SERVICE_TOKEN;
    if (!secret || secret.length < 32)
      throw new AppError(
        503,
        'AI_UNAVAILABLE',
        'AI service credentials are not configured',
      );
    const timeout = z.coerce
      .number()
      .int()
      .min(100)
      .max(120000)
      .parse(process.env.AI_TIMEOUT_MS ?? 30000);
    const results: SemanticResult[] = [];
    let modelVersion = '';
    const deadline = Date.now() + timeout;
    try {
      // Ten maximum-length pairs fit the service's 200k-character budget.
      for (let i = 0; i < candidates.length; i += 10) {
        const batch = candidates.slice(i, i + 10);
        const remaining = deadline - Date.now();
        if (remaining <= 0) throw new Error('Analysis timed out');
        const response = await this.fetcher(
          new URL('/v1/similarities', env.AI_SERVICE_URL),
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${secret}`,
            },
            body: JSON.stringify({
              pairs: batch.map((candidate) => ({
                id: candidate.id,
                left: source.description,
                right: candidate.description,
              })),
            }),
            signal: AbortSignal.timeout(remaining),
            redirect: 'error',
          },
        );
        if (!response.ok) throw new Error('AI service error');
        const parsed = responseSchema.parse(await response.json());
        if (
          parsed.data.length !== batch.length ||
          new Set(parsed.data.map((item) => item.id)).size !== batch.length ||
          parsed.data.some((item) => !batch.some((c) => c.id === item.id))
        )
          throw new Error('Invalid comparison identifiers');
        if (modelVersion && modelVersion !== parsed.modelVersion)
          throw new Error('Model changed during analysis');
        modelVersion = parsed.modelVersion;
        results.push(...parsed.data);
      }
      return { results, modelVersion };
    } catch {
      throw new AppError(
        503,
        'AI_UNAVAILABLE',
        'Semantic comparison unavailable; no analysis was saved',
      );
    }
  }
}
