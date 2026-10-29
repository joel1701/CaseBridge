import { useId, useRef, useState, type KeyboardEvent } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useReducedMotion } from '@/shared/hooks/useReducedMotion';
import { cn } from '@/shared/utils/cn';
import type { DashboardOverview } from '@/shared/types';
import { Panel } from './Panel';
import { useChartTokens, type ChartTokens } from './useChartTokens';

const tabs = [
  { key: 'workload', label: 'Bureau workload' },
  { key: 'ageing', label: 'Ageing' },
  { key: 'trend', label: 'Monthly trend' },
] as const;
type TabKey = (typeof tabs)[number]['key'];

const monthLabel = (ym: string) =>
  new Intl.DateTimeFormat('en-IN', { month: 'short' }).format(
    new Date(`${ym}-01T00:00:00Z`),
  );

function chartBits(t: ChartTokens, reduce: boolean) {
  return {
    grid: { stroke: t.line, vertical: false },
    axis: {
      stroke: t.line,
      tick: { fill: t.muted, fontSize: 12 },
      tickLine: false,
    },
    tooltip: {
      contentStyle: {
        background: t.surface,
        border: `1px solid ${t.line}`,
        borderRadius: 0,
        color: t.text,
        fontSize: 13,
      },
      labelStyle: { color: t.text, fontWeight: 700 },
      itemStyle: { color: t.text },
      cursor: { fill: t.panel },
    },
    legend: {
      // Keep series in drawing order (Recharts sorts by name otherwise).
      itemSorter: null,
      wrapperStyle: { fontSize: 13, color: t.muted },
      iconType: 'square' as const,
    },
    anim: { isAnimationActive: !reduce, animationDuration: 400 },
  };
}

function Workload({
  data,
  t,
  reduce,
}: {
  data: DashboardOverview;
  t: ChartTokens;
  reduce: boolean;
}) {
  const b = chartBits(t, reduce);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data.bureauWorkload}
        barGap={4}
        margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
      >
        <CartesianGrid {...b.grid} />
        <XAxis dataKey="bureau" {...b.axis} />
        <YAxis allowDecimals={false} {...b.axis} />
        <Tooltip {...b.tooltip} />
        <Legend {...b.legend} />
        <Bar dataKey="pending" name="Pending" fill={t.indHi} {...b.anim} />
        <Bar
          dataKey="underProcess"
          name="Under process"
          fill={t.ind}
          {...b.anim}
        />
        <Bar dataKey="overdue" name="Overdue" fill={t.alert} {...b.anim} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function Ageing({
  data,
  t,
  reduce,
}: {
  data: DashboardOverview;
  t: ChartTokens;
  reduce: boolean;
}) {
  const b = chartBits(t, reduce);
  const limit = data.ageing.thresholdDays;
  // Buckets past the disposal timeline hold overdue cases, so they take the alert colour.
  const late = (key: string) => key === '31-60' || key === '60+';
  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data.ageing.buckets}
            margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
          >
            <CartesianGrid {...b.grid} />
            <XAxis dataKey="label" {...b.axis} />
            <YAxis allowDecimals={false} {...b.axis} />
            <Tooltip {...b.tooltip} />
            <Bar dataKey="count" name="Open cases" {...b.anim}>
              {data.ageing.buckets.map((k) => (
                <Cell key={k.key} fill={late(k.key) ? t.alert : t.indHi} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 flex gap-5 text-xs text-subtle" aria-hidden="true">
        <span className="flex items-center gap-2">
          <i className="size-2.5 bg-indigo-hi" /> Within the {limit}-day
          timeline
        </span>
        <span className="flex items-center gap-2">
          <i className="size-2.5 bg-alert" /> Beyond it
        </span>
      </p>
    </div>
  );
}

function Trend({
  data,
  t,
  reduce,
}: {
  data: DashboardOverview;
  t: ChartTokens;
  reduce: boolean;
}) {
  const b = chartBits(t, reduce);
  const rows = data.monthlyTrend.map((m) => ({
    ...m,
    label: monthLabel(m.month),
  }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={rows}
        margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
      >
        <CartesianGrid {...b.grid} />
        <XAxis dataKey="label" {...b.axis} />
        <YAxis allowDecimals={false} {...b.axis} />
        <Tooltip {...b.tooltip} cursor={{ stroke: t.line }} />
        <Legend {...b.legend} iconType="plainline" />
        <Line
          type="monotone"
          dataKey="received"
          name="Received"
          stroke={t.indHi}
          strokeWidth={2}
          dot={false}
          {...b.anim}
        />
        <Line
          type="monotone"
          dataKey="disposed"
          name="Disposed"
          stroke={t.text}
          strokeWidth={2}
          strokeDasharray="5 4"
          dot={false}
          {...b.anim}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function summary(tab: TabKey, d: DashboardOverview) {
  if (tab === 'workload')
    return d.bureauWorkload.length
      ? d.bureauWorkload
          .map(
            (b) =>
              `${b.bureau} has ${b.pending} pending, ${b.underProcess} under process, ${b.overdue} overdue`,
          )
          .join('; ') + '.'
      : 'No open cases for this selection.';
  if (tab === 'ageing')
    return `Open cases by age: ${d.ageing.buckets.map((k) => `${k.label}, ${k.count}`).join('; ')}. Cases older than ${d.ageing.thresholdDays} days are beyond the disposal timeline.`;
  const peak = d.monthlyTrend.reduce(
    (a, m) => (m.received > a.received ? m : a),
    d.monthlyTrend[0],
  );
  const last = d.monthlyTrend.at(-1)!;
  return `Over 12 months, received peaked in ${monthLabel(peak.month)} at ${peak.received}. This month: ${last.received} received, ${last.disposed} disposed.`;
}

export function AnalyticsPanel({ data }: { data: DashboardOverview }) {
  const [tab, setTab] = useState<TabKey>('workload');
  const t = useChartTokens();
  const reduce = useReducedMotion();
  const uid = useId();
  const listRef = useRef<HTMLDivElement>(null);

  function onKey(e: KeyboardEvent) {
    const i = tabs.findIndex((x) => x.key === tab);
    const to =
      e.key === 'ArrowRight'
        ? (i + 1) % tabs.length
        : e.key === 'ArrowLeft'
          ? (i - 1 + tabs.length) % tabs.length
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? tabs.length - 1
              : -1;
    if (to < 0) return;
    e.preventDefault();
    setTab(tabs[to].key);
    listRef.current?.querySelectorAll<HTMLElement>('[role="tab"]')[to]?.focus();
  }

  return (
    <Panel
      title="analytics"
      titleId="analytics-title"
      action={
        <div
          ref={listRef}
          role="tablist"
          aria-label="Analytics views"
          onKeyDown={onKey}
          className="flex border border-line"
        >
          {tabs.map((x) => (
            <button
              key={x.key}
              type="button"
              role="tab"
              id={`${uid}-${x.key}-tab`}
              aria-selected={tab === x.key}
              aria-controls={`${uid}-panel`}
              tabIndex={tab === x.key ? 0 : -1}
              onClick={() => setTab(x.key)}
              className={cn(
                'h-9 px-3 text-sm',
                tab === x.key
                  ? 'bg-panel text-snow shadow-[inset_0_-2px_0_var(--ind)]'
                  : 'text-subtle hover:text-snow',
              )}
            >
              {x.label}
            </button>
          ))}
        </div>
      }
    >
      <div
        id={`${uid}-panel`}
        role="tabpanel"
        aria-labelledby={`${uid}-${tab}-tab`}
        tabIndex={0}
      >
        <p className="sr-only">{summary(tab, data)}</p>
        <div className="h-72" aria-hidden="true">
          {tab === 'workload' && <Workload data={data} t={t} reduce={reduce} />}
          {tab === 'ageing' && <Ageing data={data} t={t} reduce={reduce} />}
          {tab === 'trend' && <Trend data={data} t={t} reduce={reduce} />}
        </div>
      </div>
    </Panel>
  );
}
