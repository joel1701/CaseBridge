import type { ReactNode } from 'react';
import { CircleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiErrorCode, apiErrorMessage, isStale } from '@/shared/api/errors';
import { cn } from '@/shared/utils/cn';

// A failed load or action: a calm panel (not red) with the API's reason in plain words
// and one clear next step. Pass `action` to replace the default Retry/Reload button.
export function ErrorState({
  error,
  onRetry,
  action,
  title = "Couldn't load this",
  className,
}: {
  error: unknown;
  onRetry?: () => void;
  action?: ReactNode;
  title?: string;
  className?: string;
}) {
  const code = apiErrorCode(error);
  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 border border-line bg-graphite-1 p-5 shadow-[inset_3px_0_0_var(--ind-hi)]',
        className,
      )}
    >
      <CircleAlert
        size={18}
        aria-hidden="true"
        className="mt-0.5 flex-none text-indigo-hi"
      />
      <div className="min-w-0">
        <p className="font-bold">{title}</p>
        <p className="mt-1 text-sm text-subtle">{apiErrorMessage(error)}</p>
        {(action || onRetry) && (
          <div className="mt-4">
            {action ?? (
              <Button variant="ghost" size="sm" onClick={onRetry}>
                {isStale(code) ? 'Reload' : 'Retry'}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
