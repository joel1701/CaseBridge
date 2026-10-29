import { useId, useState } from 'react';
import { Link, useParams } from 'react-router';
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRightLeft,
  ChevronsUp,
  GitCompareArrows,
  Plus,
} from 'lucide-react';
import {
  DetailLayout,
  EmptyState,
  ErrorState,
  PageHeader,
  ReasonDialog,
  TabPanel,
  Tabs,
  Timeline,
  type TimelineItem,
} from '@/components/page';
import { Button } from '@/components/ui/button';
import { BureauTag } from '@/components/ui/bureau-tag';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusPill } from '@/components/ui/status-pill';
import {
  complaintKeys,
  getComplaint,
  getComplaintActions,
  getComplaintTimeline,
  updateComplaint,
} from '@/shared/api/complaints';
import { intelligenceKeys, listLinks } from '@/shared/api/intelligence';
import type {
  Action,
  ComplaintDetail,
  ComplaintStatus,
  TimelineEntry,
} from '@/shared/types';
import { ACTION_LABEL, ProposeAction } from './ProposeAction';
import {
  STATUS_LABEL,
  STATUS_OPTIONS,
  categoryLabel,
  dueState,
  formatDate,
  useInstitutionDirectory,
  useOfficerNames,
} from './shared';

const tabs = [
  { key: 'history', label: 'History' },
  { key: 'actions', label: 'Actions' },
  { key: 'overlaps', label: 'Overlaps' },
] as const;
type TabKey = (typeof tabs)[number]['key'];

const ACTION_STATUS: Record<Action['status'], string> = {
  PLANNED: 'Planned',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

/** A timeline entry in plain words; transfers and escalations get a marker. */
function describe(
  e: TimelineEntry,
  officers: Map<string, string>,
): Omit<TimelineItem, 'id' | 'at'> {
  const m = e.metadata as Record<string, string | undefined>;
  const who = e.actorId ? (officers.get(e.actorId) ?? 'An officer') : 'Setu';
  const reason = m.reason ? ` · "${m.reason}"` : '';
  const badge = (icon: React.ReactNode, text: string) => (
    <span className="mr-2 inline-flex items-center gap-1 bg-indigo-hi px-1.5 py-0.5 align-middle text-[11px] font-bold text-ink">
      {icon}
      {text}
    </span>
  );
  switch (e.event) {
    case 'COMPLAINT_CREATED':
      return {
        title: `Received at ${m.bureauId ?? 'the bureau'}`,
        detail: who,
      };
    case 'COMPLAINT_ASSIGNED':
      return {
        title: `Assigned to ${m.assignedToId ? (officers.get(m.assignedToId) ?? 'an officer') : 'nobody'}`,
        detail: who + reason,
      };
    case 'COMPLAINT_STATUS_CHANGED':
      if (m.toStatus === 'TRANSFERRED')
        return {
          title: (
            <>
              {badge(
                <ArrowRightLeft size={11} aria-hidden="true" />,
                'Transfer',
              )}
              Transferred to another bureau
            </>
          ),
          detail: who + reason,
        };
      if (m.toStatus === 'ESCALATED')
        return {
          title: (
            <>
              {badge(<ChevronsUp size={11} aria-hidden="true" />, 'Escalation')}
              Escalated to the bureau head
            </>
          ),
          detail: who + reason,
        };
      return {
        title: `Status: ${STATUS_LABEL[m.fromStatus as ComplaintStatus] ?? m.fromStatus} → ${STATUS_LABEL[m.toStatus as ComplaintStatus] ?? m.toStatus}`,
        detail: who + reason,
      };
    case 'COMPLAINT_TRANSFERRED':
      return {
        title: (
          <>
            {badge(<ArrowRightLeft size={11} aria-hidden="true" />, 'Transfer')}
            Transferred from {m.fromBureauId} to {m.toBureauId}
          </>
        ),
        detail: who + reason,
      };
    case 'ACTION_CREATED':
      return {
        title: `Action planned: ${ACTION_LABEL[m.type as Action['type']] ?? m.type}`,
        detail: who,
      };
    case 'ACTION_OVERRIDE_CREATED':
      return {
        title: 'Action created despite a related action at another bureau',
        detail: who + reason,
        tone: 'alert',
      };
    case 'CASE_LINK_REVIEWED':
      return {
        title:
          m.status === 'CONFIRMED'
            ? 'Linked with a case at another bureau'
            : 'Suggested link rejected',
        detail: who,
      };
    case 'COMPLAINT_ARCHIVED':
      return { title: 'Archived', detail: who + reason };
    case 'COMPLAINT_UPDATED':
      return { title: 'Details updated', detail: who + reason };
    default:
      return { title: e.event.toLowerCase().replaceAll('_', ' '), detail: who };
  }
}

function nextStep(
  c: ComplaintDetail,
  actions: Action[],
  pendingOverlap: boolean,
) {
  if (c.status === 'DISPOSED') return 'None. The case is disposed.';
  if (pendingOverlap)
    return 'Review the overlap with the other bureau before acting.';
  const open = actions
    .filter((a) => a.status === 'PLANNED' || a.status === 'IN_PROGRESS')
    .sort((a, b) => (a.dueAt ?? '').localeCompare(b.dueAt ?? ''));
  if (open[0])
    return `${ACTION_LABEL[open[0].type]} due ${formatDate(open[0].dueAt)}`;
  if (c.status === 'RECEIVED') return 'Assign an officer and take up the case.';
  return 'Propose the next action.';
}

export function ComplaintDetailsPage() {
  const { id = '' } = useParams();
  const uid = useId();
  const qc = useQueryClient();
  const [tab, setTab] = useState<TabKey>('history');
  const [proposing, setProposing] = useState(false);
  const [changing, setChanging] = useState(false);
  const officers = useOfficerNames();
  const institutions = useInstitutionDirectory();

  const detail = useQuery({
    queryKey: complaintKeys.detail(id),
    queryFn: () => getComplaint(id),
    retry: false,
  });
  const history = useQuery({
    queryKey: complaintKeys.timeline(id, { pageSize: 100 }),
    queryFn: () => getComplaintTimeline(id, { pageSize: 100 }),
    enabled: detail.isSuccess,
  });
  const actions = useQuery({
    queryKey: complaintKeys.actions(id, { pageSize: 100 }),
    queryFn: () => getComplaintActions(id, { pageSize: 100 }),
    enabled: detail.isSuccess,
  });
  const links = useQuery({
    queryKey: intelligenceKeys.links(id),
    queryFn: () => listLinks(id),
    enabled: detail.isSuccess,
  });
  const others = useQueries({
    queries: (links.data?.items ?? [])
      .filter((l) => l.otherComplaint.id)
      .map((l) => ({
        queryKey: complaintKeys.detail(l.otherComplaint.id!),
        queryFn: () => getComplaint(l.otherComplaint.id!),
        retry: false,
      })),
  });
  const otherRef = new Map(
    others.flatMap((o) =>
      o.data ? [[o.data.data.id, o.data.data.originalId] as const] : [],
    ),
  );

  const [status, setStatus] = useState<ComplaintStatus>('UNDER_PROCESS');

  if (detail.isError)
    return (
      <ErrorState
        error={detail.error}
        title="Couldn't open this complaint"
        action={
          <Button asChild variant="ghost" size="sm">
            <Link to="/complaints">Back to complaints</Link>
          </Button>
        }
      />
    );
  if (!detail.data)
    return (
      <div className="grid gap-6" aria-busy="true">
        <Skeleton className="h-14 w-2/3" label="Loading complaint…" />
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );

  const c = detail.data.data;
  const inst = institutions.get(c.institutionId);
  const acts = actions.data?.items ?? [];
  const lastAction = [...acts].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  )[0];
  const pendingLinks = (links.data?.items ?? []).filter(
    (l) => l.status === 'SUGGESTED',
  );
  const due = dueState(c);

  const openStatusDialog = () => {
    setStatus(
      c.status === 'RECEIVED'
        ? 'UNDER_PROCESS'
        : c.status === 'DISPOSED'
          ? 'UNDER_PROCESS'
          : 'DISPOSED',
    );
    setChanging(true);
  };
  const refreshAll = () => {
    void qc.invalidateQueries({ queryKey: ['complaints'] });
    void qc.invalidateQueries({ queryKey: ['dashboard-overview'] });
    void qc.invalidateQueries({ queryKey: ['alerts'] });
  };

  return (
    <div className="grid gap-8">
      <PageHeader
        title={c.title}
        scope={detail.data.scope}
        description={
          <>
            <span className="font-mono text-snow">{c.originalId}</span>
            {' · '}
            <Link
              to={`/institutions/${c.institutionId}`}
              className="link text-snow"
            >
              {inst?.name ?? c.institutionId}
            </Link>
          </>
        }
        actions={
          <>
            <StatusPill status={c.status} />
            <BureauTag code={c.bureauId} />
            {due?.overdue && <StatusPill status="OVERDUE" />}
            <Button
              size="sm"
              onClick={openStatusDialog}
              disabled={!!c.archivedAt}
            >
              Change status
            </Button>
          </>
        }
      />

      <DetailLayout
        factsTitle="Case facts"
        facts={[
          { label: 'Received', value: formatDate(c.createdAt) },
          { label: 'Category', value: categoryLabel(c.category) },
          {
            label: 'Assigned officer',
            value: c.assignedToId
              ? (officers.get(c.assignedToId) ?? 'Assigned')
              : 'Unassigned',
          },
          {
            label: 'Current bureau',
            value:
              c.sourceBureauId !== c.bureauId
                ? `${c.bureauId} (filed at ${c.sourceBureauId})`
                : c.bureauId,
          },
          {
            label: 'Last action',
            value: lastAction
              ? `${ACTION_LABEL[lastAction.type]}, ${formatDate(lastAction.createdAt)}`
              : 'None yet',
          },
          {
            label: 'Next action required',
            value: nextStep(c, acts, pendingLinks.length > 0),
          },
          {
            label: 'Due',
            value: (
              <>
                {formatDate(c.dueAt)}
                {due && (
                  <span
                    className={
                      due.overdue ? 'block text-alert' : 'block text-subtle'
                    }
                  >
                    {due.text}
                  </span>
                )}
              </>
            ),
          },
          {
            label: c.resolvedAt ? 'Disposed' : 'Expected disposal',
            value: c.resolvedAt
              ? formatDate(c.resolvedAt)
              : `By ${formatDate(c.dueAt)} (30-day timeline)`,
          },
          {
            label: 'Linked cases',
            value: links.data?.items.length ? (
              <span className="grid gap-1">
                {links.data.items.map((l) => (
                  <span key={l.id} className="flex items-center gap-2">
                    <BureauTag code={l.otherComplaint.bureauCode} />
                    {l.otherComplaint.id ? (
                      <Link
                        to={`/complaints/${l.otherComplaint.id}`}
                        className="font-mono"
                      >
                        {otherRef.get(l.otherComplaint.id) ??
                          l.otherComplaint.id}
                      </Link>
                    ) : (
                      'Held privately'
                    )}
                  </span>
                ))}
              </span>
            ) : (
              'None'
            ),
          },
        ]}
      >
        <section className="border border-line bg-graphite-1 p-5">
          <h2 className="sr-only">Description</h2>
          <p className="max-w-[70ch] text-sm leading-6">{c.description}</p>
        </section>

        <section
          aria-label="Case records"
          className="grid gap-5 border border-line bg-graphite-1 p-5"
        >
          <Tabs
            id={uid}
            label="Case records"
            tabs={tabs}
            value={tab}
            onChange={setTab}
            className="self-start"
          />
          <TabPanel id={uid} value={tab}>
            {tab === 'history' &&
              (history.isPending ? (
                <Skeleton className="h-40" label="Loading history…" />
              ) : history.isError ? (
                <ErrorState
                  error={history.error}
                  onRetry={() => void history.refetch()}
                />
              ) : (
                <Timeline
                  label="Case history, newest first"
                  items={history.data.items.map((e, i) => ({
                    id: e.id,
                    at: e.createdAt,
                    ...describe(e, officers),
                    ...(i === 0 && !describe(e, officers).tone
                      ? { tone: 'current' as const }
                      : {}),
                  }))}
                />
              ))}

            {tab === 'actions' && (
              <div className="grid gap-5">
                {proposing ? (
                  <ProposeAction
                    complaintId={c.id}
                    onDone={() => setProposing(false)}
                  />
                ) : (
                  <Button
                    size="sm"
                    className="justify-self-start"
                    onClick={() => setProposing(true)}
                    disabled={c.status === 'DISPOSED'}
                  >
                    <Plus size={16} aria-hidden="true" /> Propose action
                  </Button>
                )}
                {actions.isPending ? (
                  <Skeleton className="h-32" />
                ) : acts.length ? (
                  <ul className="grid divide-y divide-line border-y border-line">
                    {acts.map((a) => (
                      <li
                        key={a.id}
                        className="grid gap-1 py-3 sm:grid-cols-[1fr_auto] sm:gap-4"
                      >
                        <div>
                          <p className="text-sm font-bold">
                            {ACTION_LABEL[a.type]}
                            {a.summary && (
                              <span className="font-normal">
                                {' '}
                                · {a.summary}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-subtle">
                            {a.evidenceScope && (
                              <span className="font-mono">
                                {a.evidenceScope} ·{' '}
                              </span>
                            )}
                            Planned {formatDate(a.createdAt)}
                            {a.createdById &&
                              ` by ${officers.get(a.createdById) ?? 'an officer'}`}
                          </p>
                        </div>
                        <p className="text-xs text-subtle sm:text-right">
                          <span className="font-bold text-snow">
                            {ACTION_STATUS[a.status]}
                          </span>
                          <br />
                          {a.dueAt
                            ? `Due ${formatDate(a.dueAt)}`
                            : 'No due date'}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState
                    title="No actions yet"
                    body="Propose one above. Setu checks other bureaus first."
                  />
                )}
              </div>
            )}

            {tab === 'overlaps' &&
              (links.isPending ? (
                <Skeleton className="h-32" />
              ) : links.data?.items.length ? (
                <ul className="grid gap-3">
                  {links.data.items.map((l) => {
                    const pct = Math.round(l.score * 100);
                    const pending = l.status === 'SUGGESTED';
                    return (
                      <li
                        key={l.id}
                        className={`grid gap-3 bg-graphite p-4 ${pending ? 'border-[1.5px] border-alert' : 'border border-line-2'}`}
                      >
                        <div className="flex flex-wrap items-center gap-3">
                          <span
                            className={`inline-flex items-center gap-1.5 text-sm font-bold ${pending ? 'text-alert' : 'text-indigo-hi'}`}
                          >
                            <GitCompareArrows size={16} aria-hidden="true" />
                            {pending
                              ? 'Possible overlap'
                              : l.status === 'CONFIRMED'
                                ? 'Linked'
                                : 'Rejected'}
                          </span>
                          <BureauTag code={l.otherComplaint.bureauCode} />
                          <span className="font-mono text-[13px]">
                            {l.otherComplaint.restricted
                              ? 'Held privately by that bureau'
                              : (otherRef.get(l.otherComplaint.id ?? '') ??
                                l.otherComplaint.id)}
                          </span>
                          <span className="ml-auto text-xs text-subtle tabular-nums">
                            Match confidence {pct}%
                          </span>
                        </div>
                        <ul
                          className="flex flex-wrap gap-2"
                          aria-label="Why these match"
                        >
                          {l.explanation.reasons.map((r) => (
                            <li
                              key={r}
                              className="border border-line-2 px-2 py-1 text-xs"
                            >
                              {r}
                            </li>
                          ))}
                        </ul>
                        <Link
                          to={`/investigations/${c.id}`}
                          className="link justify-self-start text-sm"
                        >
                          {pending
                            ? 'Open investigation'
                            : 'View investigation'}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <EmptyState
                  icon={GitCompareArrows}
                  title="No overlapping cases"
                  body="Setu found no open cases at other bureaus that look related."
                />
              ))}
          </TabPanel>
        </section>
      </DetailLayout>

      <ReasonDialog
        open={changing}
        onClose={() => setChanging(false)}
        title="change status"
        description={`${c.originalId} is ${STATUS_LABEL[c.status].toLowerCase()}.`}
        confirmLabel="Change status"
        concurrency={{ expectedVersion: c.version }}
        onReload={() => void detail.refetch()}
        onConfirm={async ({ reason, expectedVersion }) => {
          await updateComplaint(c.id, {
            expectedVersion: expectedVersion!,
            reason,
            status,
          });
          qc.invalidateQueries({ queryKey: complaintKeys.detail(c.id) });
          qc.invalidateQueries({ queryKey: ['complaints', 'timeline', c.id] });
          refreshAll();
        }}
      >
        <div>
          <label
            htmlFor={`${uid}-status`}
            className="block text-[15px] font-bold"
          >
            New status
          </label>
          <select
            id={`${uid}-status`}
            className="select mt-2 w-full"
            value={status}
            onChange={(e) => setStatus(e.target.value as ComplaintStatus)}
          >
            {STATUS_OPTIONS.filter((o) => o.value !== c.status).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </ReasonDialog>
    </div>
  );
}
