import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { OnboardingGate, OnboardingSetupProvider } from '@features/onboarding';
import styles from './WelcomeLayout.module.css';

/**
 * Onboarding shell. No top nav — the app "opens up" only after the promise
 * exists. Warm ivory canvas inherited from the body. A single continuous
 * surface across all six /welcome/* screens so route changes read as one
 * moment, not as a series of pages.
 */
export function WelcomeLayout() {
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    mainRef.current?.focus();
  }, [location.pathname]);

  return (
    <div className={styles.shell}>
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      <main id="main" ref={mainRef} tabIndex={-1} className={styles.main} aria-label="Onboarding">
        <OnboardingGate>
          <OnboardingSetupProvider>
            <Outlet />
          </OnboardingSetupProvider>
        </OnboardingGate>
      </main>
    </div>
  );
}
