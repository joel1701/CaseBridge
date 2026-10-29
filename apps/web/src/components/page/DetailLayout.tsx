import type { ReactNode } from 'react';
import { Spec, type SpecItem } from '@/components/ui/spec';

// Main column plus a facts column on the right (sticky on wide screens, stacked below lg).
export function DetailLayout({
  children,
  facts,
  factsTitle = 'Facts',
  aside,
}: {
  children: ReactNode;
  facts: SpecItem[];
  factsTitle?: string;
  aside?: ReactNode;
}) {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)]">
      <div className="grid min-w-0 gap-6">{children}</div>
      <aside
        aria-label={factsTitle}
        className="grid gap-5 border border-line bg-graphite-1 p-5 lg:sticky lg:top-[88px]"
      >
        <h2 className="font-display text-[26px] leading-none font-bold lowercase [font-stretch:75%]">
          {factsTitle.toLowerCase()}
        </h2>
        {/* One column: label above value reads best in a narrow facts panel. */}
        <Spec items={facts} className="grid-cols-1" />
        {aside}
      </aside>
    </div>
  );
}
