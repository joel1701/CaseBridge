/** Opt-in real HTTP/encoder test. Repository is explicitly a typed test double. */
import { it, expect, vi } from 'vitest';
import { HttpSimilarityProvider } from './ai-client.js';
import { MatchingService } from './service.js';
import type { MatchComplaint } from './types.js';
import type { MatchingRepository } from './repository.js';
it.skipIf(process.env.CASEBRIDGE_TEST_AI !== '1')(
  'integrates the real FastAPI encoder with TypeScript matching rules',
  async () => {
    const source: MatchComplaint = {
      id: 'cmp-001',
      institutionId: 'inst-01',
      bureauId: 'PGRC',
      title: 'Unapproved admission fees',
      description: 'Students report unauthorised collection of admission fees.',
      category: 'FEES',
      updatedAt: new Date(0),
    };
    const fee = {
      ...source,
      id: 'cmp-002',
      bureauId: 'RB',
      description:
        'Institute demanding extra payments beyond approved charges.',
    };
    const roof = {
      ...source,
      id: 'cmp-003',
      category: 'INFRASTRUCTURE',
      description:
        'A laboratory roof leaks during rainfall; repair and safety inspection requested.',
    };
    const save: MatchingRepository['save'] = vi.fn<MatchingRepository['save']>(
      async (_principal, _source, suggestions, modelVersion) =>
        suggestions.map((s, index) => ({
          id: `test-link-${index}`,
          status: 'SUGGESTED',
          score: s.score,
          explanation: s.explanation,
          modelVersion,
          updatedAt: new Date(),
        })),
    );
    const repository: MatchingRepository = {
      source: async () => source,
      candidates: async () => [fee, roof],
      save,
    };
    const result = await new MatchingService(
      repository,
      new HttpSimilarityProvider(),
    ).analyze({ id: 'officer', role: 'OFFICER', bureauId: 'PGRC' }, source.id);
    expect(result.suggestions).toHaveLength(1);
    expect(result.suggestions[0].modelVersion).toContain('all-MiniLM-L6-v2');
    expect(save).toHaveBeenCalledWith(
      expect.anything(),
      source,
      [expect.objectContaining({ target: fee })],
      expect.any(String),
    );
  },
  60000,
);
