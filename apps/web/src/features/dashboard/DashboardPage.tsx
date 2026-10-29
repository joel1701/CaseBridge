import { lazy, Suspense, useId } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { BUREAUS, type BureauFilter } from '@/components/layout/BureauContext';
import { ErrorState } from '@/components/layout/FeaturePage';
import { Skeleton } from '@/components/ui/skeleton';
import { getDashboardOverview } from '@/shared/api/dashboard';
import type { OverviewRange } from '@/shared/types';
import { ActivityTimeline } from './ActivityTimeline';
import { CoordinationPanel } from './CoordinationPanel';
import { DeadlinePanel } from './DeadlinePanel';
import { InstitutionsTable } from './InstitutionsTable';
import { KpiTiles } from './KpiTiles';
import { RANGES, useOverviewFilters } from './useOverviewFilters';

// Recharts is only needed here, so it loads with this panel instead of in the app bundle.
const AnalyticsPanel = lazy(() =>
  import('./AnalyticsPanel').then((m) => ({ default: m.AnalyticsPanel })),
);

const today = new Intl.DateTimeFormat('en-IN', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
}).format(new Date());

function Filter({
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

function DashboardSkeleton() {
  return (
    <div className="grid gap-6" aria-busy="true">
      <Skeleton className="h-4 w-64" label="Loading coordination overview…" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[146px]" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="grid gap-4 border border-line bg-graphite-1 p-6 xl:grid-cols-2">
          <Skeleton className="h-7 w-56 xl:col-span-2" />
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
        <div className="grid content-start gap-3 border border-line bg-graphite-1 p-6">
          <Skeleton className="h-7 w-32" />
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}

export function DashboardPage() {
  const { filters, setRegion, setRange, setBureau } = useOverviewFilters();
  const queryKey = ['dashboard-overview', filters] as const;
  const query = useQuery({
    queryKey,
    queryFn: () => getDashboardOverview(filters),
    placeholderData: keepPreviousData,
    retry: false,
  });
  const data = query.data;

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div>
          <h1 className="font-display text-[clamp(40px,4.6vw,64px)] leading-[0.86] font-bold tracking-[-0.012em] text-indigo-hi lowercase [font-stretch:75%]">
            coordination overview
          </h1>
          <p className="mt-3 text-sm text-subtle">
            {today}
            {data?.scope === 'SYNTHETIC' && (
              <>
                {' · '}
                <span className="font-bold text-snow">Synthetic data</span>
                <span className="wide text-xs"> — not live bureau records</span>
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-3" role="group" aria-label="Filters">
          <Filter
            label="Regional office"
            value={filters.region ?? ''}
            onChange={(v) => setRegion(v || undefined)}
            options={[
              { value: '', label: 'All offices' },
              ...(
                data?.regions ?? (filters.region ? [filters.region] : [])
              ).map((r) => ({ value: r, label: r })),
            ]}
          />
          <Filter
            label="Bureau"
            value={filters.bureau ?? 'ALL'}
            onChange={(v) => setBureau(v as BureauFilter)}
            options={BUREAUS.map((b) => ({ value: b.value, label: b.label }))}
          />
          <Filter
            label="Period"
            value={filters.range}
            onChange={(v) => setRange(v as OverviewRange)}
            options={RANGES}
          />
        </div>
      </header>

      {query.isPending ? (
        <DashboardSkeleton />
      ) : query.isError || !data ? (
        <ErrorState retry={() => void query.refetch()} />
      ) : (
        <div
          className={
            query.isPlaceholderData
              ? 'grid gap-6 opacity-60 transition-opacity'
              : 'grid gap-6 transition-opacity'
          }
        >
          <KpiTiles counts={data.counts} />
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <CoordinationPanel data={data} queryKey={queryKey} />
            <DeadlinePanel data={data} />
          </div>
          <Suspense
            fallback={
              <div className="grid gap-5 border border-line bg-graphite-1 p-6">
                <Skeleton className="h-8 w-40" label="Loading analytics…" />
                <Skeleton className="h-72" />
              </div>
            }
          >
            <AnalyticsPanel data={data} />
          </Suspense>
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <InstitutionsTable rows={data.multiBureauInstitutions} />
            <ActivityTimeline items={data.recentActivity} />
          </div>
        </div>
      )}
    </div>
  );
}
