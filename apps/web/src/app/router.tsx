import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, Link } from 'react-router';
import { RootLayout } from '@/app/RootLayout';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { ComplaintsPage } from '@/features/complaints/ComplaintsPage';
import { NewComplaintPage } from '@/features/complaints/NewComplaintPage';
import { ComplaintDetailsPage } from '@/features/complaints/ComplaintDetailsPage';
import { InstitutionProfilePage } from '@/features/institutions/InstitutionProfilePage';
import { BureauQueuePage } from '@/features/bureau-queue/BureauQueuePage';
import { InvestigationPage } from '@/features/investigations/InvestigationPage';
import { AlertsPage } from '@/features/dashboard/AlertsPage';

// Lazy so app users never download the landing page or its animation code.
const LandingPage = lazy(() =>
  import('@/features/landing/LandingPage').then((m) => ({
    default: m.LandingPage,
  })),
);
// Pages with heavy libraries (@xyflow/react, Recharts) load on first visit only.
const GraphPage = lazy(() =>
  import('@/features/graph/GraphPage').then((m) => ({ default: m.GraphPage })),
);
const ReportsPage = lazy(() =>
  import('@/features/reports/ReportsPage').then((m) => ({
    default: m.ReportsPage,
  })),
);
// Internal design reference; never needed by app users.
const StyleguidePage = lazy(() =>
  import('@/features/styleguide/StyleguidePage').then((m) => ({
    default: m.StyleguidePage,
  })),
);
const LoginPage = lazy(() =>
  import('@/features/auth/LoginPage').then((m) => ({ default: m.LoginPage })),
);

function Lazy({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <p role="status" className="sr-only">
          Loading…
        </p>
      }
    >
      {children}
    </Suspense>
  );
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      // Public landing page
      {
        path: '/',
        element: (
          <Lazy>
            <LandingPage />
          </Lazy>
        ),
      },
      {
        path: '/landing',
        element: (
          <Lazy>
            <LandingPage />
          </Lazy>
        ),
      },
      {
        path: '/login',
        element: (
          <Lazy>
            <LoginPage />
          </Lazy>
        ),
      },
      // Design system reference, outside the app navigation
      {
        path: '/styleguide',
        element: (
          <Lazy>
            <StyleguidePage />
          </Lazy>
        ),
      },

      // Internal investigation and coordination workspace
      {
        element: <AppLayout />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/app', element: <DashboardPage /> },
          { path: '/complaints', element: <ComplaintsPage /> },
          { path: '/complaints/new', element: <NewComplaintPage /> },
          { path: '/complaints/:id', element: <ComplaintDetailsPage /> },
          { path: '/institutions/:id', element: <InstitutionProfilePage /> },
          { path: '/bureau-queue', element: <BureauQueuePage /> },
          { path: '/investigations/:id', element: <InvestigationPage /> },
          {
            path: '/graph/:institutionId',
            element: (
              <Lazy>
                <GraphPage />
              </Lazy>
            ),
          },
          { path: '/alerts', element: <AlertsPage /> },
          {
            path: '/reports',
            element: (
              <Lazy>
                <ReportsPage />
              </Lazy>
            ),
          },
          {
            path: '*',
            element: (
              <section className="py-12">
                <h1 className="text-3xl font-semibold text-foreground">
                  Page not found
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  The requested resource could not be found within the
                  workspace.
                </p>
                <div className="mt-6 flex items-center gap-4">
                  <Link
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
                    to="/dashboard"
                  >
                    Go to Dashboard
                  </Link>
                  <Link
                    className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                    to="/"
                  >
                    Return to Landing Page
                  </Link>
                </div>
              </section>
            ),
          },
        ],
      },
    ],
  },
]);
