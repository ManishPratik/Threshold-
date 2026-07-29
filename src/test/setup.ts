import '@testing-library/jest-dom/vitest';
// fake-indexeddb polyfills globalThis.indexedDB + globalThis.IDBKeyRange, letting
// the data-layer integration tests exercise real repository code paths (cursors,
// indexes, atomic transactions, migrations) without a real browser.
import 'fake-indexeddb/auto';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});
