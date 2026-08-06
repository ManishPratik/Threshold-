import { afterEach, beforeEach, describe, it, expect } from 'vitest';
import { deleteDb } from '@data/db/client';
import { scopedSettingsStore } from './scopedSettingsStore';

// New-code coverage for the E3 storage host factory. Verifies the
// module-scoped keyspace contract (get / put / delete / listKeys) and
// the two-module isolation guarantee that keeps parallel modules from
// colliding on the reused `settings` store per
// src/data/db/migrations.ts:41-42.

describe('scopedSettingsStore', () => {
  beforeEach(async () => {
    await deleteDb();
  });
  afterEach(async () => {
    await deleteDb();
  });

  it('returns undefined for an unset user key', async () => {
    const store = scopedSettingsStore('mod-a');
    expect(await store.get('missing')).toBeUndefined();
  });

  it('round-trips a value via put + get', async () => {
    const store = scopedSettingsStore('mod-a');
    await store.put('k', { n: 42, s: 'hello' });
    expect(await store.get('k')).toEqual({ n: 42, s: 'hello' });
  });

  it('overwrites the value on repeated put', async () => {
    const store = scopedSettingsStore('mod-a');
    await store.put('k', 1);
    await store.put('k', 2);
    expect(await store.get('k')).toBe(2);
  });

  it('delete removes the user key', async () => {
    const store = scopedSettingsStore('mod-a');
    await store.put('k', 'v');
    await store.delete('k');
    expect(await store.get('k')).toBeUndefined();
  });

  it('delete is a no-op on an already-absent key', async () => {
    const store = scopedSettingsStore('mod-a');
    await store.delete('never-written');
    expect(await store.get('never-written')).toBeUndefined();
  });

  it("listKeys returns only the module's own user keys, without the module-id prefix", async () => {
    const a = scopedSettingsStore('mod-a');
    const b = scopedSettingsStore('mod-b');
    await a.put('one', 1);
    await a.put('two', 2);
    await b.put('three', 3);
    const aKeys = [...(await a.listKeys())].sort();
    const bKeys = [...(await b.listKeys())].sort();
    expect(aKeys).toEqual(['one', 'two']);
    expect(bKeys).toEqual(['three']);
  });

  it('two modules do not collide on the same user key', async () => {
    const a = scopedSettingsStore('mod-a');
    const b = scopedSettingsStore('mod-b');
    await a.put('shared', 'from-a');
    await b.put('shared', 'from-b');
    expect(await a.get('shared')).toBe('from-a');
    expect(await b.get('shared')).toBe('from-b');
  });

  it('rejects a module id containing the reserved delimiter', () => {
    expect(() => scopedSettingsStore('bad::id')).toThrow(RangeError);
  });

  it('rejects an empty module id', () => {
    expect(() => scopedSettingsStore('')).toThrow(RangeError);
  });
});
