import { defineConfig } from 'vitest/config';

// Firestore security-rules tests. These are kept OUT of the main `npm test`
// runner (see vite.config.ts `test.exclude`) because they need a running
// Firestore emulator. They are launched via `npm run test:rules`, which wraps
// this config in `firebase emulators:exec` so the emulator is up (and torn
// down) around the run. In CI they get their own job with a JDK installed.
export default defineConfig({
  test: {
    include: ['firestore-tests/**/*.test.ts'],
    environment: 'node',
    testTimeout: 15_000,
    hookTimeout: 30_000,
    // The suite shares one emulator; clearFirestore() between tests assumes no
    // two files race on the same project state.
    fileParallelism: false,
  },
});
