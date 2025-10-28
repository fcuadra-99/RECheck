import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/test/setup.ts'],
    css: true,
    exclude: ['e2e/**', 'dev-dist/**', 'node_modules/**'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    coverage: {
      reporter: ['text', 'html'],
      reportsDirectory: 'coverage',
    },
  },
})


