import { STORES } from '@data/db/schema';
import type { Note } from '@data/types';
import { Repository } from './Repository';

export class NoteRepository extends Repository<Note> {
  constructor() {
    super(STORES.notes);
  }

  async getActive(): Promise<Note[]> {
    const all = await this.getAll();
    return all.filter((n) => n.deletedAt === null);
  }
}

export const noteRepository = new NoteRepository();
