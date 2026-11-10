/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Rutas relativas: la app funciona en cualquier subcarpeta (p. ej. GitHub Pages /nexora/)
  base: './',
  plugins: [react()],
  test: { include: ['src/tests/**/*.test.ts'] },
  build: { chunkSizeWarningLimit: 2500 },
  worker: { format: 'es' },
})
