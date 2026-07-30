import { useEffect, useId } from 'react';
import styles from './InspirationSection.module.css';

export interface InspirationSectionProps {
  /** Stable id identifying this panel within the parent accordion group. */
  panelId: string;
  /** The panelId currently expanded within the group, or null when all are closed. */
  openId: string | null;
  /** Called with the new open id, or null to close. Parent enforces single-open. */
  onToggle: (id: string | null) => void;
  /** Short, human-authored seed lines. Never AI-generated at runtime. */
  examples: readonly string[];
  /** Called with the chosen example text — parent copies it into the field
   *  and is responsible for returning focus to the linked input. */
  onSelect: (example: string) => void;
}

/**
 * Collapsible "Need inspiration?" affordance. Parent owns the openId so the
 * whole group is a strict accordion — opening one panel closes any other.
 *
 * The panel is kept mounted (with `inert` when closed) so the height +
 * opacity transition can animate both open and close. Escape closes the
 * current panel and returns focus to its trigger.
 *
 * Selecting an example only *copies* the text into the linked field; the
 * user is expected to edit it. The app never writes the user's contract.
 */
export function InspirationSection({
  panelId,
  openId,
  onToggle,
  examples,
  onSelect,
}: InspirationSectionProps) {
  const uid = useId();
  const buttonId = `insp-${panelId}-${uid}-btn`;
  const regionId = `insp-${panelId}-${uid}-panel`;
  const isOpen = openId === panelId;

  // Escape while this panel is open collapses it and returns focus to the
  // trigger. A window-level listener keeps the JSX free of handlers on
  // non-interactive elements and works no matter where focus sits.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      onToggle(null);
      document.getElementById(buttonId)?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, buttonId, onToggle]);

  return (
    <div className={styles.wrap}>
      <button
        type="button"
        id={buttonId}
        className={styles.trigger}
        aria-expanded={isOpen}
        aria-controls={regionId}
        onClick={() => onToggle(isOpen ? null : panelId)}
      >
        Need inspiration?
      </button>
      <div
        id={regionId}
        role="region"
        aria-labelledby={buttonId}
        aria-hidden={!isOpen}
        inert={!isOpen}
        className={`${styles.panel} ${isOpen ? styles.panelOpen : ''}`}
      >
        <div className={styles.panelInner}>
          <ul className={styles.list}>
            {examples.map((ex) => (
              <li key={ex}>
                <button
                  type="button"
                  className={styles.example}
                  onClick={() => onSelect(ex)}
                >
                  {ex}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
