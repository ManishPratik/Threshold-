import { useEffect, useState } from 'react';
import type { Routine, RoutineBlock } from '@data/types/frozen/Routine';
import { RoutineService, useSubmitOnce } from '@features/frozen';
import { DeleteRoutineDialog } from './DeleteRoutineDialog';
import styles from './FrozenRoutinePage.module.css';

export interface FrozenRoutinePageProps {
  promiseId: string;
  /** Fires after the routine is deleted so the parent can navigate away. */
  onRoutineDeleted: (() => void) | undefined;
}

type Mode = 'view' | 'edit';

/**
 * Frozen Routine page. Two modes: view and edit. Empty state offers
 * "Add your first block." — the first Save creates the Routine record.
 * Subsequent Saves replace the block list via RoutineService.replaceBlocks.
 * Reordering uses move-up / move-down buttons for keyboard accessibility.
 */
export function FrozenRoutinePage({
  promiseId,
  onRoutineDeleted,
}: FrozenRoutinePageProps) {
  const [loading, setLoading] = useState(true);
  const [routine, setRoutine] = useState<Routine | null>(null);
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
        const r = await service.getRoutine(promiseId);
        if (cancelled) return;
        setRoutine(r ?? null);
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

  const blocks = routine?.blocks ?? [];

  const persistBlocks = async (nextBlocks: RoutineBlock[]) => {
    const service = new RoutineService();
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

  const handleMove = async (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    const removed = next.splice(index, 1)[0];
    if (!removed) return;
    next.splice(target, 0, removed);
    await persistBlocks(next);
  };

  const showEmpty = routine === null && mode === 'view';
  const showList =
    (routine !== null || mode === 'edit') && editorTarget === null;
  const showAddInline =
    (routine !== null || mode === 'edit') && editorTarget === null;
  const showEditRoutineButton =
    routine !== null && mode === 'view' && editorTarget === null;
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
        <ul className={styles.list}>
          {blocks.map((block, idx) => (
            <li key={block.id} className={styles.listItem}>
              <BlockRow
                block={block}
                index={idx}
                totalBlocks={blocks.length}
                editable={mode === 'edit'}
                onEdit={() => setEditorTarget({ kind: 'edit', block })}
                onDelete={() => setDeletingBlockId(block.id)}
                onMoveUp={() => {
                  void handleMove(idx, -1);
                }}
                onMoveDown={() => {
                  void handleMove(idx, 1);
                }}
              />
              {deletingBlockId === block.id ? (
                <DeleteBlockConfirm
                  onConfirm={() => handleDeleteBlock(block.id)}
                  onCancel={() => setDeletingBlockId(null)}
                />
              ) : null}
            </li>
          ))}
        </ul>
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
          {routine !== null ? (
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
