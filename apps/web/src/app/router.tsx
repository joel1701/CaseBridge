import { createBrowserRouter, Link } from 'react-router';
import { AppLayout } from '@/components/layout/AppLayout';
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
export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <DashboardPage /> },
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
          <section>
            <h1 className="text-3xl font-semibold">Page not found</h1>
            <Link className="mt-4 inline-block underline" to="/">
              Return to dashboard
            </Link>
          </section>
        ),
      },
    ],
  },
]);
