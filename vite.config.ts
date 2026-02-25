/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/core/**/*.ts', 'src/store/**/*.ts'],
      exclude: [
        'src/components/**',
        'src/pages/**',
        'src/**/*.tsx',
        'src/App.tsx',
        'src/main.tsx',
      ],
    },
  },
})
