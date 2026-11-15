import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useAsync } from './useAsync'

function deferred<T>() {
  let resolve!: (v: T) => void
  let reject!: (e: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('useAsync', () => {
  it('empieza cargando y luego entrega los datos', async () => {
    const { result } = renderHook(() => useAsync(() => Promise.resolve(42), []))
    expect(result.current.loading).toBe(true)
    expect(result.current.data).toBeNull()
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toBe(42)
  })

  it('convierte el error en un mensaje y reload() reintenta', async () => {
    const fetcher = vi.fn().mockRejectedValueOnce(new Error('caído')).mockResolvedValueOnce('ok')
    const { result } = renderHook(() => useAsync(fetcher, []))
    await waitFor(() => expect(result.current.error).toBe('caído'))
    act(() => result.current.reload())
    expect(result.current.loading).toBe(true)
    expect(result.current.error).toBeNull()
    await waitFor(() => expect(result.current.data).toBe('ok'))
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('descarta la respuesta de una petición anterior al cambiar las dependencias', async () => {
    const raw = deferred<string>()
    const reformatted = deferred<string>()
    const { result, rerender } = renderHook(({ fmt }) => useAsync(() => (fmt === 'raw' ? raw.promise : reformatted.promise), [fmt]), {
      initialProps: { fmt: 'raw' },
    })
    rerender({ fmt: 'reformatted' })
    await act(async () => reformatted.resolve('reformateado'))
    await act(async () => raw.resolve('crudo (tarde)'))
    expect(result.current.data).toBe('reformateado')
  })
})
