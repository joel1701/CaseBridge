import { lazy, Suspense, useId } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { BUREAUS, type BureauFilter } from '@/components/layout/BureauContext';
import { ErrorState, PageHeader } from '@/components/page';
import { Skeleton } from '@/components/ui/skeleton';
import { useOverviewFilters } from '@/features/dashboard/useOverviewFilters';
import { getDashboardOverview } from '@/shared/api/dashboard';
import { getOverlapTrend, reportKeys } from '@/shared/api/reports';
import { cn } from '@/shared/utils/cn';
import type { OverviewRange } from '@/shared/types';

// Recharts loads with the panels, not in the app bundle.
const ReportPanels = lazy(() =>
  import('./ReportPanels').then((m) => ({ default: m.ReportPanels })),
);

// The dashboard's filter hook and overview, so the same filters give the same numbers.
const PERIODS: { value: OverviewRange; label: string }[] = [
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '12m', label: 'Last 12 months' },
];

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="wide text-xs text-subtle">
        {label}
      </label>
      <select
        id={id}
        className="select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function PanelsSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-2" aria-busy="true">
      {[0, 1, 2, 3].map((i) => (
        <Skeleton
          key={i}
          className="h-[480px]"
          label={i === 0 ? 'Loading reports…' : undefined}
        />
      ))}
    </div>
  );
}

export function ReportsPage() {
  // Reports open on 12 months, so the per-month charts show the whole year.
  const { filters, setRange, setRegion, setBureau } = useOverviewFilters('12m');
  // "All time" isn't a report preset; fall back to the default 12 months.
  const range = PERIODS.some((p) => p.value === filters.range)
    ? filters
    : { ...filters, range: '12m' as const };

  const overview = useQuery({
    queryKey: ['dashboard-overview', range],
    queryFn: () => getDashboardOverview(range),
    placeholderData: keepPreviousData,
  });
  const overlaps = useQuery({
    queryKey: reportKeys.overlaps(range),
    queryFn: () => getOverlapTrend(range),
    placeholderData: keepPreviousData,
  });

  const error = overview.error ?? overlaps.error;
  const data = overview.data;
  const period = PERIODS.find((p) => p.value === range.range)!.label;

  return (
    <div className="grid gap-8">
      <PageHeader
        title="reports"
        scope={data?.scope}
        description={`${period}${range.region ? `, ${range.region} regional office` : ', all regional offices'}${range.bureau ? `, ${range.bureau}` : ', all bureaus'}. Same figures as the dashboard for the same filters.`}
      />

      <div className="flex flex-wrap items-end gap-4">
        <Select
          label="Period"
          value={range.range}
          onChange={(v) => setRange(v as OverviewRange)}
          options={PERIODS}
        />
        <Select
          label="Bureau"
          value={filters.bureau ?? 'ALL'}
          onChange={(v) => setBureau(v as BureauFilter)}
          options={[...BUREAUS]}
        />
        <Select
          label="Regional office"
          value={range.region ?? ''}
          onChange={(v) => setRegion(v || undefined)}
          options={[
            { value: '', label: 'All regional offices' },
            ...(data?.regions ?? []).map((r) => ({ value: r, label: r })),
          ]}
        />
      </div>

      {error ? (
        <ErrorState
          error={error}
          onRetry={() => {
            void overview.refetch();
            void overlaps.refetch();
          }}
        />
      ) : data && overlaps.data ? (
        <div
          className={cn(
            'transition-opacity',
            (overview.isPlaceholderData || overlaps.isPlaceholderData) &&
              'opacity-60',
          )}
        >
          <Suspense fallback={<PanelsSkeleton />}>
            <ReportPanels data={data} overlaps={overlaps.data.data} />
          </Suspense>
        </div>
      ) : (
        <PanelsSkeleton />
      )}
    </div>
  );
}
