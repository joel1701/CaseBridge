import type { ReactNode } from 'react';
import { cn } from '@/shared/utils/cn';
export interface SpecItem {
  label: ReactNode;
  value: ReactNode;
}
// Label/value list from the reference (.spec). The " -" after each label comes from CSS.
export function Spec({
  items,
  size = 'default',
  className,
}: {
  items: SpecItem[];
  size?: 'default' | 'sm';
  className?: string;
}) {
  return (
    <dl className={cn('spec', size === 'sm' && 'spec--sm', className)}>
      {items.map((item, i) => (
        <div key={i}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
