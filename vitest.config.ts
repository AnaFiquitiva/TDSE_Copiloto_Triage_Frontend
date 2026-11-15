import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Pruebas de la interfaz (Vitest + Testing Library sobre jsdom). La API se
// simula con un fetch falso en cada prueba: ninguna prueba llama a la red.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    restoreMocks: true,
    css: false,
  },
})
