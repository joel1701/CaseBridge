import { Link } from 'react-router';
import { BureauTag } from '@/components/ui/bureau-tag';
import type { DashboardOverview } from '@/shared/types';
import { Panel } from './Panel';

type Item = DashboardOverview['deadlineAlerts']['items'][number];

function when(hours: number) {
  if (hours >= 0)
    return hours < 24
      ? `due in ${hours}h`
      : `due in ${Math.round(hours / 24)} days`;
  const days = Math.max(1, Math.round(-hours / 24));
  return `${days} ${days === 1 ? 'day' : 'days'} overdue`;
}

function Group({
  title,
  total,
  items,
  empty,
}: {
  title: string;
  total: number;
  items: Item[];
  empty: string;
}) {
  const shown = items.slice(0, 5);
  return (
    <div>
      <h3 className="flex items-baseline justify-between text-sm font-bold">
        {title}
        <span className="font-normal text-subtle tabular-nums">{total}</span>
      </h3>
      {shown.length ? (
        <ul className="mt-2 divide-y divide-line border-y border-line">
          {shown.map((d) => (
            <li key={d.caseId} className="flex items-start gap-3 py-2.5">
              <BureauTag code={d.bureau} className="mt-0.5 flex-none" />
              <div className="min-w-0 flex-1">
                <p className="flex items-baseline justify-between gap-3">
                  <span className="font-mono text-[13px] whitespace-nowrap">
                    {d.originalId}
                  </span>
                  <span
                    className={
                      d.state === 'OVERDUE'
                        ? 'text-xs whitespace-nowrap text-alert tabular-nums'
                        : 'text-xs whitespace-nowrap text-indigo-hi tabular-nums'
                    }
                  >
                    {when(d.hoursLeft)}
                  </span>
                </p>
                <p className="truncate text-xs text-subtle">{d.institution}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 border-y border-line py-3 text-sm text-subtle">
          {empty}
        </p>
      )}
    </div>
  );
}

export function DeadlinePanel({ data }: { data: DashboardOverview }) {
  const items = data.deadlineAlerts.items;
  return (
    <Panel
      title="deadlines"
      titleId="deadlines-title"
      action={
        <Link to="/alerts" className="link text-sm">
          View all
        </Link>
      }
    >
      <div className="grid grid-cols-1 gap-6">
        <Group
          title={`Approaching (next ${data.deadlineAlerts.approachingWindowHours}h)`}
          total={data.counts.approachingDeadline.current}
          items={items.filter((d) => d.state === 'APPROACHING')}
          empty="Nothing due in the next two days."
        />
        <Group
          title="Overdue"
          total={data.counts.overdue.current}
          items={items.filter((d) => d.state === 'OVERDUE')}
          empty="No overdue cases."
        />
      </div>
    </Panel>
  );
}
