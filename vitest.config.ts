import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

/**
 * Vitest config for flash-sale-b2c-fe.
 * - jsdom environment for component tests
 * - Path alias '@/*' -> './src/*' (mirror of tsconfig.json)
 * - Setup file for @testing-library/jest-dom matchers
 * - Coverage via @vitest/coverage-v8
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.tsx'],
    include: [
      'src/**/*.{test,spec}.{ts,tsx}',
      '*.config.{test,spec}.{ts,tsx}',
      '*.test.{ts,tsx}',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.{test,spec}.{ts,tsx}',
        'src/**/index.ts',
        'src/types/**',
        'src/**/*.d.ts',
      ],
      thresholds: {
        // Per testing-required.mdc: lib/decimal.ts >= 90, stores >= 80,
        // hooks >= 70, components (complex) >= 70. Project-wide min 70.
        lines: 70,
        functions: 70,
        branches: 65,
        statements: 70,
      },
    },
  },
});
