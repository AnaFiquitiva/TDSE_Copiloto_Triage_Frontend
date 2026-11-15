import { useCallback, useEffect, useState } from 'react'

import { errorMessage } from './api'

type Settled<T> = { key: string; data: T | null; error: string | null }

/**
 * Carga datos asíncronos sin llamar a setState de forma síncrona dentro del
 * efecto: `loading` se deriva de si la última respuesta corresponde a la
 * petición actual (`key`), en vez de guardarse con setLoading(true).
 *
 * - `deps` identifica la petición (p. ej. el formato del corpus): al cambiar,
 *   se vuelve a pedir y mientras tanto `loading` es true.
 * - `reload()` repite la petición actual.
 * - Las respuestas de peticiones viejas se descartan.
 */
export function useAsync<T>(fetcher: () => Promise<T>, deps: readonly unknown[]) {
  const [attempt, setAttempt] = useState(0)
  const key = JSON.stringify([deps, attempt])
  const [settled, setSettled] = useState<Settled<T> | null>(null)

  useEffect(() => {
    let current = true
    fetcher().then(
      (data) => current && setSettled({ key, data, error: null }),
      (e) => current && setSettled({ key, data: null, error: errorMessage(e) }),
    )
    return () => {
      current = false
    }
    // `key` resume deps + reintentos; fetcher puede cambiar en cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const loading = settled?.key !== key
  const reload = useCallback(() => setAttempt((a) => a + 1), [])

  return {
    data: loading ? null : (settled?.data ?? null),
    error: loading ? null : (settled?.error ?? null),
    loading,
    reload,
  }
}
