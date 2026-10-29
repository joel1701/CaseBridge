import type { ReactNode } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { chartBits, monthLabel } from '@/features/dashboard/chartStyle';
import { panelTitle } from '@/features/dashboard/Panel';
import { useChartTokens } from '@/features/dashboard/useChartTokens';
import { useReducedMotion } from '@/shared/hooks/useReducedMotion';
import type { DashboardOverview, OverlapMonth } from '@/shared/types';

// The five report panels. Each has a one-line summary, a chart (hidden from screen
// readers, which get the table) and a small table with the same numbers.

type Row = Record<string, string | number>;

function ReportPanel({
  id,
  title,
  summary,
  chart,
  columns,
  rows,
}: {
  id: string;
  title: string;
  summary: string;
  chart: ReactNode;
  columns: { key: string; label: string; alert?: boolean }[];
  rows: Row[];
}) {
  return (
    <section
      aria-labelledby={`${id}-title`}
      className="grid min-w-0 content-start gap-4 border border-line bg-graphite-1 p-5 lg:p-6"
    >
      <h2 id={`${id}-title`} className={panelTitle}>
        {title}
      </h2>
      <p className="text-sm text-subtle">{summary}</p>
      <div className="h-60" aria-hidden="true">
        {chart}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm tabular-nums">
          <thead>
            <tr className="border-b border-line text-left text-xs text-subtle">
              {columns.map((c, i) => (
                <th
                  key={c.key}
                  scope="col"
                  className={
                    i === 0
                      ? 'py-2 pr-3 font-medium'
                      : 'py-2 pl-3 text-right font-medium'
                  }
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, n) => (
              <tr key={n} className="border-b border-line last:border-b-0">
                {columns.map((c, i) =>
                  i === 0 ? (
                    <th
                      key={c.key}
                      scope="row"
                      className="py-2 pr-3 text-left font-normal"
                    >
                      {r[c.key]}
                    </th>
                  ) : (
                    <td
                      key={c.key}
                      className={
                        c.alert && Number(r[c.key]) > 0
                          ? 'py-2 pl-3 text-right text-alert'
                          : 'py-2 pl-3 text-right'
                      }
                    >
                      {r[c.key]}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);
const margin = { top: 8, right: 8, left: -12, bottom: 0 };

export function ReportPanels({
  data,
  overlaps,
}: {
  data: DashboardOverview;
  overlaps: OverlapMonth[];
}) {
  const t = useChartTokens();
  const b = chartBits(t, useReducedMotion());
  const c = data.counts;

  // 1. Status: the dashboard's current counts.
  const status = [
    { label: 'Received (30 days)', count: c.received.current },
    { label: 'Under process', count: c.underProcess.current },
    { label: 'Transferred (30 days)', count: c.transferred.current },
    { label: 'Escalated', count: c.escalated.current },
    { label: 'Disposed (30 days)', count: c.disposed.current },
  ];
  // Share of the workload cleared: disposed in 30 days against those plus everything still open.
  const rate = pct(c.disposed.current, c.disposed.current + c.pending.current);

  // 4. Ageing: the line sits at the end of the last bucket inside the timeline.
  const limit = data.ageing.thresholdDays;
  const late = (key: string) => key === '31-60' || key === '60+';
  const inside = data.ageing.buckets.filter((k) => !late(k.key));
  const beyond = data.ageing.buckets.filter((k) => late(k.key));
  const lateCount = beyond.reduce((s, k) => s + k.count, 0);
  const openCount = data.ageing.buckets.reduce((s, k) => s + k.count, 0);

  const overlapRows = overlaps.map((m) => ({
    ...m,
    label: monthLabel(m.month),
  }));
  const sum = (k: keyof OverlapMonth) =>
    overlaps.reduce((s, m) => s + Number(m[k]), 0);
  const topBureau = [...data.bureauWorkload].sort(
    (a, b) => b.pending - a.pending,
  )[0];
  const topRegion = [...data.regionBreakdown].sort(
    (a, b) => b.overdue - a.overdue,
  )[0];

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <ReportPanel
        id="rep-status"
        title="status summary"
        summary={`Disposal rate ${rate}%: ${c.disposed.current} cases disposed in the last 30 days, ${c.pending.current} still pending. ${c.received.current} received in that time.`}
        chart={
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={status}
              layout="vertical"
              margin={{ ...margin, left: 24 }}
            >
              <CartesianGrid {...b.grid} vertical horizontal={false} />
              <XAxis type="number" allowDecimals={false} {...b.axis} />
              <YAxis type="category" dataKey="label" width={130} {...b.axis} />
              <Tooltip {...b.tooltip} />
              <Bar dataKey="count" name="Cases" fill={t.indHi} {...b.anim} />
            </BarChart>
          </ResponsiveContainer>
        }
        columns={[
          { key: 'label', label: 'Status' },
          { key: 'count', label: 'Cases' },
        ]}
        rows={[...status, { label: 'Pending now', count: c.pending.current }]}
      />

      <ReportPanel
        id="rep-bureau"
        title="bureau-wise"
        summary={
          topBureau
            ? `${topBureau.bureau} carries the most pending cases (${topBureau.pending}).`
            : 'No open cases for this selection.'
        }
        chart={
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.bureauWorkload} barGap={4} margin={margin}>
              <CartesianGrid {...b.grid} />
              <XAxis dataKey="bureau" {...b.axis} />
              <YAxis allowDecimals={false} {...b.axis} />
              <Tooltip {...b.tooltip} />
              <Legend {...b.legend} />
              <Bar
                dataKey="pending"
                name="Pending"
                fill={t.indHi}
                {...b.anim}
              />
              <Bar
                dataKey="underProcess"
                name="Under process"
                fill={t.ind}
                {...b.anim}
              />
              <Bar
                dataKey="overdue"
                name="Overdue"
                fill={t.alert}
                {...b.anim}
              />
            </BarChart>
          </ResponsiveContainer>
        }
        columns={[
          { key: 'bureau', label: 'Bureau' },
          { key: 'pending', label: 'Pending' },
          { key: 'underProcess', label: 'Under process' },
          { key: 'overdue', label: 'Overdue', alert: true },
        ]}
        rows={data.bureauWorkload}
      />

      <ReportPanel
        id="rep-region"
        title="region-wise"
        summary={
          topRegion && topRegion.overdue
            ? `${topRegion.region} has the most overdue cases (${topRegion.overdue} of ${topRegion.open} open).`
            : 'No overdue cases in any regional office for this selection.'
        }
        chart={
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.regionBreakdown} barGap={4} margin={margin}>
              <CartesianGrid {...b.grid} />
              <XAxis
                dataKey="region"
                {...b.axis}
                interval={0}
                angle={-35}
                textAnchor="end"
                height={92}
                tick={{ ...b.axis.tick, fontSize: 11 }}
              />
              <YAxis allowDecimals={false} {...b.axis} />
              <Tooltip {...b.tooltip} />
              <Legend {...b.legend} />
              <Bar dataKey="open" name="Open" fill={t.indHi} {...b.anim} />
              <Bar
                dataKey="overdue"
                name="Overdue"
                fill={t.alert}
                {...b.anim}
              />
            </BarChart>
          </ResponsiveContainer>
        }
        columns={[
          { key: 'region', label: 'Regional office' },
          { key: 'open', label: 'Open' },
          { key: 'overdue', label: 'Overdue', alert: true },
        ]}
        rows={data.regionBreakdown}
      />

      <ReportPanel
        id="rep-ageing"
        title="pending case ageing"
        summary={`${lateCount} of ${openCount} open cases (${pct(lateCount, openCount)}%) are past the ${limit}-day disposal timeline.`}
        chart={
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.ageing.buckets} margin={margin}>
              <CartesianGrid {...b.grid} />
              <XAxis dataKey="label" {...b.axis} />
              <YAxis allowDecimals={false} {...b.axis} />
              <Tooltip {...b.tooltip} />
              <Bar dataKey="count" name="Open cases" {...b.anim}>
                {data.ageing.buckets.map((k) => (
                  <Cell key={k.key} fill={late(k.key) ? t.alert : t.indHi} />
                ))}
              </Bar>
              {inside.length > 0 && (
                <ReferenceLine
                  x={inside.at(-1)!.label}
                  position="end"
                  stroke={t.text}
                  strokeDasharray="4 4"
                  label={{
                    value: `${limit} days`,
                    position: 'insideTopRight',
                    fill: t.text,
                    fontSize: 12,
                  }}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        }
        columns={[
          { key: 'label', label: 'Age' },
          { key: 'count', label: 'Open cases' },
        ]}
        rows={data.ageing.buckets}
      />

      <ReportPanel
        id="rep-overlaps"
        title="overlapping cases per month"
        summary={
          sum('flagged')
            ? `${sum('flagged')} overlaps flagged in this period: ${sum('confirmed')} confirmed, ${sum('rejected')} rejected, ${sum('open')} still open.`
            : 'No overlaps flagged in this period.'
        }
        chart={
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={overlapRows} barGap={2} margin={margin}>
              <CartesianGrid {...b.grid} />
              <XAxis dataKey="label" {...b.axis} />
              <YAxis allowDecimals={false} {...b.axis} />
              <Tooltip {...b.tooltip} />
              <Legend {...b.legend} />
              <Bar
                dataKey="flagged"
                name="Flagged"
                fill={t.indHi}
                {...b.anim}
              />
              <Bar
                dataKey="confirmed"
                name="Confirmed"
                fill={t.ind}
                {...b.anim}
              />
              <Bar
                dataKey="rejected"
                name="Rejected"
                fill={t.muted}
                {...b.anim}
              />
              <Bar dataKey="open" name="Open" fill={t.alert} {...b.anim} />
            </BarChart>
          </ResponsiveContainer>
        }
        columns={[
          { key: 'label', label: 'Month' },
          { key: 'flagged', label: 'Flagged' },
          { key: 'confirmed', label: 'Confirmed' },
          { key: 'rejected', label: 'Rejected' },
          { key: 'open', label: 'Open', alert: true },
        ]}
        rows={overlapRows}
      />
    </div>
  );
}
