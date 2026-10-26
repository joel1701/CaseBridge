import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { getDashboardSummary } from '@/shared/api/dashboard';
import {
  FeaturePage,
  LoadingState,
  ErrorState,
} from '@/components/layout/FeaturePage';
import { Button } from '@/components/ui/button';
export function DashboardPage() {
  const query = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: getDashboardSummary,
    retry: false,
  });
  return (
    <FeaturePage title="Coordination overview" owner="Pritika">
      <div className="mt-6">
        {query.isPending ? (
          <LoadingState />
        ) : query.isError ? (
          <ErrorState retry={() => void query.refetch()} />
        ) : (
          <>
            <p className="mb-3 text-xs text-muted-foreground">
              {query.data.scope === 'SYNTHETIC'
                ? 'Illustrative fixture totals; not live bureau records.'
                : 'Authorized records only.'}
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ['Complaints', query.data.totalComplaints],
                ['Overlap reviews', query.data.pendingOverlapReviews],
                ['Active actions', query.data.activeActions],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border p-5">
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="mt-2 text-3xl font-semibold">{value}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <div className="mt-6">
        <Button asChild>
          <Link to="/complaints">Open complaints</Link>
        </Button>
      </div>
    </FeaturePage>
  );
}
