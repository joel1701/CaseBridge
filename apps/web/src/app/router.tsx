import { createBrowserRouter, Link } from 'react-router';
import { AppLayout } from '@/components/layout/AppLayout';
import { LandingPage } from '@/features/landing/LandingPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { LoginPage } from '@/features/auth/LoginPage';
import { ComplaintsPage } from '@/features/complaints/ComplaintsPage';
import { NewComplaintPage } from '@/features/complaints/NewComplaintPage';
import { ComplaintDetailsPage } from '@/features/complaints/ComplaintDetailsPage';
import { InstitutionProfilePage } from '@/features/institutions/InstitutionProfilePage';
import { BureauQueuePage } from '@/features/bureau-queue/BureauQueuePage';
import { InvestigationPage } from '@/features/investigations/InvestigationPage';
import { GraphPage } from '@/features/graph/GraphPage';
import { ReportsPage } from '@/features/reports/ReportsPage';
import { AlertsPage } from '@/features/dashboard/AlertsPage';
import { StyleguidePage } from '@/features/styleguide/StyleguidePage';

export const router = createBrowserRouter([
  // Public Editorial Landing Page
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/landing',
    element: <LandingPage />,
  },
  // Design system reference, outside the app navigation
  {
    path: '/styleguide',
    element: <StyleguidePage />,
  },

  // Internal Investigation & Coordination Workspace
  {
    element: <AppLayout />,
    children: [
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/app', element: <DashboardPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/complaints', element: <ComplaintsPage /> },
      { path: '/complaints/new', element: <NewComplaintPage /> },
      { path: '/complaints/:id', element: <ComplaintDetailsPage /> },
      { path: '/institutions/:id', element: <InstitutionProfilePage /> },
      { path: '/bureau-queue', element: <BureauQueuePage /> },
      { path: '/investigations/:id', element: <InvestigationPage /> },
      { path: '/graph/:institutionId', element: <GraphPage /> },
      { path: '/alerts', element: <AlertsPage /> },
      { path: '/reports', element: <ReportsPage /> },
      {
        path: '*',
        element: (
          <section className="py-12">
            <h1 className="text-3xl font-semibold text-foreground">
              Page not found
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              The requested resource could not be found within the workspace.
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
]);
