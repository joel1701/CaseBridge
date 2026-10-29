import type { ReactNode } from 'react';
import { Inbox, type LucideIcon } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

// Nothing to show, said calmly, with at most one next step.
export function EmptyState({
  icon: Icon = Inbox,
  title,
  body,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  body?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 border border-line bg-graphite px-6 py-10 text-center',
        className,
      )}
    >
      <Icon size={24} aria-hidden="true" className="text-subtle" />
      <p className="font-bold">{title}</p>
      {body && <p className="max-w-[48ch] text-sm text-subtle">{body}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
