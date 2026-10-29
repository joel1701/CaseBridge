// Tiny trend line for a KPI tile; decorative (the tile states the numbers in text).
export function Sparkline({
  values,
  className,
}: {
  values: number[];
  className?: string;
}) {
  const w = 120;
  const h = 28;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const step = w / Math.max(values.length - 1, 1);
  const y = (v: number) => h - 2 - ((v - min) / (max - min || 1)) * (h - 4);
  const points = values.map(
    (v, i) => `${(i * step).toFixed(1)},${y(v).toFixed(1)}`,
  );
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      className={className}
    >
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
      <circle
        cx={(values.length - 1) * step}
        cy={y(values.at(-1) ?? 0)}
        r="2.5"
        fill="currentColor"
      />
    </svg>
  );
}
