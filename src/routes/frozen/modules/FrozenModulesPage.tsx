import { useEffect, useState } from 'react';
import { AppStateRepository } from '@data/repositories/frozen/AppStateRepository';
import { listModules } from '@kernel/registry';
import type { LifeProgram } from '@contract/program';
import styles from './FrozenModulesPage.module.css';

/**
 * Built-in kernel modules — not registered through the Life Program
 * registry at src/kernel/registry/index.ts:41. Listed here so the
 * discoverability milestone surfaces them alongside registered Life
 * Programs on /modules. Slice 6 (scope widening) formalises these into
 * proper module manifests; until then they render as always-on cards
 * without an enable/disable toggle.
 */
const BUILT_IN_MODULES = [
  {
    id: 'routine',
    displayName: 'Routine',
    description:
      'Anchor-grouped blocks for the day — morning, midday, evening, night.',
  },
] as const;

export interface FrozenModulesPageProps {
  /** Fires when the user opens a module's detail surface. Adapter routes to /modules/<id>. */
  onOpenModule: (moduleId: string) => void;
}

/**
 * Frozen Modules landing. Two shelves — Enabled + Available. Built-in
 * kernel modules (currently just Routine) always appear under Enabled.
 * Registered Life Programs move between shelves based on the
 * enabledProgramIds pointer at
 * src/data/repositories/frozen/AppStateRepository.ts:88-94.
 */
export function FrozenModulesPage({ onOpenModule }: FrozenModulesPageProps) {
  const [programs] = useState<readonly LifeProgram[]>(() => listModules());
  const [enabledIds, setEnabledIds] = useState<readonly string[] | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const repo = new AppStateRepository();
        const ids = await repo.getEnabledProgramIds();
        if (!cancelled) setEnabledIds(ids);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Failed to load modules.',
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleProgram = async (id: string) => {
    const current = enabledIds ?? [];
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    const repo = new AppStateRepository();
    await repo.setEnabledProgramIds(next);
    setEnabledIds(next);
  };

  const enabledPrograms =
    enabledIds === null
      ? []
      : programs.filter((p) => enabledIds.includes(p.id));
  const availablePrograms =
    enabledIds === null
      ? []
      : programs.filter((p) => !enabledIds.includes(p.id));

  return (
    <div className={styles.column}>
      <p className={styles.eyebrow}>Modules</p>
      <h1 className={styles.hero}>The practices you&apos;re keeping.</h1>

      <section className={styles.section} aria-label="Enabled modules">
        <p className={styles.sectionEyebrow}>Enabled</p>
        {BUILT_IN_MODULES.map((m) => (
          <ModuleCard
            key={m.id}
            title={m.displayName}
            description={m.description}
            onOpen={() => onOpenModule(m.id)}
          />
        ))}
        {enabledPrograms.map((p) => (
          <ModuleCard
            key={p.id}
            title={p.displayName}
            description={p.description}
            onOpen={() => onOpenModule(p.id)}
            toggle={{
              label: `Disable ${p.displayName}.`,
              pressed: true,
              onClick: () => {
                void toggleProgram(p.id);
              },
            }}
          />
        ))}
      </section>

      {availablePrograms.length > 0 ? (
        <section className={styles.section} aria-label="Available modules">
          <p className={styles.sectionEyebrow}>Available</p>
          {availablePrograms.map((p) => (
            <ModuleCard
              key={p.id}
              title={p.displayName}
              description={p.description}
              toggle={{
                label: `Enable ${p.displayName}.`,
                pressed: false,
                onClick: () => {
                  void toggleProgram(p.id);
                },
              }}
            />
          ))}
        </section>
      ) : null}

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

interface ModuleCardProps {
  title: string;
  description: string;
  onOpen?: (() => void) | undefined;
  toggle?:
    | {
        label: string;
        pressed: boolean;
        onClick: () => void;
      }
    | undefined;
}

function ModuleCard({ title, description, onOpen, toggle }: ModuleCardProps) {
  return (
    <div className={styles.card}>
      <p className={styles.cardTitle}>{title}</p>
      <p className={styles.cardDescription}>{description}</p>
      {onOpen !== undefined || toggle !== undefined ? (
        <div className={styles.cardActions}>
          {onOpen !== undefined ? (
            <button
              type="button"
              className={styles.openLink}
              onClick={onOpen}
            >
              Open →
            </button>
          ) : null}
          {toggle !== undefined ? (
            <button
              type="button"
              className={styles.toggleLink}
              onClick={toggle.onClick}
              aria-pressed={toggle.pressed}
            >
              {toggle.label}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
