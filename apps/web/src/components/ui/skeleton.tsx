import { cn } from '@/shared/utils/cn';
// Static placeholder block. No pulse: the brief allows a pulse only on overlap alerts.
export function Skeleton({
  className,
  label,
}: {
  className?: string;
  label?: string;
}) {
  return (
    <>
      <span aria-hidden="true" className={cn('block bg-panel', className)} />
      {label && (
        <span role="status" className="sr-only">
          {label}
        </span>
      )}
    </>
  );
}
