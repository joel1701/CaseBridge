import { cn } from '@/shared/utils/cn';
import type { ComplaintStatus } from '@/shared/types';
export type PillStatus = ComplaintStatus | 'APPROACHING_DEADLINE' | 'OVERDUE';
// Red is reserved for overdue cases (and overlaps); approaching deadline is a warning, not red.
const styles: Record<PillStatus, { label: string; className: string }> = {
  RECEIVED: { label: 'Received', className: 'border-line-2 text-snow' },
  UNDER_PROCESS: {
    label: 'Under process',
    className: 'border-transparent bg-indigo/16 text-indigo-hi',
  },
  TRANSFERRED: { label: 'Transferred', className: 'border-line-2 text-subtle' },
  ESCALATED: {
    label: 'Escalated',
    className: 'border-transparent bg-indigo-hi text-ink',
  },
  DISPOSED: { label: 'Disposed', className: 'border-transparent text-subtle' },
  APPROACHING_DEADLINE: {
    label: 'Approaching deadline',
    className: 'border-indigo-hi text-indigo-hi',
  },
  OVERDUE: { label: 'Overdue', className: 'border-alert text-alert' },
};
export const STATUSES = Object.keys(styles) as PillStatus[];
export function StatusPill({
  status,
  className,
}: {
  status: PillStatus;
  className?: string;
}) {
  const s = styles[status];
  return (
    <span
      className={cn(
        'inline-flex items-center border px-2 py-1 text-xs leading-none font-medium whitespace-nowrap',
        s.className,
        className,
      )}
    >
      {s.label}
    </span>
  );
}
