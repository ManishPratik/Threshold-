import { useState } from 'react';
import { Button, Card, Heading, Text, TextArea } from '@shared/ui';
import type { Mission } from '@data/types/Mission';
import type { DayLog } from '@data/types/DayLog';
import { formatShortDate, formatWitnessTimestamp } from '@shared/lib/date';
import { currentLogicalDate } from '@shared/lib/dayBoundary';
import { isBootstrapMission } from '@data/db/seed';
import { getMissionHealth, healthLabel } from './getMissionHealth';
import { getMissionProgress } from './getMissionProgress';
import { updateActiveMissionEditable } from './missionContractService';
import styles from './MissionSummaryCard.module.css';

export interface MissionSummaryCardProps {
  mission: Mission;
  todayDayLog: DayLog | undefined;
  /** Current Self-Trust score. null while loading — renders a "—" placeholder. */
  selfTrustScore: number | null;
  /** Called when the user asks to create their own mission (bootstrap only). */
  onCreateOwnContract?: (() => void) | undefined;
  /** Called after a successful notes/reward edit so callers can refresh. */
  onMissionUpdated?: ((mission: Mission) => void) | undefined;
}

/**
 * Compact by default, expandable on tap. Expansion reveals why + dates +
 * inline editors for Notes and Reward (the only two editable fields after
 * activation, per ADR 0007).
 *
 * When the mission is bootstrap, an additional "Create your own" CTA appears
 * so the user can replace scaffolding with their real contract.
 */
export function MissionSummaryCard({
  mission,
  todayDayLog,
  selfTrustScore,
  onCreateOwnContract,
  onMissionUpdated,
}: MissionSummaryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const progress = getMissionProgress(mission, currentLogicalDate());
  const health = getMissionHealth(mission, todayDayLog);
  const bootstrap = isBootstrapMission(mission);

  return (
    <Card padding="md" className={styles.card} as="section" aria-labelledby="mission-title">
      <button
        type="button"
        className={styles.header}
        aria-expanded={expanded}
        aria-controls="mission-details"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className={styles.left}>
          <Heading level={2} visualLevel={4} id="mission-title" className={styles.title}>
            {mission.title}
          </Heading>
          {!bootstrap && mission.activatedAt ? (
            <span className={styles.witnessTimestamp} aria-hidden="true">
              {formatWitnessTimestamp(mission.activatedAt)}
            </span>
          ) : null}
          <Text size="sm" variant="secondary" className={styles.dayLabel}>
            {progress.totalDays !== null
              ? `Day ${progress.currentDay} of ${progress.totalDays}`
              : `Day ${progress.currentDay}`}
          </Text>
        </div>
        <div className={styles.right}>
          <span className={styles.selfTrust} aria-label={`Self-Trust score ${selfTrustScore ?? 'loading'}`}>
            <span className={styles.selfTrustLabel}>Self-Trust</span>
            <span className={styles.selfTrustValue}>
              {selfTrustScore === null ? '—' : selfTrustScore}
            </span>
          </span>
          <span className={`${styles.health} ${styles[`health-${health}`]}`}>
            {healthLabel(health)}
          </span>
          <span aria-hidden="true" className={`${styles.chev} ${expanded ? styles.chevOpen : ''}`}>
            ▾
          </span>
        </div>
      </button>

      {expanded && (
        <div id="mission-details" className={styles.details}>
          <Details mission={mission} onMissionUpdated={onMissionUpdated} />
        </div>
      )}

      {bootstrap && onCreateOwnContract && (
        <div className={styles.bootstrapBanner}>
          <Text size="sm" variant="secondary" className={styles.bootstrapNote}>
            This is example content.
          </Text>
          <Button type="button" size="sm" variant="secondary" onClick={onCreateOwnContract}>
            Create your own contract
          </Button>
        </div>
      )}
    </Card>
  );
}

function Details({
  mission,
  onMissionUpdated,
}: {
  mission: Mission;
  onMissionUpdated?: ((m: Mission) => void) | undefined;
}) {
  return (
    <dl className={styles.dl}>
      <ReadOnlyRow label="Why" value={mission.statement} />
      <ReadOnlyRow label="Start" value={formatShortDate(mission.startDate)} />
      <ReadOnlyRow
        label="End"
        value={mission.endDate ? formatShortDate(mission.endDate) : '—'}
      />
      <EditableRow
        label="Reward"
        field="reward"
        mission={mission}
        onSaved={(m) => onMissionUpdated?.(m)}
      />
      <EditableRow
        label="Notes"
        field="notes"
        mission={mission}
        onSaved={(m) => onMissionUpdated?.(m)}
      />
    </dl>
  );
}

function ReadOnlyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.row}>
      <dt className={styles.term}>{label}</dt>
      <dd className={styles.def}>{value || '—'}</dd>
    </div>
  );
}

function EditableRow({
  label,
  field,
  mission,
  onSaved,
}: {
  label: string;
  field: 'notes' | 'reward';
  mission: Mission;
  onSaved: (m: Mission) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(mission[field] ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const startEdit = () => {
    setDraft(mission[field] ?? '');
    setError(undefined);
    setEditing(true);
  };

  const cancel = () => {
    setEditing(false);
    setError(undefined);
  };

  const save = () => {
    setSaving(true);
    setError(undefined);
    void (async () => {
      try {
        const updated = await updateActiveMissionEditable(mission.id, { [field]: draft });
        setSaving(false);
        setEditing(false);
        onSaved(updated);
      } catch (e) {
        setSaving(false);
        setError(e instanceof Error ? e.message : 'Save failed.');
      }
    })();
  };

  return (
    <div className={styles.row}>
      <dt className={styles.term}>{label}</dt>
      <dd className={styles.def}>
        {editing ? (
          <div className={styles.editor}>
            <TextArea
              label={`Edit ${label.toLowerCase()}`}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              errorText={error}
            />
            <div className={styles.editorActions}>
              <Button type="button" variant="ghost" size="sm" onClick={cancel} disabled={saving}>
                Cancel
              </Button>
              <Button type="button" variant="primary" size="sm" onClick={save} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
        ) : (
          <div className={styles.readWrap}>
            <span className={styles.readValue}>{mission[field] || '—'}</span>
            <button type="button" className={styles.editLink} onClick={startEdit}>
              Edit
            </button>
          </div>
        )}
      </dd>
    </div>
  );
}
