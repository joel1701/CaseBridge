import type { ReactNode } from 'react';
import { cn } from '@/shared/utils/cn';

export const panelTitle =
  'font-display text-[clamp(26px,2.2vw,34px)] leading-none font-bold lowercase [font-stretch:75%]';

export function Panel({
  title,
  titleId,
  meta,
  action,
  className,
  children,
}: {
  title: string;
  titleId: string;
  meta?: ReactNode;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        'min-w-0 border border-line bg-graphite-1 p-5 lg:p-6',
        className,
      )}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <h2 id={titleId} className={panelTitle}>
          {title}
        </h2>
        {meta && <div className="text-sm text-subtle">{meta}</div>}
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}
