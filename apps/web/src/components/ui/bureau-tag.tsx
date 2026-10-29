import { cn } from '@/shared/utils/cn';
// Bureau code as in the reference case cards (.case .bu), e.g. "RB" or "PGRC".
export function BureauTag({
  code,
  className,
}: {
  code: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-block bg-indigo-hi px-2 py-[3px] text-[13px] leading-normal font-bold text-ink',
        className,
      )}
    >
      {code}
    </span>
  );
}
