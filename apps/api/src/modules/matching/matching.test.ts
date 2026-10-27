import { describe, it, expect, vi } from 'vitest';
import { scoreMatch, distinctPeriods } from './scoring.js';
import { MatchingService } from './service.js';
import { HttpSimilarityProvider } from './ai-client.js';
import type { MatchComplaint } from './types.js';
import type { MatchingRepository } from './repository.js';
const source: MatchComplaint = {
  id: 'a',
  institutionId: 'i1',
  bureauId: 'PGRC',
  title: 'Fees',
  description: 'Students report unauthorised collection of admission fees.',
  category: 'FEES',
  updatedAt: new Date(0),
};
const target = {
  ...source,
  id: 'b',
  bureauId: 'RB',
  description: 'Institute demanding extra payments beyond approved charges.',
};
describe('explainable matching', () => {
  it('suggests differently worded related complaints without calling score probability', () => {
    const result = scoreMatch(source, target, 0.76);
    expect(result.suggested).toBe(true);
    expect(result.explanation.scoreKind).toBe(
      'HEURISTIC_RANKING_NOT_PROBABILITY',
    );
  });
  it('rejects unrelated same-institution complaints even with similar language', () => {
    expect(
      scoreMatch(source, { ...target, category: 'INFRASTRUCTURE' }, 0.95)
        .suggested,
    ).toBe(false);
  });
  it('rejects different institutions and incompatible explicit periods', () => {
    expect(
      scoreMatch(source, { ...target, institutionId: 'i2' }, 1).suggested,
    ).toBe(false);
    expect(
      scoreMatch(
        { ...source, description: 'Admission fee records 2024' },
        { ...target, description: 'Admission fee records 2026' },
        0.99,
      ).suggested,
    ).toBe(false);
    expect(distinctPeriods('2026', '2026-Q3')).toBe(false);
  });
  it('does not save suggestions after AI failure', async () => {
    const repository: MatchingRepository = {
      source: vi.fn().mockResolvedValue(source),
      candidates: vi.fn().mockResolvedValue([target]),
      save: vi.fn(),
    };
    const service = new MatchingService(repository, {
      compare: vi.fn().mockRejectedValue(new Error('unavailable')),
    });
    await expect(
      service.analyze({ id: 'u', role: 'OFFICER', bureauId: 'PGRC' }, 'a'),
    ).rejects.toThrow('unavailable');
    expect(repository.save).not.toHaveBeenCalled();
  });
  it('validates remote result IDs and rejects fixture mode', async () => {
    vi.stubEnv('AI_SERVICE_TOKEN', 'a'.repeat(64));
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: [{ id: 'b', cosineSimilarity: 0.8 }],
          modelVersion: 'fixture',
          mode: 'fixture',
          recommendationOnly: true,
        }),
      ),
    );
    await expect(
      new HttpSimilarityProvider(fetcher).compare(source, [target]),
    ).rejects.toMatchObject({ code: 'AI_UNAVAILABLE' });
    fetcher.mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: [{ id: 'wrong', cosineSimilarity: 0.8 }],
          modelVersion: 'minilm',
          mode: 'transformer',
          recommendationOnly: true,
        }),
      ),
    );
    await expect(
      new HttpSimilarityProvider(fetcher).compare(source, [target]),
    ).rejects.toMatchObject({ code: 'AI_UNAVAILABLE' });
    vi.unstubAllEnvs();
  });
});
