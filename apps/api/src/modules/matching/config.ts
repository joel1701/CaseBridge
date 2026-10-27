import { z } from 'zod';
export const matchingConfigSchema = z
  .object({
    threshold: z.coerce.number().min(0).max(1).default(0.55),
    semanticThreshold: z.coerce.number().min(0).max(1).default(0.4),
    candidateLimit: z.coerce.number().int().min(1).max(100).default(100),
    weights: z
      .object({
        institution: z.number().nonnegative(),
        semantic: z.number().nonnegative(),
        category: z.number().nonnegative(),
        context: z.number().nonnegative(),
      })
      .default({
        institution: 0.15,
        semantic: 0.6,
        category: 0.15,
        context: 0.1,
      }),
  })
  .refine(
    (value) =>
      Math.abs(Object.values(value.weights).reduce((a, b) => a + b, 0) - 1) <
      1e-9,
    'Weights must sum to one',
  );
export type MatchingConfig = z.infer<typeof matchingConfigSchema>;
export const defaultMatchingConfig = matchingConfigSchema.parse({});
export function matchingConfig(): MatchingConfig {
  return matchingConfigSchema.parse({
    threshold: process.env.MATCH_THRESHOLD,
    semanticThreshold: process.env.MATCH_SEMANTIC_THRESHOLD,
    candidateLimit: process.env.MATCH_CANDIDATE_LIMIT,
  });
}
