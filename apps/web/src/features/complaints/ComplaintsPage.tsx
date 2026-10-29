import { useMemo } from 'react';
import { Link } from 'react-router';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useBureau } from '@/components/layout/BureauContext';
import {
  DataTable,
  ErrorState,
  FilterBar,
  PageHeader,
  useUrlState,
} from '@/components/page';
import { Button } from '@/components/ui/button';
import { complaintKeys, listComplaints } from '@/shared/api/complaints';
import type {
  ComplaintListQuery,
  ComplaintSortBy,
  ComplaintStatus,
  ComplaintView,
} from '@/shared/types';
import {
  CATEGORY_LABEL,
  STATUS_OPTIONS,
  complaintColumns,
  useInstitutionDirectory,
  useOfficerNames,
} from './shared';

const SORTS = [
  { value: 'createdAt:desc', label: 'Newest received' },
  { value: 'createdAt:asc', label: 'Oldest received' },
  { value: 'dueAt:asc', label: 'Due soonest' },
  { value: 'updatedAt:desc', label: 'Recently updated' },
  { value: 'title:asc', label: 'Title A–Z' },
];
// The dashboard tiles link here with ?filter=pending and ?filter=overdue.
const VIEWS: Record<string, ComplaintView> = {
  pending: 'open',
  overdue: 'overdue',
};

export function ComplaintsPage() {
  const [url, setUrl] = useUrlState({
    q: '',
    status: '',
    category: '',
    filter: '',
    sort: 'createdAt:desc',
    page: '1',
  });
  const { bureau } = useBureau();
  const institutions = useInstitutionDirectory();
  const officers = useOfficerNames();
  const [sortBy, sortOrder] = url.sort.split(':') as [
    ComplaintSortBy,
    'asc' | 'desc',
  ];

  const query: ComplaintListQuery = {
    q: url.q || undefined,
    status: (url.status || undefined) as ComplaintStatus | undefined,
    category: url.category || undefined,
    view: VIEWS[url.filter],
    // "Other" spans several bureaus, which the API's single bureauId can't express.
    bureauId: bureau === 'RB' || bureau === 'PGRC' ? bureau : undefined,
    sortBy,
    sortOrder,
    page: Number(url.page) || 1,
    pageSize: 20,
  };
  const list = useQuery({
    queryKey: complaintKeys.list(query),
    queryFn: () => listComplaints(query),
    placeholderData: keepPreviousData,
  });
  const columns = useMemo(
    () => complaintColumns({ institutions, officers }),
    [institutions, officers],
  );

  return (
    <div className="grid gap-6">
      <PageHeader
        title="complaints"
        description={
          bureau === 'OTHER'
            ? 'Showing every bureau; choose RB or PGRC in the header to narrow.'
            : bureau === 'ALL'
              ? 'Every complaint in your scope.'
              : `Complaints held by ${bureau}.`
        }
        scope={list.data?.scope}
        actions={
          <Button asChild>
            <Link to="/complaints/new">
              <Plus size={18} aria-hidden="true" /> New complaint
            </Link>
          </Button>
        }
      />
      <FilterBar
        values={url}
        onChange={setUrl}
        search={{
          key: 'q',
          label: 'Search',
          placeholder: 'Title, case ID or description',
        }}
        selects={[
          {
            key: 'filter',
            label: 'Show',
            options: [
              { value: '', label: 'All cases' },
              { value: 'pending', label: 'Open (pending)' },
              { value: 'overdue', label: 'Overdue' },
            ],
          },
          {
            key: 'status',
            label: 'Status',
            options: [{ value: '', label: 'All statuses' }, ...STATUS_OPTIONS],
          },
          {
            key: 'category',
            label: 'Category',
            options: [
              { value: '', label: 'All categories' },
              ...Object.entries(CATEGORY_LABEL).map(([value, label]) => ({
                value,
                label,
              })),
            ],
          },
          { key: 'sort', label: 'Sort', options: SORTS, clearable: false },
        ]}
      />
      {list.isError ? (
        <ErrorState error={list.error} onRetry={() => void list.refetch()} />
      ) : (
        <section
          aria-label="Complaints"
          className="border border-line bg-graphite-1 p-5"
        >
          <DataTable
            caption="Complaints"
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
        </section>
      )}
    </div>
  );
}
