import { useId, useMemo } from 'react';
import { keepPreviousData, useQueries, useQuery } from '@tanstack/react-query';
import { useBureau } from '@/components/layout/BureauContext';
import {
  DataTable,
  ErrorState,
  PageHeader,
  TabPanel,
  Tabs,
  useUrlState,
} from '@/components/page';
import { useMe } from '@/shared/api/auth';
import { bureauKeys, getBureauQueue, listBureaus } from '@/shared/api/bureaus';
import type {
  ComplaintListQuery,
  ComplaintSortBy,
  ComplaintView,
} from '@/shared/types';
import {
  complaintColumns,
  useInstitutionDirectory,
  useOfficerNames,
} from '../complaints/shared';

const tabs = [
  { key: 'unassigned', label: 'Unassigned' },
  { key: 'dueSoon', label: 'Due soon (48h)' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'open', label: 'All open' },
] as const;
type TabKey = (typeof tabs)[number]['key'];

export function BureauQueuePage() {
  const uid = useId();
  const { bureau: shell } = useBureau();
  const { data: me } = useMe();
  const [url, setUrl] = useUrlState({
    tab: 'unassigned',
    b: '',
    sort: 'dueAt:asc',
    page: '1',
  });
  const bureaus = useQuery({
    queryKey: bureauKeys.list(),
    queryFn: listBureaus,
    staleTime: 5 * 60_000,
  });
  // The shell's bureau when it names one; otherwise a picker, defaulting to the officer's own bureau.
  const single = shell === 'RB' || shell === 'PGRC';
  const bureauId = single
    ? shell
    : url.b || me?.bureauId || (shell === 'OTHER' ? 'AB' : 'PGRC');
  const bureau = bureaus.data?.items.find((b) => b.id === bureauId);
  const tab = (
    tabs.some((t) => t.key === url.tab) ? url.tab : 'unassigned'
  ) as TabKey;
  const [sortBy, sortOrder] = url.sort.split(':') as [
    ComplaintSortBy,
    'asc' | 'desc',
  ];

  const query: ComplaintListQuery = {
    view: tab as ComplaintView,
    sortBy,
    sortOrder,
    page: Number(url.page) || 1,
    pageSize: 20,
  };
  const list = useQuery({
    queryKey: bureauKeys.queue(bureauId, query),
    queryFn: () => getBureauQueue(bureauId, query),
    placeholderData: keepPreviousData,
  });
  // Quiet totals: one tiny request per view (only meta.total is used).
  const totals = useQueries({
    queries: (['open', 'overdue', 'unassigned'] as const).map((view) => ({
      queryKey: bureauKeys.queue(bureauId, { view, pageSize: 1 }),
      queryFn: () => getBureauQueue(bureauId, { view, pageSize: 1 }),
    })),
  });
  const [open, overdue, unassigned] = totals.map((t) => t.data?.meta.total);

  const institutions = useInstitutionDirectory();
  const officers = useOfficerNames();
  const columns = useMemo(
    () => complaintColumns({ institutions, officers }),
    [institutions, officers],
  );

  return (
    <div className="grid gap-6">
      <PageHeader
        title={`${bureauId.toLowerCase()} queue`}
        scope={list.data?.scope}
        description={
          <>
            {bureau?.name ?? bureauId}
            {open !== undefined && (
              <>
                {' · '}
                <span className="tabular-nums">{open} open</span>
                {' · '}
                <span
                  className={
                    overdue ? 'text-alert tabular-nums' : 'tabular-nums'
                  }
                >
                  {overdue} overdue
                </span>
                {' · '}
                <span className="tabular-nums">{unassigned} unassigned</span>
              </>
            )}
          </>
        }
        actions={
          !single && (
            <div className="flex flex-col gap-1">
              <label
                htmlFor={`${uid}-bureau`}
                className="wide text-xs text-subtle"
              >
                Bureau
              </label>
              <select
                id={`${uid}-bureau`}
                className="select"
                value={bureauId}
                onChange={(e) => setUrl({ b: e.target.value })}
              >
                {(bureaus.data?.items ?? []).map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.code} · {b.name}
                  </option>
                ))}
              </select>
            </div>
          )
        }
      />
      <section
        aria-label="Queue"
        className="grid gap-5 border border-line bg-graphite-1 p-5"
      >
        <Tabs
          id={uid}
          label="Queue views"
          tabs={tabs}
          value={tab}
          onChange={(t) => setUrl({ tab: t })}
          className="self-start"
        />
        <TabPanel id={uid} value={tab}>
          {list.isError ? (
            <ErrorState
              error={list.error}
              onRetry={() => void list.refetch()}
            />
          ) : (
            <DataTable
              caption={`${bureauId} queue: ${tabs.find((t) => t.key === tab)!.label}`}
              columns={columns}
              rows={list.data?.items}
              rowKey={(c) => c.id}
              rowHref={(c) => `/complaints/${c.id}`}
              rowLabel={(c) => `${c.originalId}: ${c.title}`}
              loading={list.isFetching}
              sort={{ key: sortBy, dir: sortOrder }}
              onSort={(s) => setUrl({ sort: `${s.key}:${s.dir}` })}
              meta={list.data?.meta}
              onPage={(p) => setUrl({ page: String(p) })}
            />
          )}
        </TabPanel>
      </section>
    </div>
  );
}
