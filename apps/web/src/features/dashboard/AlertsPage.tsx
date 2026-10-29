import { useState } from 'react';
import { Link } from 'react-router';
import {
  keepPreviousData,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  ArrowUpRight,
  Bell,
  CircleCheck,
  Clock,
  GitMerge,
  RefreshCw,
  TriangleAlert,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import {
  EmptyState,
  ErrorState,
  PageHeader,
  Pagination,
  TabPanel,
  Tabs,
  useUrlState,
} from '@/components/page';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { alertKeys, listAlerts, updateAlert } from '@/shared/api/alerts';
import { complaintKeys, getComplaint } from '@/shared/api/complaints';
import { getInstitution, institutionKeys } from '@/shared/api/institutions';
import { cn } from '@/shared/utils/cn';
import type { AlertItem, AlertListQuery } from '@/shared/types';

type TabKey = 'unread' | 'all' | 'resolved';
const TABS = [
  { key: 'unread', label: 'Unread' },
  { key: 'all', label: 'All' },
  { key: 'resolved', label: 'Resolved' },
] as const;
const QUERY: Record<TabKey, AlertListQuery> = {
  unread: { unreadOnly: true, resolved: 'false' },
  all: { resolved: 'all' },
  resolved: { resolved: 'true' },
};
const PAGE_SIZE = 20;

interface Kind {
  label: string;
  icon: LucideIcon;
  /** Only overlaps and overdue cases use the alert colour. */
  alert: boolean;
}
function kindOf(a: AlertItem): Kind {
  switch (a.type) {
    case 'OVERLAP':
      return { label: 'Overlap', icon: GitMerge, alert: true };
    case 'DEADLINE':
      return a.dedupeKey?.endsWith(':overdue') ||
        a.id.startsWith('alert-overdue')
        ? { label: 'Overdue', icon: TriangleAlert, alert: true }
        : { label: 'Deadline approaching', icon: Clock, alert: false };
    case 'ESCALATION':
      return { label: 'Escalation', icon: ArrowUpRight, alert: false };
    case 'ACTION_CONFLICT':
      return { label: 'Action conflict', icon: Zap, alert: false };
    default:
      return { label: 'Status change', icon: RefreshCw, alert: false };
  }
}

const when = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Asia/Kolkata',
});

function AlertRow({
  alert: a,
  caseLabel,
  institution,
  busy,
  onUpdate,
}: {
  alert: AlertItem;
  caseLabel?: string;
  institution?: { id: string; name: string };
  busy: boolean;
  onUpdate: (body: { read?: boolean; resolved?: boolean }) => void;
}) {
  const kind = kindOf(a);
  const Icon = kind.icon;
  const unread = !a.readAt;
  return (
    <li
      className={cn(
        'grid gap-3 border-b border-line px-4 py-4 last:border-b-0 md:grid-cols-[180px_minmax(0,1fr)_auto] md:items-center',
        unread && 'bg-graphite-1',
      )}
    >
      <p
        className={cn(
          'flex items-center gap-2 text-sm font-bold',
          kind.alert ? 'text-alert' : 'text-indigo-hi',
        )}
      >
        <Icon size={16} aria-hidden="true" className="flex-none" />
        {kind.label}
        {unread && <span className="sr-only">, unread</span>}
      </p>
      <div className="min-w-0">
        <p className={cn('text-sm', unread ? 'text-snow' : 'text-subtle')}>
          {a.message}
        </p>
        <p className="mt-1 flex flex-wrap gap-x-2 text-xs text-subtle">
          {a.complaintId && (
            <Link
              to={
                a.type === 'OVERLAP'
                  ? `/investigations/${a.complaintId}`
                  : `/complaints/${a.complaintId}`
              }
              className="font-mono text-snow hover:underline"
            >
              {caseLabel ?? a.complaintId}
            </Link>
          )}
          {institution && (
            <>
              <span aria-hidden="true">·</span>
              <Link
                to={`/institutions/${institution.id}`}
                className="hover:underline"
              >
                {institution.name}
              </Link>
            </>
          )}
          <span aria-hidden="true">·</span>
          <time dateTime={a.createdAt}>
            {when.format(new Date(a.createdAt))}
          </time>
          {a.resolvedAt && (
            <>
              <span aria-hidden="true">·</span>
              <span>Resolved</span>
            </>
          )}
        </p>
      </div>
      <div className="flex flex-wrap gap-2 md:justify-end">
        {!a.resolvedAt && (
          <Button
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={() => onUpdate({ read: unread })}
          >
            {unread ? 'Mark read' : 'Mark unread'}
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          disabled={busy}
          onClick={() => onUpdate({ resolved: !a.resolvedAt, read: true })}
        >
          {a.resolvedAt ? (
            'Reopen'
          ) : (
            <>
              <CircleCheck size={16} aria-hidden="true" />
              Resolve
            </>
          )}
        </Button>
      </div>
    </li>
  );
}

export function AlertsPage() {
  const qc = useQueryClient();
  const [url, setUrl] = useUrlState({ tab: 'unread', page: '1' });
  const tab: TabKey = TABS.some((t) => t.key === url.tab)
    ? (url.tab as TabKey)
    : 'unread';
  const page = Math.max(1, Number(url.page) || 1);
  const [announcement, setAnnouncement] = useState('');

  const q = { ...QUERY[tab], page, pageSize: PAGE_SIZE };
  const alerts = useQuery({
    queryKey: alertKeys.list(q),
    queryFn: () => listAlerts(q),
    placeholderData: keepPreviousData,
  });
  const items = alerts.data?.items ?? [];

  // Case and institution names for the links on each row.
  const caseIds = [
    ...new Set(items.flatMap((a) => (a.complaintId ? [a.complaintId] : []))),
  ];
  const cases = useQueries({
    queries: caseIds.map((id) => ({
      queryKey: complaintKeys.detail(id),
      queryFn: () => getComplaint(id),
      staleTime: 60_000,
    })),
  });
  const caseById = new Map(
    cases.flatMap((r) => (r.data ? [[r.data.data.id, r.data.data]] : [])),
  );
  const instIds = [
    ...new Set([...caseById.values()].map((c) => c.institutionId)),
  ];
  const insts = useQueries({
    queries: instIds.map((id) => ({
      queryKey: institutionKeys.detail(id),
      queryFn: () => getInstitution(id),
      staleTime: 60_000,
    })),
  });
  const instById = new Map(
    insts.flatMap((r) => (r.data ? [[r.data.data.id, r.data.data]] : [])),
  );

  const update = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: { read?: boolean; resolved?: boolean };
    }) => updateAlert(id, body),
    onSuccess: (_r, { body }) =>
      setAnnouncement(
        body.resolved === true
          ? 'Alert resolved.'
          : body.resolved === false
            ? 'Alert reopened.'
            : body.read
              ? 'Marked read.'
              : 'Marked unread.',
      ),
    onError: () => setAnnouncement("Couldn't update the alert. Try again."),
    // One prefix covers this list and the header bell's unread count.
    onSettled: () => qc.invalidateQueries({ queryKey: alertKeys.all }),
  });

  const markAllRead = useMutation({
    mutationFn: () =>
      Promise.all(
        items
          .filter((a) => !a.readAt)
          .map((a) => updateAlert(a.id, { read: true })),
      ),
    onSuccess: () => setAnnouncement('All alerts on this page marked read.'),
    onSettled: () => qc.invalidateQueries({ queryKey: alertKeys.all }),
  });

  const emptyText: Record<TabKey, string> = {
    unread: "You're caught up. New overlaps and deadlines appear here.",
    all: 'No alerts yet.',
    resolved: 'Nothing has been resolved yet.',
  };

  return (
    <div className="grid gap-8">
      <PageHeader
        title="alerts"
        scope={alerts.data?.scope}
        description="Overlaps, deadlines and escalations for your bureau. Read and resolved states are shared with your bureau."
        actions={
          tab !== 'resolved' &&
          items.some((a) => !a.readAt) && (
            <Button
              variant="ghost"
              size="sm"
              disabled={markAllRead.isPending}
              onClick={() => markAllRead.mutate()}
            >
              Mark page read
            </Button>
          )
        }
      />
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <div className="grid gap-4">
        <Tabs
          id="alerts"
          label="Alert views"
          tabs={TABS}
          value={tab}
          onChange={(k) => setUrl({ tab: k })}
          className="justify-self-start"
        />
        <TabPanel id="alerts" value={tab}>
          {alerts.isPending ? (
            <div className="grid gap-2" aria-busy="true">
              <Skeleton className="h-16" label="Loading alerts…" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          ) : alerts.error ? (
            <ErrorState
              error={alerts.error}
              onRetry={() => void alerts.refetch()}
            />
          ) : items.length ? (
            <>
              <ul
                aria-label={`${TABS.find((t) => t.key === tab)?.label} alerts`}
                className={cn(
                  'border border-line bg-graphite',
                  alerts.isPlaceholderData && 'opacity-60',
                )}
              >
                {items.map((a) => {
                  const c = a.complaintId
                    ? caseById.get(a.complaintId)
                    : undefined;
                  const inst = c ? instById.get(c.institutionId) : undefined;
                  return (
                    <AlertRow
                      key={a.id}
                      alert={a}
                      caseLabel={c?.originalId}
                      institution={inst && { id: inst.id, name: inst.name }}
                      busy={
                        (update.isPending && update.variables?.id === a.id) ||
                        markAllRead.isPending
                      }
                      onUpdate={(body) => update.mutate({ id: a.id, body })}
                    />
                  );
                })}
              </ul>
              {alerts.data && (
                <Pagination
                  meta={alerts.data.meta}
                  onPage={(p) => setUrl({ page: String(p) })}
                />
              )}
            </>
          ) : (
            <EmptyState icon={Bell} title="No alerts" body={emptyText[tab]} />
          )}
        </TabPanel>
      </div>
    </div>
  );
}
