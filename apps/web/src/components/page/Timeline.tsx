import type { ReactNode } from 'react';
import { cn } from '@/shared/utils/cn';

export interface TimelineItem {
  id: string;
  /** ISO timestamp */
  at: string;
  title: ReactNode;
  detail?: ReactNode;
  /** current: the latest/active step (filled indigo); alert: overdue or overlap only. */
  tone?: 'current' | 'alert';
}

const when = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Asia/Kolkata',
});

// History in the landing page's case-track style (.tline): 12px square markers,
// a thin rule joining them, the current step filled.
export function Timeline({
  items,
  label,
  empty = 'Nothing has happened on this record yet.',
}: {
  items: TimelineItem[];
  label: string;
  empty?: string;
}) {
  if (!items.length) return <p className="text-sm text-subtle">{empty}</p>;
  return (
    <ol aria-label={label} className="grid">
      {items.map((item, i) => (
        <li
          key={item.id}
          className="relative grid grid-cols-[12px_1fr] gap-3 pb-5 last:pb-0"
        >
          {i < items.length - 1 && (
            <span
              aria-hidden="true"
              className="absolute top-4 bottom-0 left-[5.25px] w-px bg-line"
            />
          )}
          <span
            aria-hidden="true"
            className={cn(
              'relative mt-1.5 size-2.5 border-[1.5px] bg-graphite-1',
              item.tone === 'current' && 'border-indigo bg-indigo',
              item.tone === 'alert' && 'border-alert bg-alert',
              !item.tone && 'border-subtle',
            )}
          />
          <div className="min-w-0">
            <p className={cn('text-sm', item.tone === 'alert' && 'text-alert')}>
              {item.title}
            </p>
            <p className="mt-0.5 text-xs text-subtle">
              <time dateTime={item.at}>{when.format(new Date(item.at))}</time>
              {item.detail && <> · {item.detail}</>}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
