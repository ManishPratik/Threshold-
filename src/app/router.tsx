import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import { TodayPage } from '@routes/today';
import { KnowledgePage } from '@routes/knowledge';
import { AnalyticsPage } from '@routes/analytics';
import { SettingsPage } from '@routes/settings';
import { NotFoundPage } from '@routes/NotFoundPage';

// All four top-level routes share the AppLayout (nav + shell).
// The root path redirects to /today — Personal OS opens on Today by default.
export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <NotFoundPage />,
    children: [
      { index: true, element: <Navigate to="/today" replace /> },
      { path: 'today', element: <TodayPage /> },
      { path: 'knowledge', element: <KnowledgePage /> },
      { path: 'analytics', element: <AnalyticsPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
