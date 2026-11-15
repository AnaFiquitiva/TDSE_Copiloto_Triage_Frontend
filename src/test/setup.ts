import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

afterEach(() => {
  cleanup()
  localStorage.clear()
  document.documentElement.className = ''
})

// jsdom no implementa matchMedia, scrollIntoView ni scrollTo.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: query.includes('min-width: 1024px'), // escritorio por defecto
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
})
Element.prototype.scrollIntoView = vi.fn()
Element.prototype.scrollTo = vi.fn() as unknown as typeof Element.prototype.scrollTo
window.scrollTo = vi.fn() as unknown as typeof window.scrollTo
