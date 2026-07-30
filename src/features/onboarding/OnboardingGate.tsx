import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { missionRepository } from '@data/repositories';
import { isBootstrapMission } from '@data/db/seed';
import { onboardingService } from './onboardingService';

type GateStatus = 'checking' | 'welcome-required' | 'ready';

/**
 * Wraps the app shell. On mount, decides whether the current user should be
 * routed through the onboarding at /welcome. Two considerations:
 *
 *   1. New users (no completion flag, no real mission): route to /welcome.
 *   2. Legacy users (no flag, but they already committed a real mission before
 *      this feature shipped): silently mark completed — never surprise-drop
 *      an existing user into onboarding they never asked for.
 *
 * While the check is in flight, renders nothing (a blank warm canvas). The
 * decision happens in a single IndexedDB roundtrip.
 */
export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const onWelcome = location.pathname.startsWith('/welcome');
  const [status, setStatus] = useState<GateStatus>('checking');

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const completedAt = await onboardingService.getCompletedAt();
      if (completedAt !== null) {
        if (!cancelled) setStatus('ready');
        return;
      }
      // No flag. Legacy-user check: any non-bootstrap mission counts as "already onboarded".
      const activeMission = await missionRepository.getActive();
      if (activeMission && !isBootstrapMission(activeMission)) {
        await onboardingService.markCompleted();
        if (!cancelled) setStatus('ready');
        return;
      }
      if (!cancelled) setStatus('welcome-required');
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === 'checking') {
    // Warm ivory blank canvas — inherits body background. Nothing renders here.
    return null;
  }

  if (status === 'welcome-required' && !onWelcome) {
    return <Navigate to="/welcome" replace />;
  }

  if (status === 'ready' && onWelcome) {
    // User is on /welcome but they've already completed. Send them home.
    return <Navigate to="/today" replace />;
  }

  return <>{children}</>;
}
