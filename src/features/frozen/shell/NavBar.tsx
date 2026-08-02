import type { ReactNode } from 'react';
import styles from './NavBar.module.css';

/**
 * One entry in the frozen nav bar. `key` identifies the entry for
 * selection callbacks; `label` renders inside the button.
 */
export interface NavBarItem {
  key: string;
  label: ReactNode;
}

export interface NavBarProps {
  items: readonly NavBarItem[];
  activeKey?: string;
  onSelect: (key: string) => void;
}

/**
 * Frozen-architecture NavBar — fixed bottom bar with 4 items. Active
 * entry gets accent ink + accent underline via `aria-current="page"`
 * and a class hook. Selection is delegated to the caller; NavBar owns
 * no navigation logic.
 */
export function NavBar({ items, activeKey, onSelect }: NavBarProps) {
  return (
    <nav className={styles.nav} aria-label="Primary">
      {items.map((item) => {
        const isActive = item.key === activeKey;
        const className = isActive
          ? `${styles.item} ${styles.itemActive}`
          : styles.item;
        return (
          <button
            key={item.key}
            type="button"
            aria-current={isActive ? 'page' : undefined}
            className={className}
            onClick={() => onSelect(item.key)}
          >
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
