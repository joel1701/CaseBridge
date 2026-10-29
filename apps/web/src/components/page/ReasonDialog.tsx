import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import { CircleAlert, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trapTab, useDismiss } from '@/components/layout/useDismiss';
import {
  apiErrorCode,
  apiErrorMessage,
  fieldErrors,
  isStale,
} from '@/shared/api/errors';

const MAX = 2000;

export interface Concurrency {
  expectedVersion?: number;
  expectedUpdatedAt?: string;
}

// For every change the API requires a reason for: status changes, link review,
// coordination decisions, archive. The reason is 1..2000 characters; the concurrency
// token (expectedVersion or expectedUpdatedAt) passes straight through to onConfirm.
// A stale 409 shows "someone changed this" with a Reload step.
export function ReasonDialog({
  open,
  onClose,
  title,
  description,
  confirmLabel = 'Confirm',
  reasonLabel = 'Reason',
  reasonHint = 'Recorded in the case history. Up to 2000 characters.',
  concurrency,
  onConfirm,
  onReload,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  reasonLabel?: string;
  reasonHint?: string;
  concurrency?: Concurrency;
  onConfirm: (values: { reason: string } & Concurrency) => Promise<unknown>;
  onReload?: () => void;
  /** Extra fields above the reason, e.g. a status or coordination-type select. */
  children?: ReactNode;
}) {
  if (!open) return null;
  return (
    <DialogBody
      onClose={onClose}
      title={title}
      description={description}
      confirmLabel={confirmLabel}
      reasonLabel={reasonLabel}
      reasonHint={reasonHint}
      concurrency={concurrency}
      onConfirm={onConfirm}
      onReload={onReload}
    >
      {children}
    </DialogBody>
  );
}

function DialogBody({
  onClose,
  title,
  description,
  confirmLabel,
  reasonLabel,
  reasonHint,
  concurrency,
  onConfirm,
  onReload,
  children,
}: Omit<Parameters<typeof ReasonDialog>[0], 'open'> & {
  confirmLabel: string;
  reasonLabel: string;
  reasonHint: string;
}) {
  const uid = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const reasonRef = useRef<HTMLTextAreaElement>(null);
  const inside = useMemo(() => [panelRef], []);
  const [returnTo] = useState(
    () => document.activeElement as HTMLElement | null,
  );
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [formError, setFormError] = useState<{
    message: string;
    stale: boolean;
  } | null>(null);
  const [pending, setPending] = useState(false);

  const close = () => {
    onClose();
    returnTo?.focus();
  };
  useDismiss(!pending, close, inside);

  useEffect(() => {
    reasonRef.current?.focus();
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed) {
      setReasonError('Give a reason. It is recorded in the case history.');
      reasonRef.current?.focus();
      return;
    }
    if (trimmed.length > MAX) {
      setReasonError(`Keep the reason to ${MAX} characters or fewer.`);
      reasonRef.current?.focus();
      return;
    }
    setReasonError(null);
    setFormError(null);
    setPending(true);
    try {
      await onConfirm({ reason: trimmed, ...concurrency });
      setPending(false);
      close();
    } catch (err) {
      setPending(false);
      const fields = fieldErrors(err);
      if (fields.reason) {
        setReasonError(fields.reason);
        reasonRef.current?.focus();
      } else
        setFormError({
          message: apiErrorMessage(err),
          stale: isStale(apiErrorCode(err)),
        });
    }
  }

  const left = MAX - reason.trim().length;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-[10vh]">
      <div
        className="fixed inset-0 bg-[rgba(11,14,20,.7)]"
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${uid}-title`}
        aria-describedby={description ? `${uid}-desc` : undefined}
        onKeyDown={(e) => trapTab(e, panelRef.current)}
        className="relative w-full max-w-lg border border-line bg-surface p-6 shadow-[0_18px_40px_rgba(11,14,20,.35)]"
      >
        <h2
          id={`${uid}-title`}
          className="font-display text-[30px] leading-none font-bold text-indigo-hi lowercase [font-stretch:75%]"
        >
          {title}
        </h2>
        {description && (
          <p id={`${uid}-desc`} className="mt-3 text-sm text-subtle">
            {description}
          </p>
        )}
        <form className="mt-6 grid gap-5" noValidate onSubmit={submit}>
          {children}
          <div>
            <label
              htmlFor={`${uid}-reason`}
              className="block text-[15px] font-bold"
            >
              {reasonLabel}
            </label>
            <p id={`${uid}-hint`} className="mt-1 text-xs text-subtle">
              {reasonHint}
            </p>
            <textarea
              ref={reasonRef}
              id={`${uid}-reason`}
              rows={4}
              className="field mt-2 min-h-28 py-3"
              value={reason}
              disabled={pending}
              onChange={(e) => setReason(e.target.value)}
              aria-invalid={reasonError ? true : undefined}
              aria-describedby={`${uid}-hint ${uid}-count${reasonError ? ` ${uid}-error` : ''}`}
            />
            <div className="mt-1 flex justify-between gap-3 text-xs">
              <span id={`${uid}-error`} className="text-indigo-hi">
                {reasonError}
              </span>
              <span
                id={`${uid}-count`}
                className={
                  left < 0
                    ? 'text-indigo-hi tabular-nums'
                    : 'text-subtle tabular-nums'
                }
              >
                {left < 0 ? `${-left} over` : `${left} left`}
              </span>
            </div>
          </div>

          {formError && (
            <div
              role="alert"
              className="flex items-start gap-3 border border-line bg-panel p-4 text-sm shadow-[inset_3px_0_0_var(--ind-hi)]"
            >
              <CircleAlert
                size={18}
                aria-hidden="true"
                className="mt-0.5 flex-none text-indigo-hi"
              />
              <div>
                <p>{formError.message}</p>
                {formError.stale && onReload && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-3"
                    onClick={() => {
                      onReload();
                      close();
                    }}
                  >
                    Reload
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={close}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={pending}
              aria-busy={pending || undefined}
            >
              {pending && (
                <Loader2
                  size={18}
                  aria-hidden="true"
                  className="animate-spin"
                />
              )}
              {pending ? 'Saving…' : confirmLabel}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
