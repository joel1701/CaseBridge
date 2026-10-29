import { useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { CircleAlert, CircleCheck, Loader2 } from 'lucide-react';
import { useBureau } from '@/components/layout/BureauContext';
import { PageHeader } from '@/components/page';
import { Button } from '@/components/ui/button';
import { BureauTag } from '@/components/ui/bureau-tag';
import { useMe } from '@/shared/api/auth';
import { createComplaint, getComplaint } from '@/shared/api/complaints';
import {
  apiErrorCode,
  apiErrorMessage,
  fieldErrors,
} from '@/shared/api/errors';
import { analyzeCase, listLinks } from '@/shared/api/intelligence';
import type { InstitutionSummary, Scope } from '@/shared/types';
import { InstitutionPicker } from './InstitutionPicker';
import { CATEGORY_LABEL } from './shared';

// Limits from the API's create schema (docs/API_CONTRACT.md, POST /api/complaints).
const LIMITS = { originalId: 100, title: 200, description: 10000 } as const;

interface Match {
  otherId: string | null;
  otherRef: string | null;
  otherBureau: string;
  restricted: boolean;
  reasons: string[];
  score: number;
}
type Result =
  | {
      kind: 'overlap';
      id: string;
      originalId: string;
      matches: Match[];
      scope: Scope;
    }
  | {
      kind: 'clear';
      id: string;
      originalId: string;
      scope: Scope;
      matchingDown?: boolean;
    };

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-[15px] font-bold">
        {label}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-subtle">
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p
          id={`${id}-error`}
          className="mt-2 flex items-start gap-2 text-sm text-indigo-hi"
        >
          <CircleAlert
            size={16}
            aria-hidden="true"
            className="mt-0.5 flex-none"
          />
          {error}
        </p>
      )}
    </div>
  );
}

export function NewComplaintPage() {
  const uid = useId();
  const qc = useQueryClient();
  const { data: me } = useMe();
  const { bureau: shellBureau } = useBureau();
  // The API derives the bureau from the signed-in officer; ADMIN or signed-out demo falls back to the shell's bureau.
  const bureau =
    me?.bureauId ??
    (shellBureau === 'RB' || shellBureau === 'PGRC' ? shellBureau : 'PGRC');

  const [institution, setInstitution] = useState<InstitutionSummary | null>(
    null,
  );
  const [form, setForm] = useState({
    originalId: '',
    title: '',
    description: '',
    category: 'FEES',
    dueAt: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function validate() {
    const e: Record<string, string> = {};
    if (!institution)
      e.institutionId = 'Choose the institution this complaint is about.';
    for (const [k, max] of Object.entries(LIMITS)) {
      const v = form[k as keyof typeof LIMITS].trim();
      if (!v) e[k] = 'Required.';
      else if (v.length > max)
        e[k] = `Keep this to ${max} characters or fewer.`;
    }
    return e;
  }

  function focusFirst(e: Record<string, string>) {
    const order = ['institutionId', 'originalId', 'title', 'description'];
    const first = order.find((k) => e[k]);
    if (first)
      formRef.current
        ?.querySelector<HTMLElement>(`#${CSS.escape(`${uid}-${first}`)}`)
        ?.focus();
  }

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    if (pending) return;
    const e = validate();
    setErrors(e);
    setFormError(null);
    if (Object.keys(e).length) return focusFirst(e);
    setPending(true);
    try {
      const created = await createComplaint({
        originalId: form.originalId.trim(),
        institutionId: institution!.id,
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        bureauId: bureau,
        dueAt: form.dueAt
          ? new Date(`${form.dueAt}T18:00:00+05:30`).toISOString()
          : undefined,
      });
      const c = created.data;
      void qc.invalidateQueries({ queryKey: ['complaints'] });
      void qc.invalidateQueries({ queryKey: ['dashboard-overview'] });
      try {
        await analyzeCase(c.id);
        const links = await listLinks(c.id);
        const open = links.items.filter((l) => l.status === 'SUGGESTED');
        void qc.invalidateQueries({ queryKey: ['alerts'] });
        if (!open.length)
          setResult({
            kind: 'clear',
            id: c.id,
            originalId: c.originalId,
            scope: created.scope,
          });
        else {
          const matches = await Promise.all(
            open.map(async (l) => {
              const other = l.otherComplaint.id
                ? await getComplaint(l.otherComplaint.id).catch(() => null)
                : null;
              return {
                otherId: l.otherComplaint.id,
                otherRef: other?.data.originalId ?? null,
                otherBureau: l.otherComplaint.bureauCode,
                restricted: l.otherComplaint.restricted,
                reasons: l.explanation.reasons,
                score: l.score,
              };
            }),
          );
          setResult({
            kind: 'overlap',
            id: c.id,
            originalId: c.originalId,
            matches,
            scope: created.scope,
          });
        }
      } catch {
        // The complaint exists; matching can be run again from its page.
        setResult({
          kind: 'clear',
          id: c.id,
          originalId: c.originalId,
          scope: created.scope,
          matchingDown: true,
        });
      }
    } catch (err) {
      const f = fieldErrors(err);
      if (apiErrorCode(err) === 'DUPLICATE_REFERENCE')
        f.originalId = apiErrorMessage(err);
      if (Object.keys(f).length) {
        setErrors(f);
        focusFirst(f);
      }
      setFormError(apiErrorMessage(err));
    } finally {
      setPending(false);
    }
  }

  function addAnother() {
    setResult(null);
    setInstitution(null);
    setForm({
      originalId: '',
      title: '',
      description: '',
      category: 'FEES',
      dueAt: '',
    });
    setErrors({});
  }

  if (result)
    return (
      <ResultView
        result={result}
        onAddAnother={addAnother}
        institution={institution}
      />
    );

  const ids = (k: string) => ({
    id: `${uid}-${k}`,
    'aria-invalid': errors[k] ? true : undefined,
    'aria-describedby':
      [`${uid}-${k}-hint`, errors[k] ? `${uid}-${k}-error` : '']
        .filter(Boolean)
        .join(' ') || undefined,
  });

  return (
    <div className="grid max-w-3xl gap-8">
      <PageHeader
        title="new complaint"
        description="Setu checks it against open cases at other bureaus as soon as it's saved."
      />
      <form
        ref={formRef}
        noValidate
        onSubmit={submit}
        className="grid gap-6 border border-line bg-graphite-1 p-6"
      >
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="font-bold">Filing bureau</span>
          <BureauTag code={bureau} />
          <span className="text-subtle">
            {me ? 'From your account' : 'Demo default (not signed in)'}
          </span>
        </div>
        <Field
          id={`${uid}-institutionId`}
          label="Institution"
          hint="Search by name or AICTE permanent ID."
          error={errors.institutionId}
        >
          <InstitutionPicker
            id={`${uid}-institutionId`}
            value={institution}
            onChange={setInstitution}
            invalid={!!errors.institutionId}
            describedBy={[
              `${uid}-institutionId-hint`,
              errors.institutionId ? `${uid}-institutionId-error` : '',
            ]
              .filter(Boolean)
              .join(' ')}
            disabled={pending}
          />
        </Field>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field
            id={`${uid}-originalId`}
            label="Original reference ID"
            hint="As it appears on the bureau's own record."
            error={errors.originalId}
          >
            <input
              {...ids('originalId')}
              className="field mt-2 font-mono"
              value={form.originalId}
              onChange={set('originalId')}
              disabled={pending}
              maxLength={LIMITS.originalId + 20}
            />
          </Field>
          <Field
            id={`${uid}-category`}
            label="Category"
            error={errors.category}
          >
            <select
              id={`${uid}-category`}
              className="select mt-2 w-full"
              value={form.category}
              onChange={set('category')}
              disabled={pending}
            >
              {Object.entries(CATEGORY_LABEL).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field
          id={`${uid}-title`}
          label="Title"
          hint="One line, up to 200 characters."
          error={errors.title}
        >
          <input
            {...ids('title')}
            className="field mt-2"
            value={form.title}
            onChange={set('title')}
            disabled={pending}
          />
        </Field>
        <Field
          id={`${uid}-description`}
          label="Description"
          hint="What the complainant reports, in their words. Up to 10,000 characters."
          error={errors.description}
        >
          <textarea
            {...ids('description')}
            rows={6}
            className="field mt-2 py-3"
            value={form.description}
            onChange={set('description')}
            disabled={pending}
          />
        </Field>
        <Field
          id={`${uid}-dueAt`}
          label="Due date (optional)"
          hint="Leave empty for the standard 30-day disposal timeline."
        >
          <input
            id={`${uid}-dueAt`}
            type="date"
            className="field mt-2 sm:max-w-60"
            value={form.dueAt}
            onChange={set('dueAt')}
            disabled={pending}
          />
        </Field>
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
            {formError}
          </div>
        )}
        <div className="flex flex-wrap gap-3">
          <Button
            type="submit"
            disabled={pending}
            aria-busy={pending || undefined}
          >
            {pending && (
              <Loader2 size={18} aria-hidden="true" className="animate-spin" />
            )}
            {pending ? 'Saving and checking…' : 'Save complaint'}
          </Button>
          <Button asChild variant="ghost">
            <Link to="/complaints">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}

function ResultView({
  result,
  onAddAnother,
  institution,
}: {
  result: Result;
  onAddAnother: () => void;
  institution: InstitutionSummary | null;
}) {
  const ref = (node: HTMLHeadingElement | null) => node?.focus();
  if (result.kind === 'clear')
    return (
      <div className="grid max-w-3xl gap-6">
        <PageHeader title="complaint saved" scope={result.scope} />
        <div className="flex items-start gap-3 border border-line bg-graphite-1 p-6">
          <CircleCheck
            size={20}
            aria-hidden="true"
            className="mt-0.5 flex-none text-indigo-hi"
          />
          <div>
            <h2
              ref={ref}
              tabIndex={-1}
              className="font-bold focus:outline-none"
            >
              {result.originalId} is on record.
            </h2>
            <p className="mt-1 text-sm text-subtle">
              {result.matchingDown
                ? "Matching couldn't run just now. You can run it again from the complaint's page."
                : 'No open cases at other bureaus look related.'}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button asChild>
                <Link to={`/complaints/${result.id}`}>View complaint</Link>
              </Button>
              <Button variant="ghost" onClick={onAddAnother}>
                Add another
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  const top = Math.max(...result.matches.map((m) => m.score));
  const pct = Math.round(top * 100);
  return (
    <div className="grid max-w-3xl gap-6">
      <PageHeader title="complaint saved" scope={result.scope} />
      {/* The dashboard's alert card (and the landing page's .alertc). */}
      <article
        aria-labelledby="overlap-title"
        className="grid gap-4 border-[1.5px] border-alert bg-graphite p-6"
      >
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="alert-pulse size-2 flex-none bg-alert"
          />
          <h2
            id="overlap-title"
            ref={ref}
            tabIndex={-1}
            className="font-display text-[28px] leading-none font-bold text-alert lowercase [font-stretch:75%] focus:outline-none"
          >
            potential overlapping cases
          </h2>
        </div>
        <p className="text-sm text-subtle">
          {result.originalId}
          {institution && <> · {institution.name}</>} looks related to{' '}
          {result.matches.length === 1 ? 'a case' : 'cases'} already open at
          another bureau. Coordinate before acting.
        </p>
        <ul className="grid gap-2" aria-label="Related cases">
          {result.matches.map((m, i) => (
            <li key={i} className="flex flex-wrap items-center gap-3">
              <BureauTag code={m.otherBureau} />
              <span className="font-mono text-[13px]">
                {m.restricted
                  ? 'Case held privately by that bureau'
                  : (m.otherRef ?? m.otherId)}
              </span>
            </li>
          ))}
        </ul>
        <div>
          <div className="flex justify-between text-xs">
            <span className="text-subtle" id="new-conf">
              Match confidence
            </span>
            <span className="font-bold tabular-nums">{pct}%</span>
          </div>
          <div
            role="meter"
            aria-labelledby="new-conf"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            className="mt-2 h-1.5 bg-panel"
          >
            <div className="h-full bg-indigo" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <ul className="flex flex-wrap gap-2" aria-label="Why these match">
          {[...new Set(result.matches.flatMap((m) => m.reasons))].map((r) => (
            <li key={r} className="border border-line-2 px-2 py-1 text-xs">
              {r}
            </li>
          ))}
        </ul>
        <p className="text-xs text-subtle">
          Setu suggests; an officer decides whether the cases are linked.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link to={`/investigations/${result.id}`}>Open investigation</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link to={`/complaints/${result.id}`}>View complaint</Link>
          </Button>
        </div>
      </article>
    </div>
  );
}
