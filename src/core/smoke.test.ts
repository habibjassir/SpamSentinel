import { describe, expect, it } from 'vitest';
import { CORE_READY } from './index.ts';

// Trivial test so the unit test layer is wired from Increment 0.
// Real core logic and its tests arrive in Increment 1.
describe('core', () => {
  it('is importable without any browser API', () => {
    expect(CORE_READY).toBe(true);
  });
});
