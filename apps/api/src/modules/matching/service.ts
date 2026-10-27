import type { Principal } from '../../middleware/auth.js';
import { matchingConfig, type MatchingConfig } from './config.js';
import type { SimilarityProvider } from './types.js';
import type { MatchingRepository } from './repository.js';
import { scoreMatch } from './scoring.js';
export class MatchingService {
  constructor(
    private repository: MatchingRepository,
    private ai: SimilarityProvider,
    private config: MatchingConfig = matchingConfig(),
  ) {}
  async analyze(principal: Principal, id: string) {
    const source = await this.repository.source(principal, id);
    const found = await this.repository.candidates(
      source,
      this.config.candidateLimit + 1,
    );
    const candidates = found.slice(0, this.config.candidateLimit);
    if (!candidates.length)
      return {
        caseId: id,
        suggestions: [],
        recommendationOnly: true,
        candidatesEvaluated: 0,
        truncated: false,
      };
    const comparison = await this.ai.compare(source, candidates);
    const byId = new Map(
      comparison.results.map((result) => [result.id, result.cosineSimilarity]),
    );
    const suggestions = candidates.flatMap((target) => {
      const similarity = byId.get(target.id);
      if (similarity === undefined)
        throw new Error('AI adapter omitted candidate');
      const scored = scoreMatch(source, target, similarity, this.config);
      return scored.suggested
        ? [{ target, score: scored.score, explanation: scored.explanation }]
        : [];
    });
    const saved = await this.repository.save(
      principal,
      source,
      suggestions,
      comparison.modelVersion,
    );
    return {
      caseId: id,
      suggestions: saved,
      recommendationOnly: true,
      candidatesEvaluated: candidates.length,
      truncated: found.length > candidates.length,
    };
  }
}
