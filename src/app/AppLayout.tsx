import { useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { UpdatePrompt } from '@/pwa/UpdatePrompt';
import { useServiceWorkerUpdate } from '@/pwa/useServiceWorkerUpdate';
import styles from './AppLayout.module.css';

const NAV_ITEMS = [
  { to: '/today', label: 'Today' },
  { to: '/knowledge', label: 'Knowledge' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/settings', label: 'Settings' },
] as const;

export function AppLayout() {
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const swUpdate = useServiceWorkerUpdate();

  // Accessibility: move focus to <main> on route change so screen readers
  // announce the new page and keyboard users land in content, not the nav.
  useEffect(() => {
    mainRef.current?.focus();
  }, [location.pathname]);

  return (
    <div className={styles.shell}>
      <a href="#main" className="skip-link">
        Skip to main content
      </a>

      <nav className={styles.nav} aria-label="Primary">
        <ul className={styles.navList}>
          {NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <main
        id="main"
        ref={mainRef}
        tabIndex={-1}
        className={styles.main}
      >
        <Outlet />
      </main>

      <UpdatePrompt
        visible={swUpdate.visible}
        updating={swUpdate.updating}
        onUpdate={swUpdate.update}
        onDismiss={swUpdate.dismiss}
      />
    </div>
  );
}
