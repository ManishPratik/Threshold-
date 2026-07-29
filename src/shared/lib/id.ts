// UUID v7 — time-ordered UUIDs. Preferred because they sort lexicographically by
// creation time, which is useful for IndexedDB cursor traversal.
//
// Falls back to a monotonic-time-plus-random string when crypto.getRandomValues
// is unavailable (older browsers). The fallback is not RFC-compliant but is
// unique for a single-user PWA.

function randomBytes(n: number): Uint8Array {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    return crypto.getRandomValues(new Uint8Array(n));
  }
  const arr = new Uint8Array(n);
  for (let i = 0; i < n; i += 1) {
    arr[i] = Math.floor(Math.random() * 256);
  }
  return arr;
}

function toHex(bytes: Uint8Array): string {
  let out = '';
  for (const b of bytes) {
    out += b.toString(16).padStart(2, '0');
  }
  return out;
}

export function generateId(): string {
  const nowMs = Date.now();
  const timeHex = nowMs.toString(16).padStart(12, '0'); // 48 bits of unix ms

  const rand = randomBytes(10);
  // Set version (7) — high nibble of byte 6
  rand[0] = ((rand[0] ?? 0) & 0x0f) | 0x70;
  // Set variant (10xx) — high two bits of byte 8
  rand[2] = ((rand[2] ?? 0) & 0x3f) | 0x80;

  const randHex = toHex(rand);

  return (
    timeHex.slice(0, 8) +
    '-' +
    timeHex.slice(8, 12) +
    '-' +
    randHex.slice(0, 4) +
    '-' +
    randHex.slice(4, 8) +
    '-' +
    randHex.slice(8, 20)
  );
}
