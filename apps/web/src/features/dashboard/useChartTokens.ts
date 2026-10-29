import { useState } from 'react';
// SVG presentation attributes don't resolve var(), so charts read the tokens once.
const names = {
  ind: '--ind',
  indHi: '--ind-hi',
  indDeep: '--ind-deep',
  alert: '--alert',
  line: '--line',
  muted: '--muted',
  text: '--text',
  surface: '--surface',
  panel: '--panel',
} as const;
export type ChartTokens = Record<keyof typeof names, string>;
export function useChartTokens(): ChartTokens {
  const [tokens] = useState(() => {
    const cs = getComputedStyle(document.documentElement);
    return Object.fromEntries(
      Object.entries(names).map(([k, v]) => [k, cs.getPropertyValue(v).trim()]),
    ) as ChartTokens;
  });
  return tokens;
}
