import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { NavBar } from '@features/frozen';
import styles from './FrozenAppLayout.module.css';

const NAV_ITEMS = [
  { key: 'today', label: 'Today' },
  { key: 'chain', label: 'Chain' },
  { key: 'history', label: 'History' },
  { key: 'settings', label: 'Settings' },
];

function activeKeyFromPath(pathname: string): string | undefined {
  if (pathname === '/' || pathname.startsWith('/today')) return 'today';
  if (pathname === '/chain' || /^\/promise\/[^/]+\/chain$/.test(pathname)) {
    return 'chain';
  }
  if (pathname === '/history' || /^\/promise\/[^/]+$/.test(pathname)) {
    return 'history';
  }
  if (pathname.startsWith('/settings')) return 'settings';
  return undefined;
}

/**
 * FrozenAppLayout — router-level layout that mounts the NavBar on every
 * route and reserves matching bottom padding on the main content so
 * routes never overlap the bar. The Create-Promise onboarding flow is
 * treated as focused: the NavBar is hidden and the padding compressed.
 */
export function FrozenAppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const activeKey = activeKeyFromPath(location.pathname);
  const isFocusedFlow = location.pathname.startsWith('/create-promise');

  const handleSelect = (key: string) => {
    if (key === 'today') navigate('/today');
    else if (key === 'chain') navigate('/chain');
    else if (key === 'history') navigate('/history');
    else if (key === 'settings') navigate('/settings');
  };

  return (
    <div className={styles.shell}>
      <main
        key={location.pathname}
        className={isFocusedFlow ? styles.mainFocused : styles.main}
      >
        <Outlet />
      </main>
      {isFocusedFlow ? null : (
        <NavBar
          items={NAV_ITEMS}
          {...(activeKey !== undefined ? { activeKey } : {})}
          onSelect={handleSelect}
        />
      )}
    </div>
  );
}
