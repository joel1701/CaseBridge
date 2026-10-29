import { useEffect, useMemo, useRef } from 'react';
import { BUREAUS, useBureau } from '@/components/layout/BureauContext';
import { useUrlState } from '@/components/page';
import type { OverviewFilters, OverviewRange } from '@/shared/types';

export const RANGES: { value: OverviewRange; label: string }[] = [
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '12m', label: 'Last 12 months' },
  { value: 'all', label: 'All time' },
];

// Filters live in the URL (?region=&bureau=&range=). The bureau is the shell's
// bureau context: a ?bureau= link sets the context once, and the context writes the URL.
/** `defaultRange` is the period when the URL has none (dashboard: 90 days; reports: 12 months). */
export function useOverviewFilters(defaultRange: OverviewRange = '90d') {
  const [url, setUrl] = useUrlState({
    region: '',
    range: defaultRange,
    bureau: 'ALL',
  });
  const { bureau, setBureau } = useBureau();
  const adopted = useRef(false);

  useEffect(() => {
    if (adopted.current) return;
    adopted.current = true;
    const match = BUREAUS.find((b) => b.value === url.bureau);
    if (match && match.value !== bureau) setBureau(match.value);
  }, [url.bureau, bureau, setBureau]);

  useEffect(() => {
    if (adopted.current) setUrl({ bureau });
  }, [bureau, setUrl]);

  const range: OverviewRange = RANGES.some((r) => r.value === url.range)
    ? (url.range as OverviewRange)
    : defaultRange;
  const region = url.region || undefined;

  const filters = useMemo<OverviewFilters>(
    () => ({ range, region, bureau: bureau === 'ALL' ? undefined : bureau }),
    [range, region, bureau],
  );

  return {
    filters,
    setRegion: (v?: string) => setUrl({ region: v }),
    setRange: (v: OverviewRange) => setUrl({ range: v }),
    setBureau,
  };
}
