import type { ReactNode } from 'react';
export function FeaturePage({
  title,
  owner,
  children,
}: {
  title: string;
  owner: string;
  children?: ReactNode;
}) {
  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Foundation · Team Aarohan
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-3 text-muted-foreground">Feature owner: {owner}</p>
      <div className="mt-8 rounded-lg border bg-white p-6">
        <h2 className="font-semibold">Ready for development</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          This is a starter screen. Workflow implementation belongs to the
          feature owner. AI suggestions support officer review and do not
          determine regulatory outcomes.
        </p>
        {children}
      </div>
    </section>
  );
}
export function LoadingState() {
  return (
    <p role="status" className="p-6">
      Loading summary…
    </p>
  );
}
export function ErrorState({ retry }: { retry: () => void }) {
  return (
    <div role="alert" className="rounded border p-5">
      <p>
        Summary unavailable. In API mode, this endpoint awaits implementation.
      </p>
      <button className="mt-3 underline" onClick={retry}>
        Try again
      </button>
    </div>
  );
}
