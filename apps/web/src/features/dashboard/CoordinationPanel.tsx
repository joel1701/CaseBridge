import { useState } from 'react';
import { Link } from 'react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { BureauTag } from '@/components/ui/bureau-tag';
import { linkOverlap } from '@/shared/api/dashboard';
import { cn } from '@/shared/utils/cn';
import type { DashboardOverview, OverlapAlert } from '@/shared/types';
import { Panel } from './Panel';

function Check() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      aria-hidden="true"
    >
      <path d="M5 12l5 5 9-10" />
    </svg>
  );
}

const statusLabel: Record<OverlapAlert['status'], string> = {
  NEW: 'potential overlap',
  UNDER_REVIEW: 'under review',
  LINKED: 'linked',
};

function OverlapCard({
  alert,
  onLink,
  linking,
}: {
  alert: OverlapAlert;
  onLink: () => void;
  linking: boolean;
}) {
  const pct = Math.round(alert.confidence * 100);
  const titleId = `ovl-${alert.id}`;
  return (
    <article
      aria-labelledby={titleId}
      className={cn(
        'flex min-w-0 flex-col gap-4 bg-graphite p-5',
        alert.status === 'NEW' && 'border-[1.5px] border-alert',
        alert.status === 'UNDER_REVIEW' && 'border border-line-2',
        alert.status === 'LINKED' && 'border border-indigo',
      )}
    >
      <div className="flex items-center gap-2">
        {alert.status === 'NEW' && (
          <span
            aria-hidden="true"
            className="alert-pulse size-2 flex-none bg-alert"
          />
        )}
        <p
          className={cn(
            'font-display text-[22px] leading-none font-bold lowercase [font-stretch:75%]',
            alert.status === 'NEW' ? 'text-alert' : 'text-indigo-hi',
          )}
        >
          {statusLabel[alert.status]}
        </p>
        <span className="ml-auto text-xs text-subtle">
          Coordination between {alert.bureaus.join(' and ')}
        </span>
      </div>

      {/* Two columns when there is room: who and which cases | why they match. */}
      <div className="grid gap-4 md:grid-cols-2 md:gap-6">
        <div className="grid content-start gap-3">
          <div>
            <h3 id={titleId} className="text-[17px] leading-snug font-bold">
              {alert.institution.name}
            </h3>
            <p className="mt-1 font-mono text-[13px] text-indigo-hi">
              {alert.institution.permanentId}
            </p>
          </div>

          <ul className="flex flex-wrap gap-x-4 gap-y-2" aria-label="Cases">
            {alert.cases.map((c) => (
              <li key={c.id} className="flex items-center gap-2">
                <BureauTag code={c.bureau} />
                <span className="font-mono text-[13px]">{c.originalId}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="grid content-start gap-4">
          <div>
            <div className="flex justify-between text-xs">
              <span className="text-subtle" id={`${titleId}-conf`}>
                Match confidence
              </span>
              <span className="font-bold tabular-nums">{pct}%</span>
            </div>
            <div
              role="meter"
              aria-labelledby={`${titleId}-conf`}
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuetext={`${pct}%`}
              className="mt-2 h-1.5 bg-panel"
            >
              <div className="h-full bg-indigo" style={{ width: `${pct}%` }} />
            </div>
          </div>

          <ul className="flex flex-wrap gap-2" aria-label="Why these match">
            {alert.reasons.map((r) => (
              <li
                key={r}
                className="inline-flex items-center gap-1.5 border border-line-2 px-2 py-1 text-xs"
              >
                <span className="text-indigo-hi">
                  <Check />
                </span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-auto flex flex-wrap gap-2 pt-1">
        <Button asChild variant="ghost" size="sm">
          <Link to={`/investigations/${alert.cases[0]?.id ?? ''}`}>Review</Link>
        </Button>
        {/* One button throughout, so keyboard focus stays put when the card flips to linked. */}
        <Button
          size="sm"
          variant={alert.status === 'LINKED' ? 'ghost' : 'primary'}
          aria-disabled={alert.status === 'LINKED' || linking || undefined}
          aria-busy={linking || undefined}
          onClick={alert.status === 'LINKED' || linking ? undefined : onLink}
        >
          {alert.status === 'LINKED' && <Check />}
          {alert.status === 'LINKED'
            ? 'Cases linked'
            : linking
              ? 'Linking…'
              : 'Link cases'}
        </Button>
      </div>
    </article>
  );
}

export function CoordinationPanel({
  data,
  queryKey,
}: {
  data: DashboardOverview;
  queryKey: readonly unknown[];
}) {
  const queryClient = useQueryClient();
  const [announcement, setAnnouncement] = useState('');
  const setStatus = (id: string, status: OverlapAlert['status']) =>
    queryClient.setQueryData<DashboardOverview>(
      queryKey,
      (old) =>
        old && {
          ...old,
          overlapAlerts: old.overlapAlerts.map((o) =>
            o.id === id ? { ...o, status } : o,
          ),
        },
    );

  const link = useMutation({
    mutationFn: (alert: OverlapAlert) => linkOverlap(alert, data.scope),
    onMutate: (alert) => {
      setStatus(alert.id, 'LINKED');
      return { previous: alert.status };
    },
    onSuccess: (_r, alert) =>
      setAnnouncement(`Cases linked for ${alert.institution.name}.`),
    onError: (_e, alert, ctx) => {
      setStatus(alert.id, ctx?.previous ?? alert.status);
      setAnnouncement(
        `Couldn't link the cases for ${alert.institution.name}. Try again.`,
      );
    },
  });

  const open = data.overlapAlerts.filter((o) => o.status !== 'LINKED').length;
  return (
    <Panel
      title="coordination required"
      titleId="coordination-title"
      meta={
        open
          ? `${open} ${open === 1 ? 'overlap needs' : 'overlaps need'} a decision`
          : undefined
      }
    >
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
      {data.overlapAlerts.length ? (
        <div className="grid gap-4 2xl:grid-cols-2">
          {data.overlapAlerts.map((a) => (
            <OverlapCard
              key={a.id}
              alert={a}
              linking={link.isPending && link.variables?.id === a.id}
              onLink={() => link.mutate(a)}
            />
          ))}
        </div>
      ) : (
        <p className="border border-line bg-graphite px-5 py-8 text-center text-subtle">
          No overlapping cases right now
        </p>
      )}
    </Panel>
  );
}
