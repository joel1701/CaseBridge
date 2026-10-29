// Pieces shared by the complaint pages (list, details, institution profile, bureau queue).
import { useQueries, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { GitCompareArrows, Link2 } from 'lucide-react';
import type { Column } from '@/components/page';
import { BureauTag } from '@/components/ui/bureau-tag';
import { StatusPill } from '@/components/ui/status-pill';
import { bureauKeys, listBureaus, listOfficers } from '@/shared/api/bureaus';
import { institutionKeys, listInstitutions } from '@/shared/api/institutions';
import type { ComplaintListItem, ComplaintStatus } from '@/shared/types';

export const STATUS_LABEL: Record<ComplaintStatus, string> = {
  RECEIVED: 'Received',
  UNDER_PROCESS: 'Under process',
  TRANSFERRED: 'Transferred',
  ESCALATED: 'Escalated',
  DISPOSED: 'Disposed',
};
export const STATUS_OPTIONS = (
  Object.keys(STATUS_LABEL) as ComplaintStatus[]
).map((s) => ({
  value: s,
  label: STATUS_LABEL[s],
}));

export const CATEGORY_LABEL: Record<string, string> = {
  FEES: 'Fees',
  ADMISSION: 'Admission',
  FACULTY: 'Faculty',
  INFRASTRUCTURE: 'Infrastructure',
  APPROVAL: 'Approval',
  ACADEMIC: 'Academic',
};
export const categoryLabel = (c: string) => CATEGORY_LABEL[c] ?? c;

const dateFmt = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});
export const formatDate = (iso: string | null | undefined) =>
  iso ? dateFmt.format(new Date(iso)) : '—';

/** "3 days overdue" / "due in 20h" / "due in 6 days"; null when not relevant. */
export function dueState(
  c: { status: ComplaintStatus; dueAt: string | null },
  now = Date.now(),
) {
  if (!c.dueAt || c.status === 'DISPOSED') return null;
  const hours = Math.round((Date.parse(c.dueAt) - now) / 3_600_000);
  if (hours < 0) {
    const days = Math.max(1, Math.round(-hours / 24));
    return {
      overdue: true,
      text: `${days} ${days === 1 ? 'day' : 'days'} overdue`,
    };
  }
  if (hours < 24) return { overdue: false, text: `due in ${hours}h` };
  const days = Math.round(hours / 24);
  return {
    overdue: false,
    text: `due in ${days} ${days === 1 ? 'day' : 'days'}`,
  };
}

export function DueCell({ c }: { c: ComplaintListItem }) {
  const due = dueState(c);
  return (
    <span className="whitespace-nowrap tabular-nums">
      {formatDate(c.dueAt)}
      {due && (
        <span
          className={
            due.overdue
              ? 'block text-xs text-alert'
              : 'block text-xs text-subtle'
          }
        >
          {due.text}
        </span>
      )}
    </span>
  );
}

/** Icon plus text: red only while the overlap still needs a decision. */
export function OverlapMarker({
  c,
  to,
}: {
  c: Pick<ComplaintListItem, 'overlapReviewStatus' | 'id'>;
  to?: string;
}) {
  if (c.overlapReviewStatus === 'NOT_REVIEWED')
    return <span className="text-subtle">—</span>;
  const pending = c.overlapReviewStatus === 'PENDING';
  const body = (
    <span
      className={`relative z-[1] inline-flex items-center gap-1.5 text-xs ${pending ? 'text-alert' : 'text-indigo-hi'}`}
    >
      {pending ? (
        <GitCompareArrows size={14} aria-hidden="true" />
      ) : (
        <Link2 size={14} aria-hidden="true" />
      )}
      {pending ? 'Overlap' : 'Linked'}
    </span>
  );
  return to ? (
    <Link to={to} className="relative z-[1] no-underline hover:underline">
      {body}
    </Link>
  ) : (
    body
  );
}

/** Institution id -> summary, from GET /institutions (≤100 records). */
export function useInstitutionDirectory() {
  const q = useQuery({
    queryKey: institutionKeys.list({ pageSize: 100 }),
    queryFn: () => listInstitutions({ pageSize: 100 }),
    staleTime: 5 * 60_000,
  });
  return new Map((q.data?.items ?? []).map((i) => [i.id, i]));
}

/** Officer id -> name, from each bureau's officer list (only bureaus you may read). */
export function useOfficerNames() {
  const bureaus = useQuery({
    queryKey: bureauKeys.list(),
    queryFn: listBureaus,
    staleTime: 5 * 60_000,
  });
  const lists = useQueries({
    queries: (bureaus.data?.items ?? []).map((b) => ({
      queryKey: bureauKeys.officers(b.id, { pageSize: 100 }),
      queryFn: () => listOfficers(b.id, { pageSize: 100 }),
      staleTime: 5 * 60_000,
      retry: false,
    })),
  });
  const names = new Map<string, string>();
  for (const l of lists)
    for (const o of l.data?.items ?? []) names.set(o.id, o.displayName);
  return names;
}

/** The complaints table columns, used by the list, the bureau queue and the institution profile. */
export function complaintColumns({
  institutions,
  officers,
  showInstitution = true,
}: {
  institutions: Map<string, { name: string }>;
  officers: Map<string, string>;
  showInstitution?: boolean;
}): Column<ComplaintListItem>[] {
  return [
    {
      key: 'ref',
      header: 'Case ID',
      mobile: 'primary',
      cell: (c) => (
        <span className="font-mono whitespace-nowrap">{c.originalId}</span>
      ),
    },
    { key: 'title', header: 'Title', sortKey: 'title', cell: (c) => c.title },
    ...(showInstitution
      ? [
          {
            key: 'inst',
            header: 'Institution',
            cell: (c: ComplaintListItem) => (
              <span className="text-subtle">
                {institutions.get(c.institutionId)?.name ?? c.institutionId}
              </span>
            ),
          },
        ]
      : []),
    {
      key: 'bureau',
      header: 'Bureau',
      cell: (c) => <BureauTag code={c.bureauId} />,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (c) => <StatusPill status={c.status} />,
    },
    {
      key: 'officer',
      header: 'Assigned',
      mobile: 'hidden',
      cell: (c) =>
        c.assignedToId ? (
          (officers.get(c.assignedToId) ?? 'Assigned')
        ) : (
          <span className="text-subtle">Unassigned</span>
        ),
    },
    {
      key: 'due',
      header: 'Due',
      sortKey: 'dueAt',
      cell: (c) => <DueCell c={c} />,
    },
    {
      key: 'overlap',
      header: 'Overlap',
      cell: (c) => (
        <OverlapMarker
          c={c}
          to={
            c.overlapReviewStatus === 'PENDING'
              ? `/investigations/${c.id}`
              : undefined
          }
        />
      ),
    },
  ];
}
