import { useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { NavBar } from '@features/frozen';
import { listNavEntries } from '@kernel/registry';
import type { NavEntry } from '@contract/program';
import styles from './FrozenAppLayout.module.css';

/**
 * Platform NavBar entries. Always present regardless of which modules
 * are registered. Order-first, module contributions appended.
 * Settings anchors to the tail per convention.
 */
const PLATFORM_TOP: readonly NavEntry[] = [
  {
    key: 'today',
    label: 'Today',
    path: '/today',
    matches: (p: string) => p === '/' || p.startsWith('/today'),
    weight: 100,
  },
  {
    key: 'modules',
    label: 'Modules',
    path: '/modules',
    matches: (p: string) => p.startsWith('/modules'),
    weight: 90,
  },
];
const PLATFORM_TAIL: readonly NavEntry[] = [
  {
    key: 'settings',
    label: 'Settings',
    path: '/settings',
    matches: (p: string) => p.startsWith('/settings'),
    weight: 0,
  },
];

function activeKeyFromEntries(
  pathname: string,
  entries: readonly NavEntry[],
): string | undefined {
  for (const e of entries) {
    const active = e.matches
      ? e.matches(pathname)
      : pathname === e.path || pathname.startsWith(`${e.path}/`);
    if (active) return e.key;
  }
  return undefined;
}

/**
 * FrozenAppLayout — router-level layout that mounts the NavBar on every
 * route and reserves matching bottom padding on the main content so
 * routes never overlap the bar. The Create-Promise onboarding flow is
 * treated as focused: the NavBar is hidden and the padding compressed.
 *
 * Slice F — Module-owned navigation. The NavBar entries are composed
 * from platform-level items (Today, Modules, Settings) plus every
 * registered module's `navEntries` via `listNavEntries()` at
 * src/kernel/registry/index.ts. No module receives privileged NavBar
 * placement. Promise's Chain + History entries come through
 * src/features/frozen/promise/promiseModule.ts; a future module
 * declares `navEntries` on its manifest and gets an entry without
 * editing this file.
 */
export function FrozenAppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isFocusedFlow = location.pathname.startsWith('/create-promise');

  const navItems = useMemo(() => {
    const module = listNavEntries();
    return [...PLATFORM_TOP, ...module, ...PLATFORM_TAIL];
  }, []);
  const pathToEntry = useMemo(() => {
    const map = new Map<string, string>();
    for (const e of navItems) map.set(e.key, e.path);
    return map;
  }, [navItems]);
  const activeKey = activeKeyFromEntries(location.pathname, navItems);

  const handleSelect = (key: string) => {
    const path = pathToEntry.get(key);
    if (path !== undefined) navigate(path);
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
          items={navItems.map((e) => ({ key: e.key, label: e.label }))}
          {...(activeKey !== undefined ? { activeKey } : {})}
          onSelect={handleSelect}
        />
      )}
    </div>
  );
}
