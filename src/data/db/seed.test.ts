import { describe, it, expect } from 'vitest';
import { isBootstrapMission, BOOTSTRAP_ID_PREFIX } from './seed';

describe('isBootstrapMission', () => {
  it('returns true for ids beginning with the bootstrap prefix', () => {
    expect(isBootstrapMission({ id: `${BOOTSTRAP_ID_PREFIX}mission-01` })).toBe(true);
    expect(isBootstrapMission({ id: `${BOOTSTRAP_ID_PREFIX}anything` })).toBe(true);
  });

  it('returns false for real ids', () => {
    expect(isBootstrapMission({ id: '01997f7f-1234-7abc-9def-000000000000' })).toBe(false);
    expect(isBootstrapMission({ id: 'anything-else' })).toBe(false);
    expect(isBootstrapMission({ id: '' })).toBe(false);
  });
});
