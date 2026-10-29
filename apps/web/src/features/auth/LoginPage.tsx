import { FeaturePage } from '@/components/layout/FeaturePage';
// Standalone route (outside AppLayout), so it supplies its own page padding.
export function LoginPage() {
  return (
    <main className="wrap mx-auto max-w-6xl py-10 lg:py-16">
      <FeaturePage title="Login" owner="Kevin" />
    </main>
  );
}
