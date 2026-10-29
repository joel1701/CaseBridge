import type { ChartTokens } from './useChartTokens';

// Shared Recharts styling for the dashboard and reports: square, token-coloured, calm.
export const monthLabel = (ym: string) =>
  new Intl.DateTimeFormat('en-IN', { month: 'short' }).format(
    new Date(`${ym}-01T00:00:00Z`),
  );

export function chartBits(t: ChartTokens, reduce: boolean) {
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
