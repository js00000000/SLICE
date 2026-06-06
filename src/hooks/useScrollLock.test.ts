import { describe, it, expect, vi, beforeEach } from 'vitest';

let effectCallback: (() => void | (() => void)) | null = null;

vi.mock('react', () => ({
  useEffect: (cb: () => void | (() => void)) => {
    effectCallback = cb;
  }
}));

describe('useScrollLock', () => {
  let mockBody: { style: { overflow: string } };
  let useScrollLock: typeof import('./useScrollLock').useScrollLock;

  beforeEach(async () => {
    vi.resetModules();
    const module = await import('./useScrollLock');
    useScrollLock = module.useScrollLock;
    mockBody = { style: { overflow: '' } };
    vi.stubGlobal('document', { body: mockBody });
    effectCallback = null;
  });

  it('should not lock overflow when lock parameter is false', () => {
    useScrollLock(false);
    if (effectCallback) {
      effectCallback();
    }
    expect(mockBody.style.overflow).toBe('');
  });

  it('should lock overflow when lock parameter is true', () => {
    useScrollLock(true);
    if (effectCallback) {
      effectCallback();
    }
    expect(mockBody.style.overflow).toBe('hidden');
  });

  it('should restore overflow on cleanup', () => {
    mockBody.style.overflow = 'scroll';
    useScrollLock(true);
    if (effectCallback) {
      const cleanup = effectCallback();
      expect(mockBody.style.overflow).toBe('hidden');
      if (cleanup) {
        cleanup();
      }
    }
    expect(mockBody.style.overflow).toBe('scroll');
  });

  it('should support stacked locks (multiple components locking)', () => {
    mockBody.style.overflow = 'scroll';

    // Component A locks
    useScrollLock(true);
    const cleanupA = effectCallback ? effectCallback() : null;
    expect(mockBody.style.overflow).toBe('hidden');

    // Component B locks
    useScrollLock(true);
    const cleanupB = effectCallback ? effectCallback() : null;
    expect(mockBody.style.overflow).toBe('hidden');

    // Component B unmounts
    if (cleanupB) cleanupB();
    expect(mockBody.style.overflow).toBe('hidden'); // Still locked because A is still locked!

    // Component A unmounts
    if (cleanupA) cleanupA();
    expect(mockBody.style.overflow).toBe('scroll'); // Restored!
  });
});
