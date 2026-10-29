import { useQueries, useQuery } from '@tanstack/react-query';
import { Timeline, type TimelineItem } from '@/components/page';
import { BureauTag } from '@/components/ui/bureau-tag';
import { Skeleton } from '@/components/ui/skeleton';
import { Spec } from '@/components/ui/spec';
import { bureauKeys, listOfficers } from '@/shared/api/bureaus';
import { complaintKeys, getComplaintActions } from '@/shared/api/complaints';
import {
  coordinationKeys,
  getWorkspaceHistory,
} from '@/shared/api/coordination';
import { cn } from '@/shared/utils/cn';
import type {
  CoordinationDecision,
  Workspace,
  WorkspaceHistoryEntry,
  WorkspaceStatus,
} from '@/shared/types';
import { COORDINATION_TYPES } from './coordinationTypes';

const statusLabel: Record<WorkspaceStatus, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
};

const actionLabel: Record<string, string> = {
  EVIDENCE_REQUEST: 'Evidence request',
  INSPECTION: 'Inspection',
  NOTICE: 'Notice',
  REVIEW: 'Review',
};

function historyTitle(
  e: WorkspaceHistoryEntry,
  name: (id: string | null) => string,
) {
  if (e.event === 'COORDINATION_WORKSPACE_CREATED') return 'Workspace opened';
  if (e.operation === 'ASSIGN')
    return e.coordinatorRestricted
      ? 'Coordinator assigned'
      : `Coordinator set to ${name(e.toCoordinatorId)}`;
  if (e.operation === 'TRACK_ACTION')
    return e.actionRestricted ? 'Action tracked' : 'Shared action tracked';
  if (e.operation === 'SET_STATUS')
    return `Status: ${statusLabel[e.fromStatus ?? 'OPEN']} → ${statusLabel[e.toStatus]}`;
  return 'Workspace updated';
}

// The coordination workspace for a confirmed link: who is involved, what's tracked, what happened.
export function CoordinationWorkspace({
  workspace: ws,
  decision,
}: {
  workspace: Workspace;
  decision: CoordinationDecision | null;
}) {
  const history = useQuery({
    queryKey: coordinationKeys.history(ws.id),
    queryFn: () => getWorkspaceHistory(ws.id),
  });
  const officers = useQueries({
    queries: ws.involvedBureauIds.map((b) => ({
      queryKey: bureauKeys.officers(b),
      queryFn: () => listOfficers(b),
    })),
  });
  const actions = useQueries({
    queries: ws.complaintIds.map((id) => ({
      queryKey: complaintKeys.actions(id),
      queryFn: () => getComplaintActions(id),
    })),
  });
  const names = new Map(
    officers
      .flatMap((q) => q.data?.items ?? [])
      .map((o) => [o.id, o.displayName]),
  );
  const name = (id: string | null) =>
    id ? (names.get(id) ?? 'an officer') : 'nobody';
  const tracked = actions
    .flatMap((q) => q.data?.items ?? [])
    .filter((a) => ws.sharedActionIds.includes(a.id));

  const items: TimelineItem[] = (history.data?.items ?? [])
    .slice()
    .reverse()
    .map((e, i) => ({
      id: `${e.version}-${e.createdAt}`,
      at: e.createdAt,
      title: historyTitle(e, name),
      detail: `by ${name(e.actorId)}`,
      tone: i === 0 ? 'current' : undefined,
    }));

  return (
    <section
      aria-labelledby="ws-title"
      className="grid gap-6 border border-indigo bg-graphite-1 p-5 lg:p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2
          id="ws-title"
          className="font-display text-[clamp(26px,2.2vw,34px)] leading-none font-bold lowercase [font-stretch:75%]"
        >
          coordination workspace
        </h2>
        <span
          className={cn(
            'border px-2 py-1 text-xs leading-none font-medium',
            ws.status === 'COMPLETED'
              ? 'border-line-2 text-subtle'
              : 'border-transparent bg-indigo/16 text-indigo-hi',
          )}
        >
          {statusLabel[ws.status]}
        </span>
      </div>

      {decision && (
        <p className="border border-line-2 p-4 text-sm">
          <span className="font-bold">
            Decision recorded:{' '}
            {COORDINATION_TYPES.find((t) => t.value === decision.type)?.label}
          </span>
          <span className="mt-1 block text-subtle">{decision.rationale}</span>
        </p>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="grid content-start gap-5">
          <Spec
            className="grid-cols-1"
            items={[
              {
                label: 'Involved bureaus',
                value: (
                  <span className="flex flex-wrap gap-2">
                    {ws.involvedBureauIds.map((b) => (
                      <BureauTag key={b} code={b} />
                    ))}
                  </span>
                ),
              },
              {
                label: 'Coordinator',
                value: ws.coordinatorRestricted
                  ? 'Another bureau'
                  : ws.coordinatorId
                    ? name(ws.coordinatorId)
                    : 'Not assigned yet',
              },
            ]}
          />
          <div>
            <h3 className="text-[15px] font-bold">Tracked actions</h3>
            {actions.some((q) => q.isPending) ? (
              <Skeleton className="mt-2 h-10" label="Loading actions…" />
            ) : tracked.length ? (
              <ul className="mt-2 grid gap-2">
                {tracked.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center gap-3 border border-line-2 px-3 py-2 text-sm"
                  >
                    <BureauTag code={a.bureauId} />
                    <span>{actionLabel[a.type] ?? a.type}</span>
                    {a.summary && (
                      <span className="truncate text-subtle">{a.summary}</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-subtle">
                No shared actions tracked yet.
              </p>
            )}
          </div>
        </div>
        <div>
          <h3 className="mb-3 text-[15px] font-bold">History</h3>
          {history.isPending ? (
            <Skeleton className="h-24" label="Loading history…" />
          ) : (
            <Timeline items={items} label="Workspace history" />
          )}
        </div>
      </div>
    </section>
  );
}
