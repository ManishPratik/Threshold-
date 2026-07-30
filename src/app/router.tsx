import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import { TodayPage } from '@routes/today';
import { KnowledgePage } from '@routes/knowledge';
import { AnalyticsPage } from '@routes/analytics';
import { SettingsPage } from '@routes/settings';
import { NotFoundPage } from '@routes/NotFoundPage';
import {
  WelcomeLayout,
  WelcomeScreen1,
  WelcomeScreen2,
  WelcomeScreen3,
  WelcomeScreen4,
  WelcomeScreen5,
} from '@routes/welcome';

// Two top-level surfaces:
//   /            → AppLayout (nav + shell) for the four product routes
//   /welcome/*   → WelcomeLayout (no nav, single continuous canvas) for onboarding
//
// Both are gated by OnboardingGate at their shell entry points.
export const router = createBrowserRouter([
  {
    path: '/welcome',
    element: <WelcomeLayout />,
    errorElement: <NotFoundPage />,
    children: [
      { index: true, element: <WelcomeScreen1 /> },
      { path: 'reframe', element: <WelcomeScreen2 /> },
      { path: 'promise', element: <WelcomeScreen3 /> },
      { path: 'routine', element: <WelcomeScreen4 /> },
      { path: 'commit', element: <WelcomeScreen5 /> },
    ],
  },
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
