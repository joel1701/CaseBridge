import { useId, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { FileSearch } from 'lucide-react';
import {
  DataTable,
  DetailLayout,
  EmptyState,
  ErrorState,
  FilterBar,
  PageHeader,
  ReasonDialog,
  TabPanel,
  Tabs,
  Timeline,
  useUrlState,
  type Column,
} from '@/components/page';
import { Button } from '@/components/ui/button';
import { BureauTag } from '@/components/ui/bureau-tag';
import { StatusPill } from '@/components/ui/status-pill';
import {
  complaintKeys,
  getComplaint,
  getComplaintTimeline,
  listComplaints,
} from '@/shared/api/complaints';
import { ApiError } from '@/shared/api/request';
import { institutions } from '@/shared/api/synthetic/core';
import type {
  ComplaintListItem,
  ComplaintSortBy,
  ComplaintStatus,
  TimelineEntry,
} from '@/shared/types';
import { Section } from './Section';

// Page-kit demos on synthetic data from the shared store. Nothing here changes the data.

const date = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});
const instName = (id: string) =>
  institutions.find((i) => i.id === id)?.name ?? id;
const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'RECEIVED', label: 'Received' },
  { value: 'UNDER_PROCESS', label: 'Under process' },
  { value: 'TRANSFERRED', label: 'Transferred' },
  { value: 'ESCALATED', label: 'Escalated' },
  { value: 'DISPOSED', label: 'Disposed' },
];

const columns: Column<ComplaintListItem>[] = [
  {
    key: 'ref',
    header: 'Reference',
    mobile: 'primary',
    cell: (c) => <span className="font-mono">{c.originalId}</span>,
  },
  { key: 'title', header: 'Title', sortKey: 'title', cell: (c) => c.title },
  {
    key: 'inst',
    header: 'Institution',
    cell: (c) => (
      <span className="text-subtle">{instName(c.institutionId)}</span>
    ),
  },
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
    key: 'created',
    header: 'Received',
    sortKey: 'createdAt',
    cell: (c) => (
      <span className="tabular-nums">{date.format(new Date(c.createdAt))}</span>
    ),
  },
  {
    key: 'due',
    header: 'Due',
    sortKey: 'dueAt',
    mobile: 'hidden',
    cell: (c) =>
      c.dueAt ? (
        <span className="tabular-nums">{date.format(new Date(c.dueAt))}</span>
      ) : (
        '—'
      ),
  },
];

function TableDemo() {
  const [url, setUrl] = useUrlState({
    q: '',
    status: '',
    sort: 'createdAt',
    dir: 'desc',
    page: '1',
  });
  const [forceLoading, setForceLoading] = useState(false);
  const [forceEmpty, setForceEmpty] = useState(false);
  const query = {
    q: url.q || undefined,
    status: (url.status || undefined) as ComplaintStatus | undefined,
    sortBy: url.sort as ComplaintSortBy,
    sortOrder: url.dir as 'asc' | 'desc',
    page: Number(url.page) || 1,
    pageSize: 8,
  };
  const list = useQuery({
    queryKey: complaintKeys.list(query),
    queryFn: () => listComplaints(query),
    placeholderData: keepPreviousData,
  });
  return (
    <div className="grid gap-5">
      <FilterBar
        values={url}
        onChange={setUrl}
        search={{
          key: 'q',
          label: 'Search',
          placeholder: 'Reference, title or description',
        }}
        selects={[{ key: 'status', label: 'Status', options: STATUS_OPTIONS }]}
      />
      <div className="flex flex-wrap gap-5 text-sm text-subtle">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={forceLoading}
            onChange={(e) => setForceLoading(e.target.checked)}
          />{' '}
          Show loading
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={forceEmpty}
            onChange={(e) => setForceEmpty(e.target.checked)}
          />{' '}
          Show empty
        </label>
        <span>URL: {window.location.search || '(defaults)'}</span>
      </div>
      <div className="border border-line bg-graphite-1 p-5">
        <DataTable
          caption="Synthetic complaints"
          columns={columns}
          rows={forceLoading ? undefined : forceEmpty ? [] : list.data?.items}
          rowKey={(c) => c.id}
          rowHref={(c) => `/complaints/${c.id}`}
          rowLabel={(c) => `${c.originalId}: ${c.title}`}
          loading={forceLoading || list.isFetching}
          sort={{ key: url.sort, dir: url.dir as 'asc' | 'desc' }}
          onSort={(s) => setUrl({ sort: s.key, dir: s.dir })}
          meta={forceLoading || forceEmpty ? undefined : list.data?.meta}
          onPage={(p) => setUrl({ page: String(p) })}
        />
      </div>
    </div>
  );
}

const eventTitle: Record<string, (e: TimelineEntry) => string> = {
  COMPLAINT_CREATED: () => 'Complaint received',
  COMPLAINT_ASSIGNED: () => 'Assigned to an officer',
  COMPLAINT_STATUS_CHANGED: (e) =>
    `Status changed to ${String(e.metadata.toStatus ?? '')
      .toLowerCase()
      .replace('_', ' ')}`,
  ACTION_CREATED: (e) =>
    `Action planned: ${String(e.metadata.type ?? '')
      .toLowerCase()
      .replace('_', ' ')}`,
  CASE_LINK_REVIEWED: () => 'Link with another bureau reviewed',
};

function DetailDemo() {
  const detail = useQuery({
    queryKey: complaintKeys.detail('cmp-001'),
    queryFn: () => getComplaint('cmp-001'),
  });
  const history = useQuery({
    queryKey: complaintKeys.timeline('cmp-001'),
    queryFn: () => getComplaintTimeline('cmp-001'),
  });
  const c = detail.data?.data;
  const items = (history.data?.items ?? []).map((e, i) => ({
    id: e.id,
    at: e.createdAt,
    title:
      eventTitle[e.event]?.(e) ?? e.event.toLowerCase().replaceAll('_', ' '),
    tone: i === 0 ? ('current' as const) : undefined,
  }));
  return (
    <DetailLayout
      factsTitle="Case facts"
      facts={
        c
          ? [
              { label: 'Reference', value: c.originalId },
              { label: 'Institution', value: instName(c.institutionId) },
              { label: 'Bureau', value: c.bureauId },
              { label: 'Received', value: date.format(new Date(c.createdAt)) },
              {
                label: 'Due',
                value: c.dueAt ? date.format(new Date(c.dueAt)) : '—',
              },
            ]
          : [{ label: 'Loading', value: '…' }]
      }
    >
      <div className="border border-line bg-graphite-1 p-5">
        <h3 className="font-bold">{c?.title ?? 'Loading…'}</h3>
        <p className="mt-2 text-sm text-subtle">{c?.description}</p>
      </div>
      <div className="border border-line bg-graphite-1 p-5">
        <h3 className="mb-4 font-bold">History</h3>
        <Timeline label="Case history" items={items} />
      </div>
    </DetailLayout>
  );
}

function DialogDemo() {
  const [open, setOpen] = useState(false);
  const [stale, setStale] = useState(false);
  const [status, setStatus] = useState('UNDER_PROCESS');
  const [result, setResult] = useState('');
  const uid = useId();
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <Button onClick={() => setOpen(true)}>Change status</Button>
        <label className="flex items-center gap-2 text-sm text-subtle">
          <input
            type="checkbox"
            checked={stale}
            onChange={(e) => setStale(e.target.checked)}
          />{' '}
          Simulate someone else changing the case first
        </label>
      </div>
      <p role="status" className="text-sm text-subtle">
        {result}
      </p>
      <ReasonDialog
        open={open}
        onClose={() => setOpen(false)}
        title="change status"
        description="PGRC-DEMO-001 · Aaravika Institute of Engineering. Demo only: nothing is saved."
        confirmLabel="Change status"
        concurrency={{ expectedVersion: 0 }}
        onReload={() => setResult('Reloaded the latest version (demo).')}
        onConfirm={async ({ reason, expectedVersion }) => {
          await new Promise((r) => setTimeout(r, 600));
          if (stale)
            throw new ApiError(
              409,
              'STALE_COMPLAINT',
              'Complaint changed since it was read',
            );
          setResult(
            `Would send status ${status}, expectedVersion ${expectedVersion}, reason "${reason}".`,
          );
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
            onChange={(e) => setStatus(e.target.value)}
          >
            {STATUS_OPTIONS.slice(1).map((o) => (
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

const demoTabs = [
  { key: 'history', label: 'History' },
  { key: 'actions', label: 'Actions' },
  { key: 'links', label: 'Related cases' },
] as const;

function TabsDemo() {
  const [tab, setTab] = useState<(typeof demoTabs)[number]['key']>('history');
  const uid = useId();
  return (
    <div className="grid gap-4">
      <Tabs
        id={uid}
        label="Case views"
        tabs={demoTabs}
        value={tab}
        onChange={setTab}
        className="self-start"
      />
      <TabPanel
        id={uid}
        value={tab}
        className="border border-line bg-graphite-1 p-5 text-sm"
      >
        {tab === 'history' &&
          'Every status change, assignment and review, newest first.'}
        {tab === 'actions' &&
          'Evidence requests, notices and inspections planned on this case.'}
        {tab === 'links' &&
          'Cases at other bureaus that Setu thinks are about the same thing.'}
      </TabPanel>
    </div>
  );
}

export function PageKitSections() {
  return (
    <>
      <Section title="page header">
        <div className="grid gap-10">
          <PageHeader
            title="complaints"
            description="Every complaint your bureau can see."
            actions={<Button size="sm">New complaint</Button>}
          />
          <PageHeader
            title="bureau queue"
            description="Cases waiting for your bureau."
            scope="SYNTHETIC"
          />
        </div>
      </Section>

      <Section title="filters and data table">
        <TableDemo />
      </Section>

      <Section title="detail layout and timeline">
        <DetailDemo />
      </Section>

      <Section title="reason dialog">
        <DialogDemo />
      </Section>

      <Section title="tabs">
        <TabsDemo />
      </Section>

      <Section title="empty and error states">
        <div className="grid gap-6 lg:grid-cols-2">
          <EmptyState
            icon={FileSearch}
            title="No overlapping cases right now"
            body="Setu checks every new case against open ones at other bureaus."
            action={
              <Button variant="ghost" size="sm">
                Open the complaints list
              </Button>
            }
          />
          <div className="grid content-start gap-4">
            <ErrorState
              error={new ApiError(404, 'NOT_FOUND', 'Complaint not found')}
              onRetry={() => undefined}
            />
            <ErrorState
              error={new ApiError(409, 'STALE_COMPLAINT', '')}
              title="Couldn't save"
              onRetry={() => undefined}
            />
          </div>
        </div>
      </Section>
    </>
  );
}
