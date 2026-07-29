import { useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { UpdatePrompt } from '@/pwa/UpdatePrompt';
import { useServiceWorkerUpdate } from '@/pwa/useServiceWorkerUpdate';
import {
  TodayGlyph,
  KnowledgeGlyph,
  AnalyticsGlyph,
  SettingsGlyph,
  SearchGlyph,
} from '@shared/ui';
import styles from './AppLayout.module.css';

const NAV_ITEMS = [
  { to: '/today', label: 'Today', Glyph: TodayGlyph },
  { to: '/knowledge', label: 'Knowledge', Glyph: KnowledgeGlyph },
  { to: '/analytics', label: 'Analytics', Glyph: AnalyticsGlyph },
  { to: '/settings', label: 'Settings', Glyph: SettingsGlyph },
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

      <header className={styles.topbar}>
        <div className={styles.topbarInner}>
          <NavLink to="/today" className={() => styles.brand} aria-label="Personal OS · Today">
            <span className={styles.brandMark} aria-hidden="true">
              P
            </span>
            <span className={styles.brandName}>Personal OS</span>
          </NavLink>

          <nav className={styles.nav} aria-label="Primary">
            <ul className={styles.navList}>
              {NAV_ITEMS.map(({ to, label, Glyph }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    className={({ isActive }) =>
                      `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                    }
                  >
                    <Glyph size="sm" decorative />
                    <span>{label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className={styles.navRight}>
            <button type="button" className={styles.searchStub} aria-label="Search (coming soon)">
              <SearchGlyph size="sm" decorative />
              <span className={styles.searchLabel}>Search or jump…</span>
              <span className={styles.kbd} aria-hidden="true">⌘K</span>
            </button>
          </div>
        </div>
      </header>

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
