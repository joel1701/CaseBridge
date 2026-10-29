import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
// Shared page frame for feature screens. Exported names and props are relied on by every page.
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
      <h1 className="font-display text-[clamp(40px,5vw,72px)] leading-[0.86] font-bold tracking-[-0.012em] text-balance text-indigo-hi lowercase [font-stretch:75%]">
        {title}
      </h1>
      <p className="mt-4 text-sm text-subtle">Owner: {owner}</p>
      <div className="mt-8 border border-line bg-graphite-1 p-6">
        <h2 className="font-bold">Ready for development</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-subtle">
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
    <div className="grid gap-3 py-2">
      <Skeleton className="h-5 w-2/5" label="Loading summary…" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    </div>
  );
}
export function ErrorState({ retry }: { retry: () => void }) {
  return (
    <div role="alert" className="border border-line bg-graphite-1 p-5">
      <p className="text-sm">
        Summary unavailable. In API mode, this endpoint awaits implementation.
      </p>
      <Button variant="ghost" size="sm" className="mt-4" onClick={retry}>
        Retry
      </Button>
    </div>
  );
}
