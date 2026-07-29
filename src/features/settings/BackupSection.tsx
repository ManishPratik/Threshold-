import { useRef, useState } from 'react';
import { Button, Card, Heading, Text } from '@shared/ui';
import {
  BACKUP_SCHEMA_VERSION,
  buildBackup,
  parseAndValidateBackup,
  replaceAllFromBackup,
  serializeBackup,
  type BackupData,
  type BackupPayload,
} from '@data/db/backup';
import { todayLocal } from '@shared/lib/date';
import styles from './BackupSection.module.css';

type ImportStage =
  | { kind: 'idle' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; payload: BackupPayload; counts: Record<keyof BackupData, number> }
  | { kind: 'restoring' };

/**
 * Backup & Restore. Export writes a single-file JSON to the user's disk;
 * Import loads a chosen backup, validates its shape, previews the record
 * counts, then replaces every store on confirmation and reloads.
 *
 * Two-step confirmation for Import matches the Reset pattern already used
 * in Danger Zone — restore is destructive.
 */
export function BackupSection() {
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | undefined>(undefined);
  const [importStage, setImportStage] = useState<ImportStage>({ kind: 'idle' });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const doExport = () => {
    setExportError(undefined);
    setExporting(true);
    void (async () => {
      try {
        const payload = await buildBackup(__APP_VERSION__);
        const json = serializeBackup(payload);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const filename = `personal-os-backup-${todayLocal()}.json`;
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (e) {
        setExportError(e instanceof Error ? e.message : 'Export failed.');
      } finally {
        setExporting(false);
      }
    })();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    void (async () => {
      try {
        const raw = await file.text();
        const result = parseAndValidateBackup(raw);
        if (!result.valid) {
          setImportStage({ kind: 'error', message: result.errors.join(' ') });
          return;
        }
        setImportStage({ kind: 'ready', payload: result.payload, counts: result.counts });
      } catch (e) {
        setImportStage({
          kind: 'error',
          message: e instanceof Error ? e.message : 'Could not read file.',
        });
      } finally {
        // Reset the input so re-selecting the same file re-triggers the change event.
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    })();
  };

  const doRestore = () => {
    if (importStage.kind !== 'ready') return;
    const payload = importStage.payload;
    setImportStage({ kind: 'restoring' });
    void (async () => {
      try {
        await replaceAllFromBackup(payload);
        window.location.reload();
      } catch (e) {
        setImportStage({
          kind: 'error',
          message: e instanceof Error ? e.message : 'Restore failed.',
        });
      }
    })();
  };

  return (
    <section className={styles.section} aria-labelledby="backup-heading">
      <div className={styles.header}>
        <Heading level={2} visualLevel={3} id="backup-heading" className={styles.title}>
          Backup &amp; Restore
        </Heading>
        <Text size="sm" variant="secondary">
          Save your data to a file, or restore from one. Backups stay on your device.
        </Text>
      </div>

      <Card padding="md" className={styles.card} as="article">
        <div className={styles.row}>
          <div className={styles.rowText}>
            <Text as="span" size="md" weight="medium">
              Export data
            </Text>
            <Text size="sm" variant="secondary" className={styles.rowSubtitle}>
              Downloads a single JSON file containing every mission, routine, note,
              day log, promise event, snapshot, review, and setting on this device.
            </Text>
          </div>
          <Button type="button" variant="secondary" onClick={doExport} disabled={exporting}>
            {exporting ? 'Preparing…' : 'Export'}
          </Button>
        </div>
        {exportError && (
          <p className={styles.error} role="alert">
            {exportError}
          </p>
        )}
      </Card>

      <Card padding="md" className={styles.card} as="article">
        <div className={styles.row}>
          <div className={styles.rowText}>
            <Text as="span" size="md" weight="medium">
              Restore from backup
            </Text>
            <Text size="sm" variant="secondary" className={styles.rowSubtitle}>
              Loads a backup file and replaces every record on this device. This
              cannot be undone.
            </Text>
          </div>
          <label className={styles.filePicker}>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleFileChange}
              className={styles.fileInput}
              aria-label="Choose backup file"
            />
            <span className={styles.filePickerButton}>Choose file…</span>
          </label>
        </div>

        {importStage.kind === 'error' && (
          <p className={styles.error} role="alert">
            {importStage.message}
          </p>
        )}

        {importStage.kind === 'ready' && (
          <div className={styles.previewPanel}>
            <Text size="sm" variant="secondary" className={styles.previewIntro}>
              Preview:
              exported {importStage.payload.exportedAt.slice(0, 10)},
              app v{importStage.payload.appVersion},
              schema v{importStage.payload.schemaVersion} · matches current v
              {BACKUP_SCHEMA_VERSION}.
            </Text>
            <ul className={styles.countList}>
              {(Object.keys(importStage.counts) as (keyof BackupData)[]).map((key) => (
                <li key={key} className={styles.countChip}>
                  <span className={styles.chipLabel}>{key}</span>
                  <span className={styles.chipValue}>{importStage.counts[key]}</span>
                </li>
              ))}
            </ul>
            <div className={styles.previewActions}>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setImportStage({ kind: 'idle' })}
              >
                Cancel
              </Button>
              <Button type="button" variant="danger" onClick={doRestore}>
                Replace all data
              </Button>
            </div>
          </div>
        )}

        {importStage.kind === 'restoring' && (
          <Text size="sm" variant="secondary" className={styles.restoringLine}>
            Restoring…
          </Text>
        )}
      </Card>
    </section>
  );
}
