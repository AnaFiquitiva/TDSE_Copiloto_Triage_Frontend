import { describe, expect, it, vi } from 'vitest'

import { ApiError, errorMessage, fetchCasos, postDecision } from './api'

describe('api.ts', () => {
  it('traduce un fallo de red a un mensaje claro en español', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    const err = await fetchCasos().catch((e) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(err.status).toBe(0)
    expect(err.message).toMatch(/No se pudo conectar con el servidor/)
  })

  it('une los errores de validación 422 de Pydantic sin el prefijo técnico', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ detail: [{ msg: 'Value error, Indica quién revisa (nombre del profesional).' }] }), { status: 422 }),
      ),
    )
    const err = await postDecision({ record_hash: 'x', action: 'confirma', review_seconds: 1, user: '' }).catch((e) => e)
    expect(err.status).toBe(422)
    expect(err.message).toBe('Indica quién revisa (nombre del profesional).')
  })

  it('en un 500 muestra un mensaje genérico con el código corto del request_id', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ request_id: '0123456789abcdef' }), { status: 500 })),
    )
    const err = await fetchCasos().catch((e) => e)
    expect(errorMessage(err)).toBe('El servidor tuvo un problema. Intenta de nuevo en un momento. (código 01234567)')
  })
})
