export { KnowledgeVault } from './KnowledgeVault';
export { NoteEditor } from './NoteEditor';
export { NoteCard } from './NoteCard';
export {
  KnowledgeServiceError,
  NOTE_BODY_MAX,
  NOTE_TAGS_MAX,
  NOTE_TAG_MAX_LENGTH,
  NOTE_TITLE_MAX,
  listActiveNotes,
  listTrashedNotes,
  parseTagsInput,
  permanentlyDeleteNote,
  restoreNote,
  saveNote,
  softDeleteNote,
  validateNoteDraft,
} from './knowledgeService';
export type { NoteDraft, NoteFieldError } from './knowledgeService';
