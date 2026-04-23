import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    exclude: ['e2e/**', 'node_modules/**'],
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'tests/**/*.{test,spec}.{ts,tsx}'],
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      include: ['src/lib/**'],
      thresholds: { lines: 70, functions: 70, branches: 70 },
    },
  },
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
})
