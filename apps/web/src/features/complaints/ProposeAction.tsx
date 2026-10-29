import { useId, useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { CircleAlert, CircleCheck, Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createAction, previewAction } from '@/shared/api/actions';
import { complaintKeys } from '@/shared/api/complaints';
import {
  apiErrorCode,
  apiErrorMessage,
  fieldErrors,
} from '@/shared/api/errors';
import type { ActionDraft, ActionPreview, ActionType } from '@/shared/types';

export const ACTION_LABEL: Record<ActionType, string> = {
  EVIDENCE_REQUEST: 'Evidence request',
  INSPECTION: 'Inspection',
  NOTICE: 'Notice',
  REVIEW: 'Review',
};

// The Action Firewall: every proposed action is previewed first. Warnings (another
// desk already asked for this) block it until the officer coordinates or records why
// this action is separate; without warnings it is created directly.
export function ProposeAction({
  complaintId,
  onDone,
}: {
  complaintId: string;
  onDone: () => void;
}) {
  const uid = useId();
  const qc = useQueryClient();
  const [draft, setDraft] = useState<{
    type: ActionType;
    summary: string;
    evidenceScope: string;
    dueAt: string;
  }>({
    type: 'EVIDENCE_REQUEST',
    summary: '',
    evidenceScope: '',
    dueAt: '',
  });
  const [preview, setPreview] = useState<ActionPreview | null>(null);
  const [override, setOverride] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [created, setCreated] = useState<string | null>(null);

  const body = (): ActionDraft => ({
    complaintId,
    type: draft.type,
    summary: draft.summary.trim(),
    evidenceScope: draft.evidenceScope.trim() || undefined,
    dueAt: draft.dueAt
      ? new Date(`${draft.dueAt}T18:00:00+05:30`).toISOString()
      : undefined,
  });

  async function create(overrideReason?: string) {
    const a = await createAction({ ...body(), overrideReason });
    void qc.invalidateQueries({ queryKey: complaintKeys.actions(complaintId) });
    void qc.invalidateQueries({
      queryKey: ['complaints', 'timeline', complaintId],
    });
    void qc.invalidateQueries({ queryKey: ['dashboard-overview'] });
    setCreated(`${ACTION_LABEL[a.data.type]} planned.`);
    setPreview(null);
  }

  async function onPreview(e: FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!draft.summary.trim())
      errs.summary = 'Describe the action in a sentence.';
    else if (draft.summary.trim().length > 2000)
      errs.summary = 'Keep it to 2000 characters or fewer.';
    if (draft.evidenceScope.length > 200)
      errs.evidenceScope = 'Keep the scope to 200 characters or fewer.';
    setErrors(errs);
    setFormError(null);
    if (Object.keys(errs).length) return;
    setPending(true);
    try {
      const p = await previewAction(body());
      if (p.data.warnings.length) setPreview(p.data);
      else await create();
    } catch (err) {
      setErrors(fieldErrors(err));
      setFormError(apiErrorMessage(err));
    } finally {
      setPending(false);
    }
  }

  async function onOverride(e: FormEvent) {
    e.preventDefault();
    const reason = override.trim();
    if (!reason)
      return setErrors({
        overrideReason:
          'Say why this action is separate from the existing one.',
      });
    if (reason.length > 2000)
      return setErrors({
        overrideReason: 'Keep it to 2000 characters or fewer.',
      });
    setErrors({});
    setPending(true);
    try {
      await create(reason);
    } catch (err) {
      setFormError(
        apiErrorCode(err) === 'REVIEW_REQUIRED'
          ? apiErrorMessage('REVIEW_REQUIRED')
          : apiErrorMessage(err),
      );
    } finally {
      setPending(false);
    }
  }

  if (created)
    return (
      <div
        role="status"
        className="flex items-start gap-3 border border-line bg-graphite p-5"
      >
        <CircleCheck
          size={20}
          aria-hidden="true"
          className="mt-0.5 flex-none text-indigo-hi"
        />
        <div>
          <p className="font-bold">{created}</p>
          <p className="mt-1 text-sm text-subtle">
            It's in the actions list and the case history.
          </p>
          <Button variant="ghost" size="sm" className="mt-4" onClick={onDone}>
            Done
          </Button>
        </div>
      </div>
    );

  if (preview)
    return (
      <form
        onSubmit={onOverride}
        noValidate
        className="grid gap-4 border-[1.5px] border-alert bg-graphite p-5"
      >
        <div className="flex items-center gap-2">
          <ShieldAlert size={20} aria-hidden="true" className="text-alert" />
          <h3 className="font-display text-[26px] leading-none font-bold text-alert lowercase [font-stretch:75%]">
            this may duplicate another desk's action
          </h3>
        </div>
        <ul className="grid gap-2">
          {preview.warnings.map((w, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <CircleAlert
                size={16}
                aria-hidden="true"
                className="mt-0.5 flex-none text-alert"
              />
              <span>
                {w.message}
                {w.relatedActionId ? (
                  <span className="text-subtle">
                    {' '}
                    · your bureau, another case
                  </span>
                ) : (
                  <span className="text-subtle"> · at another bureau</span>
                )}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-sm">
          <span className="font-bold">Recommendation: </span>
          {preview.recommendation}. One joint request saves the institution a
          second notice.
        </p>
        <div>
          <label
            htmlFor={`${uid}-override`}
            className="block text-[15px] font-bold"
          >
            Reason to go ahead anyway
          </label>
          <p id={`${uid}-override-hint`} className="mt-1 text-xs text-subtle">
            Required to proceed. Recorded in the case history.
          </p>
          <textarea
            id={`${uid}-override`}
            rows={3}
            className="field mt-2 py-3"
            value={override}
            onChange={(e) => setOverride(e.target.value)}
            aria-invalid={errors.overrideReason ? true : undefined}
            aria-describedby={`${uid}-override-hint${errors.overrideReason ? ` ${uid}-override-error` : ''}`}
            disabled={pending}
          />
          {errors.overrideReason && (
            <p
              id={`${uid}-override-error`}
              className="mt-2 text-sm text-indigo-hi"
            >
              {errors.overrideReason}
            </p>
          )}
        </div>
        {formError && <p className="text-sm text-indigo-hi">{formError}</p>}
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link to={`/investigations/${complaintId}`}>
              Coordinate instead
            </Link>
          </Button>
          <Button
            type="submit"
            variant="ghost"
            disabled={pending}
            aria-busy={pending || undefined}
          >
            {pending && (
              <Loader2 size={16} aria-hidden="true" className="animate-spin" />
            )}
            Create anyway
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setPreview(null)}
            disabled={pending}
          >
            Edit action
          </Button>
        </div>
      </form>
    );

  return (
    <form
      onSubmit={onPreview}
      noValidate
      className="grid gap-4 border border-line bg-graphite p-5"
    >
      <h3 className="font-bold">Propose an action</h3>
      <p className="-mt-2 text-xs text-subtle">
        Setu checks other bureaus' open work on this institution before anything
        is sent.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${uid}-type`} className="block text-sm font-bold">
            Type
          </label>
          <select
            id={`${uid}-type`}
            className="select mt-2 w-full"
            value={draft.type}
            onChange={(e) =>
              setDraft((d) => ({ ...d, type: e.target.value as ActionType }))
            }
          >
            {Object.entries(ACTION_LABEL).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${uid}-due`} className="block text-sm font-bold">
            Due date (optional)
          </label>
          <input
            id={`${uid}-due`}
            type="date"
            className="field mt-2"
            value={draft.dueAt}
            onChange={(e) => setDraft((d) => ({ ...d, dueAt: e.target.value }))}
          />
        </div>
      </div>
      <div>
        <label htmlFor={`${uid}-summary`} className="block text-sm font-bold">
          Summary
        </label>
        <input
          id={`${uid}-summary`}
          className="field mt-2"
          placeholder="e.g. Request fee ledger"
          value={draft.summary}
          onChange={(e) => setDraft((d) => ({ ...d, summary: e.target.value }))}
          aria-invalid={errors.summary ? true : undefined}
          aria-describedby={errors.summary ? `${uid}-summary-error` : undefined}
        />
        {errors.summary && (
          <p
            id={`${uid}-summary-error`}
            className="mt-2 text-sm text-indigo-hi"
          >
            {errors.summary}
          </p>
        )}
      </div>
      <div>
        <label htmlFor={`${uid}-scope`} className="block text-sm font-bold">
          Evidence scope (optional)
        </label>
        <input
          id={`${uid}-scope`}
          className="field mt-2 font-mono"
          placeholder="e.g. admission-fees:2026-Q3"
          value={draft.evidenceScope}
          onChange={(e) =>
            setDraft((d) => ({ ...d, evidenceScope: e.target.value }))
          }
          aria-invalid={errors.evidenceScope ? true : undefined}
        />
        {errors.evidenceScope && (
          <p className="mt-2 text-sm text-indigo-hi">{errors.evidenceScope}</p>
        )}
      </div>
      {formError && <p className="text-sm text-indigo-hi">{formError}</p>}
      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={pending}
          aria-busy={pending || undefined}
        >
          {pending && (
            <Loader2 size={16} aria-hidden="true" className="animate-spin" />
          )}
          {pending ? 'Checking…' : 'Check and create'}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
