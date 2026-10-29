import { useId, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { Check, Network } from 'lucide-react';
import {
  EmptyState,
  ErrorState,
  PageHeader,
  ReasonDialog,
} from '@/components/page';
import { BureauTag } from '@/components/ui/bureau-tag';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusPill } from '@/components/ui/status-pill';
import { complaintKeys, getComplaint } from '@/shared/api/complaints';
import {
  coordinationKeys,
  createWorkspace,
  listWorkspaces,
  recordCoordination,
} from '@/shared/api/coordination';
import { getInstitution, institutionKeys } from '@/shared/api/institutions';
import {
  intelligenceKeys,
  listLinks,
  reviewLink,
} from '@/shared/api/intelligence';
import { cn } from '@/shared/utils/cn';
import type {
  CaseLinkStatus,
  ComplaintDetail,
  CoordinationDecision,
  CoordinationType,
  InstitutionProfile,
  LinkSummary,
} from '@/shared/types';
import { CoordinationWorkspace } from './CoordinationWorkspace';
import { COORDINATION_TYPES } from './coordinationTypes';

const date = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'Asia/Kolkata',
});

const linkStatusLabel: Record<CaseLinkStatus, string> = {
  SUGGESTED: 'Suggested link',
  CONFIRMED: 'Confirmed link',
  REJECTED: 'Rejected link',
};

/** Every page that shows a link's status, a case's review state or its alerts. */
function invalidateLinked(qc: QueryClient) {
  for (const key of [
    ['intelligence'],
    ['complaints'],
    ['alerts'],
    ['coordination'],
    ['dashboard-overview'],
  ])
    void qc.invalidateQueries({ queryKey: key });
}

// One desk's case, styled like the landing page's two-desks cards.
function CaseCard({
  c,
  institution,
  match,
}: {
  c: ComplaintDetail;
  institution?: InstitutionProfile;
  match: { institution: boolean; category: boolean };
}) {
  const hit = 'text-indigo-hi';
  return (
    <article
      aria-label={`${c.bureauId} case ${c.originalId}`}
      className={cn(
        'grid min-w-0 content-start gap-3 border bg-graphite-1 p-5',
        match.institution ? 'border-indigo/50' : 'border-line',
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <BureauTag code={c.bureauId} />
        <StatusPill status={c.status} />
      </div>
      <h2 className="font-display text-[26px] leading-[0.92] font-bold lowercase [font-stretch:75%]">
        <Link
          to={`/institutions/${c.institutionId}`}
          className={cn('hover:underline', match.institution && hit)}
        >
          {institution?.name ?? c.institutionId}
        </Link>
      </h2>
      <p
        className={cn(
          'font-mono text-[13px]',
          match.institution ? hit : 'text-subtle',
        )}
      >
        {institution?.permanentId ?? '—'}
      </p>
      <dl className="spec spec--sm grid-cols-1">
        <div>
          <dt>Case</dt>
          <dd>
            <Link
              to={`/complaints/${c.id}`}
              className="font-mono hover:underline"
            >
              {c.originalId}
            </Link>
          </dd>
        </div>
        <div>
          <dt>Title</dt>
          <dd>{c.title}</dd>
        </div>
        <div>
          <dt>Category</dt>
          <dd className={cn(match.category && hit)}>{c.category}</dd>
        </div>
        <div>
          <dt>Received</dt>
          <dd>
            <time dateTime={c.createdAt}>
              {date.format(new Date(c.createdAt))}
            </time>
          </dd>
        </div>
      </dl>
    </article>
  );
}

function RestrictedCard({ bureau }: { bureau: string }) {
  return (
    <article className="grid content-start gap-3 border border-line bg-graphite-1 p-5">
      <BureauTag code={bureau} />
      <p className="text-sm text-subtle">
        This case belongs to another bureau and is outside your scope. Its
        details stay with {bureau}.
      </p>
    </article>
  );
}

function WhyMatched({ link }: { link: LinkSummary }) {
  const pct = Math.round(link.score * 100);
  const id = useId();
  return (
    <section
      aria-labelledby={`${id}-title`}
      className="grid gap-5 border border-line bg-graphite-1 p-5 lg:p-6"
    >
      <h2
        id={`${id}-title`}
        className="font-display text-[clamp(26px,2.2vw,34px)] leading-none font-bold lowercase [font-stretch:75%]"
      >
        why setu matched these
      </h2>
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_240px]">
        <ul className="grid content-start gap-2" aria-label="Reasons">
          {link.explanation.reasons.map((r) => (
            <li
              key={r}
              className="flex items-center gap-3 border border-line-2 px-3 py-2 text-sm"
            >
              <Check
                size={16}
                strokeWidth={2.5}
                aria-hidden="true"
                className="flex-none text-indigo-hi"
              />
              {r}
            </li>
          ))}
        </ul>
        <div>
          <div className="flex justify-between text-xs">
            <span className="text-subtle" id={`${id}-conf`}>
              Match confidence
            </span>
            <span className="font-bold tabular-nums">{pct}%</span>
          </div>
          <div
            role="meter"
            aria-labelledby={`${id}-conf`}
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuetext={`${pct}%`}
            className="mt-2 h-1.5 bg-panel"
          >
            <div className="h-full bg-indigo" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
      <p className="max-w-[70ch] text-sm text-subtle">
        This is a suggestion to support the officer. Setu doesn&apos;t decide
        whether the cases are related; a bureau head confirms or rejects it,
        with a reason that goes into both case histories.
      </p>
    </section>
  );
}

function CoordinationTypeField({
  value,
  onChange,
}: {
  value: CoordinationType;
  onChange: (v: CoordinationType) => void;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="block text-[15px] font-bold">
        Decision
      </label>
      <select
        id={id}
        className="select mt-2 w-full"
        value={value}
        onChange={(e) => onChange(e.target.value as CoordinationType)}
      >
        {COORDINATION_TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function InvestigationSkeleton() {
  return (
    <div className="grid gap-6" aria-busy="true">
      <Skeleton className="h-14 w-72" label="Loading investigation…" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
      <Skeleton className="h-48" />
    </div>
  );
}

export function InvestigationPage() {
  const { id: caseId = '' } = useParams();
  const [search, setSearch] = useSearchParams();
  const qc = useQueryClient();
  const [dialog, setDialog] = useState<
    'CONFIRMED' | 'REJECTED' | 'COORDINATE' | null
  >(null);
  const [coordType, setCoordType] =
    useState<CoordinationType>('SHARE_EVIDENCE');
  const [decision, setDecision] = useState<CoordinationDecision | null>(null);
  const [announcement, setAnnouncement] = useState('');

  const links = useQuery({
    queryKey: intelligenceKeys.links(caseId),
    queryFn: () => listLinks(caseId),
  });
  const items = links.data?.items ?? [];
  const link =
    items.find((l) => l.id === search.get('link')) ??
    items.find((l) => l.status !== 'REJECTED') ??
    items[0];
  const otherId = link?.otherComplaint.id ?? null;

  const caseQueries = useQueries({
    queries: [caseId, otherId].map((id) => ({
      queryKey: complaintKeys.detail(id ?? ''),
      queryFn: () => getComplaint(id!),
      enabled: !!id,
    })),
  });
  const [mine, other] = caseQueries.map((q) => q.data?.data);
  const instQueries = useQueries({
    queries: [mine?.institutionId, other?.institutionId].map((id) => ({
      queryKey: institutionKeys.detail(id ?? ''),
      queryFn: () => getInstitution(id!),
      enabled: !!id,
    })),
  });
  const [mineInst, otherInst] = instQueries.map((q) => q.data?.data);

  const workspace = useQuery({
    queryKey: coordinationKeys.workspaces({ caseLinkId: link?.id }),
    queryFn: () => listWorkspaces({ caseLinkId: link!.id }),
    enabled: link?.status === 'CONFIRMED',
  });
  const ws = workspace.data?.items[0];

  const decide = useMutation({
    mutationFn: async (v: { type: CoordinationType; rationale: string }) => {
      const d = await recordCoordination({ caseLinkId: link!.id, ...v });
      if (v.type !== 'KEEP_SEPARATE')
        await createWorkspace({ caseLinkId: link!.id });
      return d.data;
    },
    onSuccess: (d) => {
      setDecision(d);
      setAnnouncement('Coordination decision recorded.');
    },
    onSettled: () => invalidateLinked(qc),
  });

  if (links.isPending || caseQueries[0].isPending)
    return <InvestigationSkeleton />;
  const loadError = links.error ?? caseQueries[0].error;
  if (loadError)
    return (
      <ErrorState
        error={loadError}
        onRetry={() => {
          void links.refetch();
          void caseQueries[0].refetch();
        }}
      />
    );
  const scope = links.data?.scope;

  const header = (
    <PageHeader
      title="investigation"
      scope={scope}
      description={
        mine && (
          <>
            Case <span className="font-mono">{mine.originalId}</span> at{' '}
            {mineInst?.name ?? mine.institutionId}
          </>
        )
      }
      actions={
        mine && (
          <Button asChild variant="ghost" size="sm">
            <Link to={`/graph/${mine.institutionId}`}>
              <Network size={16} aria-hidden="true" />
              View knowledge graph
            </Link>
          </Button>
        )
      }
    />
  );

  if (!link || !mine)
    return (
      <div className="grid gap-8">
        {header}
        <EmptyState
          title="No linked cases"
          body="Setu hasn't suggested a link for this case. Overlaps appear here when another bureau files a matching complaint."
          action={
            <Button asChild variant="ghost" size="sm">
              <Link to={`/complaints/${caseId}`}>View complaint</Link>
            </Button>
          }
        />
      </div>
    );

  const match = {
    institution: !!other && other.institutionId === mine.institutionId,
    category: !!other && other.category === mine.category,
  };
  const recorded = decision?.caseLinkId === link.id ? decision : null;

  return (
    <div className="grid gap-8">
      {header}
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>

      {items.length > 1 && (
        <nav aria-label="Linked cases" className="flex flex-wrap gap-2">
          {items.map((l) => (
            <Button
              key={l.id}
              size="sm"
              variant={l.id === link.id ? 'primary' : 'ghost'}
              aria-current={l.id === link.id || undefined}
              onClick={() =>
                setSearch(
                  { link: l.id },
                  { replace: true, preventScrollReset: true },
                )
              }
            >
              With {l.otherComplaint.bureauCode}
            </Button>
          ))}
        </nav>
      )}

      <section aria-label="Linked cases" className="grid gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={cn(
              'border px-2 py-1 text-xs leading-none font-medium',
              link.status === 'SUGGESTED' && 'border-alert text-alert',
              link.status === 'CONFIRMED' && 'border-indigo text-indigo-hi',
              link.status === 'REJECTED' && 'border-line-2 text-subtle',
            )}
          >
            {linkStatusLabel[link.status]}
          </span>
          <span className="text-sm text-subtle">
            Coordination between {mine.bureauId} and{' '}
            {link.otherComplaint.bureauCode}
          </span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <CaseCard c={mine} institution={mineInst} match={match} />
          {other ? (
            <CaseCard c={other} institution={otherInst} match={match} />
          ) : link.otherComplaint.restricted ? (
            <RestrictedCard bureau={link.otherComplaint.bureauCode} />
          ) : (
            <Skeleton className="h-72" label="Loading linked case…" />
          )}
        </div>
      </section>

      <WhyMatched link={link} />

      {link.status === 'SUGGESTED' && (
        <section
          aria-label="Review the link"
          className="flex flex-wrap items-center justify-between gap-4 border border-line bg-graphite-1 p-5"
        >
          <p className="max-w-[60ch] text-sm">
            Are these the same matter? Confirming lets both bureaus coordinate;
            rejecting removes the suggestion.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={() => setDialog('REJECTED')}>
              Reject link
            </Button>
            <Button onClick={() => setDialog('CONFIRMED')}>Confirm link</Button>
          </div>
        </section>
      )}

      {link.status === 'REJECTED' && (
        <p className="border border-line bg-graphite-1 p-5 text-sm text-subtle">
          This suggestion was rejected. The cases continue separately in each
          bureau.
        </p>
      )}

      {link.status === 'CONFIRMED' &&
        (workspace.isPending ? (
          <Skeleton className="h-48" label="Loading coordination…" />
        ) : workspace.error ? (
          <ErrorState
            error={workspace.error}
            onRetry={() => void workspace.refetch()}
          />
        ) : ws ? (
          <CoordinationWorkspace workspace={ws} decision={recorded} />
        ) : recorded ? (
          <section className="border border-line bg-graphite-1 p-5 text-sm">
            <p className="font-bold">
              Decision recorded:{' '}
              {COORDINATION_TYPES.find((t) => t.value === recorded.type)?.label}
            </p>
            <p className="mt-1 text-subtle">{recorded.rationale}</p>
          </section>
        ) : (
          <section
            aria-label="Record coordination"
            className="flex flex-wrap items-center justify-between gap-4 border border-indigo bg-graphite-1 p-5"
          >
            <div>
              <p className="font-bold">The link is confirmed.</p>
              <p className="mt-1 max-w-[60ch] text-sm text-subtle">
                Record how {mine.bureauId} and {link.otherComplaint.bureauCode}{' '}
                will coordinate. A workspace opens to track the shared work.
              </p>
            </div>
            <Button onClick={() => setDialog('COORDINATE')}>
              Record coordination
            </Button>
          </section>
        ))}

      <ReasonDialog
        open={dialog === 'CONFIRMED' || dialog === 'REJECTED'}
        onClose={() => setDialog(null)}
        title={dialog === 'CONFIRMED' ? 'confirm link' : 'reject link'}
        description={
          dialog === 'CONFIRMED'
            ? 'Both bureaus will see these cases as one matter and can coordinate.'
            : 'The suggestion is closed and the cases continue separately.'
        }
        confirmLabel={dialog === 'CONFIRMED' ? 'Confirm link' : 'Reject link'}
        concurrency={{ expectedUpdatedAt: link.updatedAt }}
        onReload={() => invalidateLinked(qc)}
        onConfirm={async ({ reason, expectedUpdatedAt }) => {
          const status = dialog === 'CONFIRMED' ? 'CONFIRMED' : 'REJECTED';
          await reviewLink(link.id, {
            status,
            reason,
            expectedUpdatedAt: expectedUpdatedAt ?? '',
          });
          setAnnouncement(
            status === 'CONFIRMED' ? 'Link confirmed.' : 'Link rejected.',
          );
          await qc.invalidateQueries({ queryKey: intelligenceKeys.all });
          invalidateLinked(qc);
        }}
      />
      <ReasonDialog
        open={dialog === 'COORDINATE'}
        onClose={() => setDialog(null)}
        title="record coordination"
        description="Recorded in both case histories."
        confirmLabel="Record decision"
        reasonLabel="Rationale"
        onConfirm={({ reason }) =>
          decide.mutateAsync({ type: coordType, rationale: reason })
        }
      >
        <CoordinationTypeField value={coordType} onChange={setCoordType} />
      </ReasonDialog>
    </div>
  );
}
