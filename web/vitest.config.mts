import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
      // The original Astro libs, for parity oracles. tsc sees tests/legacy/*.d.ts instead.
      '@legacy': fileURLToPath(new URL('../astro-site/src/lib', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
  },
});
