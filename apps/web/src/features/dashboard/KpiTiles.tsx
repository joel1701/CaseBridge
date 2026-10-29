import { Link } from 'react-router';
import { cn } from '@/shared/utils/cn';
import type { CountWithPrevious, DashboardOverview } from '@/shared/types';
import { Sparkline } from './Sparkline';
import { useCountUp } from './useCountUp';

const tiles = [
  {
    key: 'pending',
    label: 'Pending',
    note: 'open now',
    to: '/complaints?filter=pending',
  },
  {
    key: 'underProcess',
    label: 'Under process',
    note: 'open now',
    to: '/complaints?status=UNDER_PROCESS',
  },
  {
    key: 'disposed',
    label: 'Disposed',
    note: 'last 30 days',
    to: '/complaints?status=DISPOSED',
  },
  {
    key: 'overdue',
    label: 'Overdue',
    note: 'past due',
    to: '/complaints?filter=overdue',
  },
] as const;

function change({ current, lastMonth }: CountWithPrevious) {
  const d = current - lastMonth;
  if (d === 0)
    return { symbol: '', text: 'No change from last month', short: undefined };
  return {
    symbol: d > 0 ? '▲' : '▼',
    text: `${d > 0 ? 'Up' : 'Down'} ${Math.abs(d)} from last month`,
    short: `${Math.abs(d)} vs last month`,
  };
}

function Tile({
  label,
  note,
  to,
  value,
  alert,
}: {
  label: string;
  note: string;
  to: string;
  value: CountWithPrevious;
  alert?: boolean;
}) {
  const shown = useCountUp(value.current);
  const c = change(value);
  return (
    <Link
      to={to}
      className={cn(
        'group block border border-line bg-graphite-1 p-5 no-underline transition-transform duration-300 ease-setu hover:-translate-y-0.5',
        alert && 'shadow-[inset_0_2px_0_var(--alert)]',
      )}
    >
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-bold">{label}</span>
        <span className="wide text-xs text-subtle">{note}</span>
      </span>
      <span
        className={cn(
          'mt-3 block text-[40px] leading-none font-semibold tabular-nums',
          alert && 'text-alert',
        )}
      >
        {shown}
      </span>
      <span className="mt-3 flex items-end justify-between gap-3">
        <span className="text-xs text-subtle">
          {c.symbol && <span aria-hidden="true">{c.symbol} </span>}
          <span aria-hidden="true">{c.short ?? c.text}</span>
          <span className="sr-only">{c.text}</span>
        </span>
        <Sparkline
          values={value.trend}
          className={cn(
            'h-7 w-24 flex-none',
            alert ? 'text-alert' : 'text-indigo-hi',
          )}
        />
      </span>
    </Link>
  );
}

export function KpiTiles({ counts }: { counts: DashboardOverview['counts'] }) {
  return (
    <section aria-label="Key figures">
      <p className="text-sm text-subtle">
        Received{' '}
        <span className="font-bold text-snow tabular-nums">
          {counts.received.current}
        </span>{' '}
        · Transferred{' '}
        <span className="font-bold text-snow tabular-nums">
          {counts.transferred.current}
        </span>{' '}
        <span className="wide text-xs">in the last 30 days</span>
      </p>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((t) => (
          <li key={t.key}>
            <Tile
              label={t.label}
              note={t.note}
              to={t.to}
              value={counts[t.key]}
              alert={t.key === 'overdue'}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
