import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router';
import { BUREAUS, useBureau } from '@/components/layout/BureauContext';
import type { OverviewFilters, OverviewRange } from '@/shared/types';

export const RANGES: { value: OverviewRange; label: string }[] = [
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '12m', label: 'Last 12 months' },
  { value: 'all', label: 'All time' },
];

// Filters live in the URL (?region=&bureau=&range=). The bureau is the shell's
// bureau context: a ?bureau= link sets the context once, and the context writes the URL.
export function useOverviewFilters() {
  const [params, setParams] = useSearchParams();
  const { bureau, setBureau } = useBureau();
  const adopted = useRef(false);
  // Start from the live URL, not the last render: two quick changes would otherwise
  // each start from the same stale params and the second would undo the first.
  const update = useCallback(
    (change: (p: URLSearchParams) => void) => {
      const next = new URLSearchParams(window.location.search);
      change(next);
      setParams(next, { replace: true });
    },
    [setParams],
  );

  useEffect(() => {
    if (adopted.current) return;
    adopted.current = true;
    const fromUrl = params.get('bureau');
    const match = BUREAUS.find((b) => b.value === fromUrl);
    if (match && match.value !== bureau) setBureau(match.value);
  }, [params, bureau, setBureau]);

  useEffect(() => {
    if (!adopted.current) return;
    update((p) => {
      if (bureau === 'ALL') p.delete('bureau');
      else p.set('bureau', bureau);
    });
  }, [bureau, update]);

  const rangeParam = params.get('range');
  const range: OverviewRange = RANGES.some((r) => r.value === rangeParam)
    ? (rangeParam as OverviewRange)
    : '90d';
  const region = params.get('region') ?? undefined;

  const filters = useMemo<OverviewFilters>(
    () => ({
      range,
      region,
      bureau: bureau === 'ALL' ? undefined : bureau,
    }),
    [range, region, bureau],
  );

  const set = (key: 'region' | 'range', value: string | undefined) =>
    update((p) => {
      if (!value || (key === 'range' && value === '90d')) p.delete(key);
      else p.set(key, value);
    });

  return {
    filters,
    setRegion: (v?: string) => set('region', v),
    setRange: (v: OverviewRange) => set('range', v),
    setBureau,
  };
}
