import { cn } from '@/shared/utils/cn';
import type { DashboardOverview } from '@/shared/types';
import { Panel } from './Panel';

const when = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Asia/Kolkata',
});

// Timeline styled like the landing page's case track (.tline): square markers, the latest filled.
export function ActivityTimeline({
  items,
}: {
  items: DashboardOverview['recentActivity'];
}) {
  return (
    <Panel title="recent activity" titleId="activity-title">
      {items.length ? (
        <ol className="grid gap-4">
          {items.map((a, i) => (
            <li key={a.id} className="grid grid-cols-[12px_1fr] gap-3">
              <span
                aria-hidden="true"
                className={cn(
                  'mt-1.5 size-2.5 border-[1.5px]',
                  i === 0 ? 'border-indigo bg-indigo' : 'border-subtle',
                  a.kind === 'LINKED' && 'border-indigo-hi bg-indigo-hi',
                )}
              />
              <div className="min-w-0">
                <p className="text-sm">{a.text}</p>
                <p className="mt-0.5 text-xs text-subtle">
                  <span className="font-mono">{a.originalId}</span> · {a.bureau}{' '}
                  · <time dateTime={a.at}>{when.format(new Date(a.at))}</time>
                </p>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="py-6 text-subtle">No activity for this selection.</p>
      )}
    </Panel>
  );
}
