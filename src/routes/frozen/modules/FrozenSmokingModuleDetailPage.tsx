import { useEffect, useState } from 'react';
import { AppStateRepository } from '@data/repositories/frozen/AppStateRepository';
import { getModule } from '@kernel/registry';
import styles from './FrozenModulesPage.module.css';

export interface FrozenSmokingModuleDetailPageProps {
  onBack: () => void;
}

const MODULE_ID = 'smoking';

/**
 * Minimum-viable module-detail surface for Smoking Cessation. Reads
 * the manifest via getModule at src/kernel/registry/index.ts:47 to
 * display name + description. Enable/disable wires to
 * src/data/repositories/frozen/AppStateRepository.ts:101-117 —
 * identical semantics to the toggle at FrozenModulesPage.
 *
 * Smoking's daily runtime surfaces (SmokingTodayWidget ambient +
 * intervention cards + Craving-SOS overlay) all render on Home per
 * ADR 0009 §5. This detail surface is intentionally light — its role
 * is enable/disable + a link back to Modules.
 */
export function FrozenSmokingModuleDetailPage({
  onBack,
}: FrozenSmokingModuleDetailPageProps) {
  const [enabledIds, setEnabledIds] = useState<readonly string[] | null>(null);
  const [error, setError] = useState<string>('');
  const module = getModule(MODULE_ID);

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
            err instanceof Error ? err.message : 'Failed to load module.',
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = async () => {
    const current = enabledIds ?? [];
    const next = current.includes(MODULE_ID)
      ? current.filter((x) => x !== MODULE_ID)
      : [...current, MODULE_ID];
    const repo = new AppStateRepository();
    await repo.setEnabledProgramIds(next);
    setEnabledIds(next);
  };

  if (!module) {
    return (
      <div className={styles.column}>
        <p className={styles.eyebrow}>Module</p>
        <h1 className={styles.hero}>Smoking Cessation is not registered.</h1>
        <button type="button" className={styles.openLink} onClick={onBack}>
          ← Modules
        </button>
      </div>
    );
  }

  const enabled = enabledIds !== null && enabledIds.includes(MODULE_ID);

  return (
    <div className={styles.column}>
      <p className={styles.eyebrow}>Module</p>
      <h1 className={styles.hero}>{module.displayName}</h1>
      <p className={styles.cardDescription}>{module.description}</p>

      <section className={styles.section} aria-label="Enablement">
        <p className={styles.sectionEyebrow}>Status</p>
        <button
          type="button"
          className={styles.toggleLink}
          onClick={() => {
            void toggle();
          }}
          aria-pressed={enabled}
        >
          {enabled
            ? `Disable ${module.displayName}.`
            : `Enable ${module.displayName}.`}
        </button>
        <p className={styles.cardDescription}>
          {enabled
            ? 'This module runs on Home. See the Craving-SOS button and interventions there.'
            : 'Enable this module to see its widgets and interventions on Home.'}
        </p>
      </section>

      <button type="button" className={styles.openLink} onClick={onBack}>
        ← Modules
      </button>

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
