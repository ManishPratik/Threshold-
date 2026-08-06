import { useEffect, useState } from 'react';
import type { Anchor, Routine, RoutineBlock } from '@data/types/frozen/Routine';
import { RoutineService, useSubmitOnce } from '@features/frozen';
import {
  ANCHOR_LABELS,
  ANCHOR_ORDER,
  getBlockAnchor,
  groupByAnchor,
} from '@features/routine-engine';
import { DeleteRoutineDialog } from './DeleteRoutineDialog';
import styles from './FrozenRoutinePage.module.css';

export interface FrozenRoutinePageProps {
  /**
   * The active Promise's id, when the user has one. Optional per
   * module-independence architecture (Slice C): when absent, the page
   * loads / persists the orphan routine on AppState via
   * `RoutineService.getOrphanRoutineBlocks` /
   * `RoutineService.saveOrphanRoutineBlocks`.
   */
  promiseId?: string;
  /** Fires after the routine is deleted so the parent can navigate away. */
  onRoutineDeleted: (() => void) | undefined;
}

type Mode = 'view' | 'edit';

/**
 * Frozen Routine page. Two modes: view and edit. Empty state offers
 * "Add your first block." — the first Save creates the Routine record.
 * Subsequent Saves replace the block list via RoutineService.replaceBlocks.
 * Reordering uses move-up / move-down buttons for keyboard accessibility.
 *
 * Slice C: when no `promiseId` is passed the page operates in orphan
 * mode. Load / save go through the orphan-routine methods on
 * RoutineService (backed by AppState.orphanRoutine). "Delete entire
 * routine" is hidden in orphan mode; per-block delete continues to work.
 */
export function FrozenRoutinePage({
  promiseId,
  onRoutineDeleted,
}: FrozenRoutinePageProps) {
  const [loading, setLoading] = useState(true);
  // In promise-scoped mode this holds the loaded Routine record.
  // In orphan mode it stays null and `orphanBlocks` carries the blocks.
  const [routine, setRoutine] = useState<Routine | null>(null);
  // In orphan mode this holds the loaded blocks. null when no orphan
  // routine has been authored yet.
  const [orphanBlocks, setOrphanBlocks] = useState<RoutineBlock[] | null>(null);
  const [mode, setMode] = useState<Mode>('view');
  const [editorTarget, setEditorTarget] = useState<
    { kind: 'new' } | { kind: 'edit'; block: RoutineBlock } | null
  >(null);
  const [deletingBlockId, setDeletingBlockId] = useState<string | null>(null);
  const [deleteRoutineOpen, setDeleteRoutineOpen] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const service = new RoutineService();
    let cancelled = false;
    (async () => {
      try {
        if (promiseId !== undefined) {
          const r = await service.getRoutine(promiseId);
          if (cancelled) return;
          setRoutine(r ?? null);
        } else {
          const blocks = await service.getOrphanRoutineBlocks();
          if (cancelled) return;
          setOrphanBlocks(blocks);
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load routine.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [promiseId]);

  if (loading) {
    return <p className={styles.loading}>Loading.</p>;
  }

  const blocks: RoutineBlock[] =
    promiseId !== undefined
      ? routine?.blocks ?? []
      : orphanBlocks ?? [];
  const hasPersistedRoutine =
    promiseId !== undefined ? routine !== null : orphanBlocks !== null;

  const persistBlocks = async (nextBlocks: RoutineBlock[]) => {
    const service = new RoutineService();
    if (promiseId !== undefined) {
      if (!routine) {
        const created = await service.createRoutine({
          promiseId,
          blocks: nextBlocks,
        });
        setRoutine(created);
      } else {
        const updated = await service.replaceBlocks(promiseId, nextBlocks);
        setRoutine(updated);
      }
    } else {
      await service.saveOrphanRoutineBlocks(nextBlocks);
      setOrphanBlocks(nextBlocks);
    }
  };

  const handleAdd = async (block: RoutineBlock) => {
    await persistBlocks([...blocks, block]);
    setEditorTarget(null);
  };

  const handleEdit = async (block: RoutineBlock) => {
    await persistBlocks(blocks.map((b) => (b.id === block.id ? block : b)));
    setEditorTarget(null);
  };

  const handleDeleteBlock = async (id: string) => {
    await persistBlocks(blocks.filter((b) => b.id !== id));
    setDeletingBlockId(null);
  };

  const handleMove = async (blockId: string, delta: -1 | 1) => {
    // Move up/down operates within the block's own anchor bucket. The
    // flat routine.blocks list is the source of truth, but we only
    // swap positions between neighbours that share the same anchor —
    // otherwise a "move up" would drift into a different anchor
    // section without warning.
    const index = blocks.findIndex((b) => b.id === blockId);
    if (index === -1) return;
    const source = blocks[index];
    if (!source) return;
    const anchor = getBlockAnchor(source);
    let neighbourIndex = -1;
    if (delta === -1) {
      for (let i = index - 1; i >= 0; i -= 1) {
        const candidate = blocks[i];
        if (candidate && getBlockAnchor(candidate) === anchor) {
          neighbourIndex = i;
          break;
        }
      }
    } else {
      for (let i = index + 1; i < blocks.length; i += 1) {
        const candidate = blocks[i];
        if (candidate && getBlockAnchor(candidate) === anchor) {
          neighbourIndex = i;
          break;
        }
      }
    }
    if (neighbourIndex === -1) return;
    const next = [...blocks];
    const removed = next.splice(index, 1)[0];
    if (!removed) return;
    next.splice(neighbourIndex, 0, removed);
    await persistBlocks(next);
  };

  const showEmpty = !hasPersistedRoutine && mode === 'view';
  const showList =
    (hasPersistedRoutine || mode === 'edit') && editorTarget === null;
  const showAddInline =
    (hasPersistedRoutine || mode === 'edit') && editorTarget === null;
  const showEditRoutineButton =
    hasPersistedRoutine && mode === 'view' && editorTarget === null;
  const showEditFooter = mode === 'edit' && editorTarget === null;

  return (
    <div className={styles.column}>
      <p className={styles.eyebrow}>Your routine</p>

      {showEmpty ? (
        <EmptyState
          onAddFirst={() => {
            setMode('edit');
            setEditorTarget({ kind: 'new' });
          }}
        />
      ) : null}

      {showList ? (
        (() => {
          const grouped = groupByAnchor(blocks);
          const visibleAnchors = ANCHOR_ORDER.filter(
            (a) => grouped[a].length > 0,
          );
          if (visibleAnchors.length === 0) return null;
          return (
            <div className={styles.anchorGroups}>
              {visibleAnchors.map((anchor) => (
                <section key={anchor} className={styles.anchorSection}>
                  <p className={styles.anchorHeading}>
                    {ANCHOR_LABELS[anchor]}
                  </p>
                  <ul className={styles.list}>
                    {grouped[anchor].map((block) => {
                      const bucket = grouped[anchor];
                      const positionInBucket = bucket.findIndex(
                        (b) => b.id === block.id,
                      );
                      return (
                        <li key={block.id} className={styles.listItem}>
                          <BlockRow
                            block={block}
                            index={positionInBucket}
                            totalBlocks={bucket.length}
                            editable={mode === 'edit'}
                            onEdit={() =>
                              setEditorTarget({ kind: 'edit', block })
                            }
                            onDelete={() => setDeletingBlockId(block.id)}
                            onMoveUp={() => {
                              void handleMove(block.id, -1);
                            }}
                            onMoveDown={() => {
                              void handleMove(block.id, 1);
                            }}
                          />
                          {deletingBlockId === block.id ? (
                            <DeleteBlockConfirm
                              onConfirm={() => handleDeleteBlock(block.id)}
                              onCancel={() => setDeletingBlockId(null)}
                            />
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          );
        })()
      ) : null}

      {editorTarget !== null ? (
        <BlockEditor
          initialBlock={
            editorTarget.kind === 'edit' ? editorTarget.block : undefined
          }
          onSave={editorTarget.kind === 'edit' ? handleEdit : handleAdd}
          onCancel={() => setEditorTarget(null)}
        />
      ) : null}

      {showAddInline ? (
        <div className={styles.addBlockRow}>
          <button
            type="button"
            className={styles.textLink}
            onClick={() => setEditorTarget({ kind: 'new' })}
          >
            Add block.
          </button>
        </div>
      ) : null}

      {showEditRoutineButton ? (
        <div className={styles.addBlockRow}>
          <button
            type="button"
            className={styles.textLink}
            onClick={() => setMode('edit')}
          >
            Edit routine.
          </button>
        </div>
      ) : null}

      {showEditFooter ? (
        <div className={styles.footerActions}>
          <button
            type="button"
            className={styles.primary}
            onClick={() => setMode('view')}
          >
            Done.
          </button>
          {routine !== null && promiseId !== undefined ? (
            <button
              type="button"
              className={styles.warningTextLink}
              onClick={() => setDeleteRoutineOpen(true)}
            >
              Delete routine.
            </button>
          ) : null}
        </div>
      ) : null}

      {/* Slice C — DeleteRoutineDialog is promise-scoped only; orphan
          routine deletion is not yet exposed via a bulk action (users
          can still delete individual blocks). */}
      {promiseId !== undefined ? (
        <DeleteRoutineDialog
          open={deleteRoutineOpen}
          promiseId={promiseId}
          onDeleted={() => {
            setDeleteRoutineOpen(false);
            setRoutine(null);
            setMode('view');
            if (onRoutineDeleted) onRoutineDeleted();
          }}
          onCancel={() => setDeleteRoutineOpen(false)}
        />
      ) : null}

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function EmptyState({ onAddFirst }: { onAddFirst: () => void }) {
  return (
    <div className={styles.emptyStack}>
      <p className={styles.emptyLine}>You have no routine yet.</p>
      <button
        type="button"
        className={styles.textLink}
        onClick={onAddFirst}
      >
        Add your first block.
      </button>
    </div>
  );
}

function BlockRow({
  block,
  index,
  totalBlocks,
  editable,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  block: RoutineBlock;
  index: number;
  totalBlocks: number;
  editable: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <div className={styles.row}>
      <div className={styles.rowMain}>
        <p className={styles.blockName}>{block.name}</p>
        <p className={styles.blockMeta}>
          {block.durationMinutes} min · {block.type}
        </p>
      </div>
      {editable ? (
        <div className={styles.rowActions}>
          <button
            type="button"
            className={styles.iconButton}
            onClick={onMoveUp}
            disabled={index === 0}
            aria-label={`Move ${block.name} up`}
          >
            ↑
          </button>
          <button
            type="button"
            className={styles.iconButton}
            onClick={onMoveDown}
            disabled={index === totalBlocks - 1}
            aria-label={`Move ${block.name} down`}
          >
            ↓
          </button>
          <button
            type="button"
            className={styles.miniLink}
            onClick={onEdit}
          >
            Edit
          </button>
          <button
            type="button"
            className={`${styles.miniLink} ${styles.miniLinkWarning}`}
            onClick={onDelete}
          >
            Delete
          </button>
        </div>
      ) : null}
    </div>
  );
}

function BlockEditor({
  initialBlock,
  onSave,
  onCancel,
}: {
  initialBlock: RoutineBlock | undefined;
  onSave: (block: RoutineBlock) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initialBlock?.name ?? '');
  const [durationMinutes, setDurationMinutes] = useState<number>(
    initialBlock?.durationMinutes ?? 30,
  );
  const [type, setType] = useState(initialBlock?.type ?? 'Ritual');
  const [anchor, setAnchor] = useState<Anchor>(
    initialBlock ? getBlockAnchor(initialBlock) : 'morning',
  );
  const [error, setError] = useState<string>('');
  const guard = useSubmitOnce();

  const trimmedName = name.trim();
  const canSave =
    trimmedName.length > 0 && durationMinutes > 0 && !guard.pending;

  const handleSave = async () => {
    setError('');
    const block: RoutineBlock = {
      id: initialBlock?.id ?? crypto.randomUUID(),
      name: trimmedName,
      durationMinutes,
      type,
      anchor,
    };
    try {
      await guard.submit(() => onSave(block));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save block.');
    }
  };

  return (
    <div className={styles.editorCard}>
      <div className={styles.editorField}>
        <label className={styles.editorLabel} htmlFor="block-name">
          Name
        </label>
        <input
          id="block-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={styles.editorInput}
        />
      </div>
      <div className={styles.editorField}>
        <label className={styles.editorLabel} htmlFor="block-duration">
          Duration (minutes)
        </label>
        <input
          id="block-duration"
          type="number"
          min={1}
          value={durationMinutes}
          onChange={(e) => setDurationMinutes(Number(e.target.value))}
          className={styles.editorInput}
        />
      </div>
      <div className={styles.editorField}>
        <label className={styles.editorLabel} htmlFor="block-type">
          Type
        </label>
        <input
          id="block-type"
          type="text"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className={styles.editorInput}
        />
      </div>
      <div className={styles.editorField}>
        <span className={styles.editorLabel} id="block-anchor-label">
          Anchor
        </span>
        <div
          className={styles.anchorPicker}
          role="radiogroup"
          aria-labelledby="block-anchor-label"
        >
          {ANCHOR_ORDER.map((a) => {
            const active = a === anchor;
            return (
              <button
                type="button"
                key={a}
                role="radio"
                aria-checked={active}
                className={
                  active
                    ? `${styles.anchorPickerButton} ${styles.anchorPickerButtonActive}`
                    : styles.anchorPickerButton
                }
                onClick={() => setAnchor(a)}
              >
                {ANCHOR_LABELS[a]}
              </button>
            );
          })}
        </div>
      </div>
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
      <div className={styles.editorActions}>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={onCancel}
          disabled={guard.pending}
        >
          Cancel
        </button>
        <button
          type="button"
          className={styles.savePrimary}
          onClick={() => {
            void handleSave();
          }}
          disabled={!canSave}
        >
          Save
        </button>
      </div>
    </div>
  );
}

function DeleteBlockConfirm({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}) {
  const [error, setError] = useState<string>('');
  const guard = useSubmitOnce();

  const handleConfirm = async () => {
    setError('');
    try {
      await guard.submit(() => onConfirm());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete block.');
    }
  };

  return (
    <div className={styles.deleteConfirm}>
      <p className={styles.deleteConfirmText}>Delete this block?</p>
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
      <div className={styles.deleteConfirmActions}>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={onCancel}
          disabled={guard.pending}
        >
          Cancel
        </button>
        <button
          type="button"
          className={styles.deleteButton}
          onClick={() => {
            void handleConfirm();
          }}
          disabled={guard.pending}
        >
          Delete block.
        </button>
      </div>
    </div>
  );
}
