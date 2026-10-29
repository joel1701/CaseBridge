import { useMemo } from 'react';
import { Link, useParams } from 'react-router';
import { useQueries, useQuery } from '@tanstack/react-query';
import { Network } from 'lucide-react';
import {
  DataTable,
  EmptyState,
  ErrorState,
  PageHeader,
} from '@/components/page';
import { Button } from '@/components/ui/button';
import { BureauTag } from '@/components/ui/bureau-tag';
import { Skeleton } from '@/components/ui/skeleton';
import {
  complaintKeys,
  getComplaintActions,
  listComplaints,
} from '@/shared/api/complaints';
import { getDashboardOverview } from '@/shared/api/dashboard';
import { getInstitution, institutionKeys } from '@/shared/api/institutions';
import type { ComplaintListItem, OverviewFilters } from '@/shared/types';
import { CoordinationPanel } from '../dashboard/CoordinationPanel';
import { ACTION_LABEL } from '../complaints/ProposeAction';
import {
  complaintColumns,
  dueState,
  formatDate,
  useInstitutionDirectory,
  useOfficerNames,
} from '../complaints/shared';

const ALL: OverviewFilters = { range: 'all' };

export function InstitutionProfilePage() {
  const { id = '' } = useParams();
  const institutions = useInstitutionDirectory();
  const officers = useOfficerNames();
  const profile = useQuery({
    queryKey: institutionKeys.detail(id),
    queryFn: () => getInstitution(id),
    retry: false,
  });
  const openQuery = {
    institutionId: id,
    view: 'open' as const,
    pageSize: 100,
    sortBy: 'updatedAt' as const,
    sortOrder: 'desc' as const,
  };
  const open = useQuery({
    queryKey: complaintKeys.list(openQuery),
    queryFn: () => listComplaints(openQuery),
    enabled: profile.isSuccess,
  });
  // Open overlaps come from the coordination overview (the same data as the dashboard).
  const overviewKey = ['dashboard-overview', ALL] as const;
  const overview = useQuery({
    queryKey: overviewKey,
    queryFn: () => getDashboardOverview(ALL),
    enabled: profile.isSuccess,
  });

  // One row per bureau with open cases.
  const bureaus = useMemo(() => {
    const by = new Map<string, ComplaintListItem[]>();
    for (const c of open.data?.items ?? [])
      by.set(c.bureauId, [...(by.get(c.bureauId) ?? []), c]);
    return [...by].map(([bureau, list]) => ({
      bureau,
      list,
      overdue: list.filter((c) => dueState(c)?.overdue).length,
      officerIds: [
        ...new Set(
          list.flatMap((c) => (c.assignedToId ? [c.assignedToId] : [])),
        ),
      ],
      unassigned: list.filter((c) => !c.assignedToId).length,
    }));
  }, [open.data]);

  // Latest action per bureau: actions on its three most recently updated open cases.
  const actionQueries = useQueries({
    queries: bureaus.flatMap((b) =>
      b.list.slice(0, 3).map((c) => ({
        queryKey: complaintKeys.actions(c.id, { pageSize: 5 }),
        queryFn: () => getComplaintActions(c.id, { pageSize: 5 }),
      })),
    ),
  });
  const latestAction = (bureau: string) =>
    actionQueries
      .flatMap((q) => q.data?.items ?? [])
      .filter((a) => a.bureauId === bureau)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

  const columns = useMemo(
    () => complaintColumns({ institutions, officers, showInstitution: false }),
    [institutions, officers],
  );

  if (profile.isError)
    return (
      <ErrorState
        error={profile.error}
        title="Couldn't open this institution"
        action={
          <Button asChild variant="ghost" size="sm">
            <Link to="/complaints">Back to complaints</Link>
          </Button>
        }
      />
    );
  if (!profile.data)
    return (
      <div className="grid gap-6" aria-busy="true">
        <Skeleton className="h-14 w-2/3" label="Loading institution…" />
        <Skeleton className="h-48" />
        <Skeleton className="h-72" />
      </div>
    );

  const p = profile.data.data;
  // All overlaps here, linked ones included, so a card stays visible after "Link cases".
  const overlaps =
    overview.data?.overlapAlerts.filter((o) => o.institution.id === p.id) ?? [];

  return (
    <div className="grid gap-8">
      <PageHeader
        title={p.name}
        scope={profile.data.scope}
        description={
          <>
            <span className="font-mono text-indigo-hi">{p.permanentId}</span> ·{' '}
            {p.state} · {p.region ?? 'Unassigned'} regional office
          </>
        }
        actions={
          <Button asChild variant="ghost" size="sm">
            <Link to={`/graph/${p.id}`}>
              <Network size={16} aria-hidden="true" /> View knowledge graph
            </Link>
          </Button>
        }
      />

      {overview.data && overlaps.length > 0 && (
        <CoordinationPanel
          data={{ ...overview.data, overlapAlerts: overlaps }}
          queryKey={overviewKey}
        />
      )}

      <section
        aria-labelledby="handling-title"
        className="border border-line bg-graphite-1 p-5 lg:p-6"
      >
        <h2
          id="handling-title"
          className="font-display text-[clamp(26px,2.2vw,34px)] leading-none font-bold lowercase [font-stretch:75%]"
        >
          who is handling what
        </h2>
        <p className="mt-2 text-sm text-subtle">
          Open cases at each bureau, as of now.
        </p>
        {open.isPending ? (
          <Skeleton className="mt-5 h-40" />
        ) : bureaus.length ? (
          <ul className="mt-5 grid divide-y divide-line border-y border-line">
            {bureaus.map((b) => {
              const act = latestAction(b.bureau);
              return (
                <li
                  key={b.bureau}
                  className="grid gap-3 py-4 md:grid-cols-[80px_120px_minmax(0,1fr)_minmax(0,1fr)] md:items-start md:gap-6"
                >
                  <BureauTag code={b.bureau} className="justify-self-start" />
                  <p className="text-sm tabular-nums">
                    <span className="text-[22px] font-semibold">
                      {b.list.length}
                    </span>{' '}
                    open
                    <span
                      className={
                        b.overdue ? 'block text-alert' : 'block text-subtle'
                      }
                    >
                      {b.overdue} overdue
                    </span>
                  </p>
                  <div className="min-w-0 text-sm">
                    <p className="text-xs text-subtle">Assigned officers</p>
                    <p>
                      {b.officerIds.length
                        ? b.officerIds
                            .map((o) => officers.get(o) ?? 'An officer')
                            .join(', ')
                        : 'None yet'}
                    </p>
                    {b.unassigned > 0 && (
                      <p className="text-xs text-subtle">
                        {b.unassigned} unassigned
                      </p>
                    )}
                  </div>
                  <div className="min-w-0 text-sm">
                    <p className="text-xs text-subtle">Latest action</p>
                    <p>
                      {act
                        ? `${ACTION_LABEL[act.type]}${act.summary ? `: ${act.summary}` : ''}, ${formatDate(act.createdAt)}`
                        : 'No action yet'}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState
            className="mt-5"
            title="No open cases"
            body="Every complaint about this institution has been disposed."
          />
        )}
      </section>

      <section
        aria-labelledby="history-title"
        className="border border-line bg-graphite-1 p-5 lg:p-6"
      >
        <h2
          id="history-title"
          className="font-display text-[clamp(26px,2.2vw,34px)] leading-none font-bold lowercase [font-stretch:75%]"
        >
          complaint history
        </h2>
        <p className="mt-2 mb-5 text-sm text-subtle">
          Across all bureaus, newest first. {p.authorizedComplaintCount}{' '}
          complaints in your scope; the latest {p.recentComplaints.length} are
          shown.
        </p>
        <DataTable
          caption={`Complaints about ${p.name}`}
          columns={columns}
          rows={p.recentComplaints}
          rowKey={(c) => c.id}
          rowHref={(c) => `/complaints/${c.id}`}
          rowLabel={(c) => `${c.originalId}: ${c.title}`}
        />
      </section>
    </div>
  );
}
