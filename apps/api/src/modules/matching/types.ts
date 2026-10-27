export interface MatchComplaint {
  id: string;
  institutionId: string;
  bureauId: string;
  title: string;
  description: string;
  category: string;
  updatedAt: Date;
}
export interface SemanticResult {
  id: string;
  cosineSimilarity: number;
}
export interface SimilarityBatch {
  results: SemanticResult[];
  modelVersion: string;
}
export interface SimilarityProvider {
  compare(
    source: MatchComplaint,
    candidates: MatchComplaint[],
  ): Promise<SimilarityBatch>;
}
export interface MatchExplanation {
  institutionMatch: boolean;
  categoryMatch: boolean;
  categoryConflict: boolean;
  semanticSimilarity: number;
  contextOverlap: number;
  periodConflict: boolean;
  reasons: string[];
  components: {
    institution: number;
    semantic: number;
    category: number;
    context: number;
  };
  threshold: number;
  semanticThreshold: number;
  ruleVersion: string;
  scoreKind: 'HEURISTIC_RANKING_NOT_PROBABILITY';
}
