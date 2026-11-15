import type {
  Backend,
  CasosResponse,
  CorpusFormat,
  CorpusResponse,
  DatasetResponse,
  EmbeddingMode,
  ExperimentoResponse,
  ConsultaResponse,
  DecisionHistoryItem,
  DecisionRequest,
  DecisionResponse,
} from './types'

// URL base de la API (repositorio backend, desplegado en Azure). Se fija en
// tiempo de build con VITE_API_URL (p. ej. en Vercel). Vacía = rutas relativas,
// que en desarrollo resuelve el proxy de Vite (vite.config.ts).
const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '')

/** Error de la API con el código HTTP y el request_id del servidor, para
 * mostrar un mensaje útil y poder rastrear el error en los logs. */
export class ApiError extends Error {
  status: number
  requestId: string | null
  constructor(message: string, status: number, requestId: string | null) {
    super(message)
    this.status = status
    this.requestId = requestId
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let resp: Response
  try {
    resp = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...init,
    })
  } catch {
    throw new ApiError(
      'No se pudo conectar con el servidor. Verifica tu conexión o que el backend esté activo.',
      0,
      null,
    )
  }
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}))
    // FastAPI devuelve `detail` como texto (HTTPException) o como lista de
    // errores de validación (422 de Pydantic).
    const detail = Array.isArray(body.detail)
      ? body.detail.map((d: { msg?: string }) => (d.msg ?? String(d)).replace(/^Value error, /, '')).join('; ')
      : typeof body.detail === 'string'
        ? body.detail
        : null
    const fallback =
      resp.status >= 500
        ? 'El servidor tuvo un problema. Intenta de nuevo en un momento.'
        : `La solicitud no se pudo completar (error ${resp.status}).`
    throw new ApiError(detail ?? fallback, resp.status, body.request_id ?? resp.headers.get('X-Request-ID'))
  }
  return resp.json() as Promise<T>
}

export function errorMessage(e: unknown): string {
  if (e instanceof ApiError && e.requestId && e.status >= 500) return `${e.message} (código ${e.requestId.slice(0, 8)})`
  return e instanceof Error ? e.message : 'Error desconocido'
}

export function fetchConsulta(params: {
  texto: string
  corpus_format: CorpusFormat
  embedding_mode: EmbeddingMode
  backend: Backend
}): Promise<ConsultaResponse> {
  return request<ConsultaResponse>('/api/consulta', {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

export function postDecision(body: DecisionRequest): Promise<DecisionResponse> {
  return request<DecisionResponse>('/api/decision', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function fetchDecisiones(limit = 10): Promise<DecisionHistoryItem[]> {
  return request<DecisionHistoryItem[]>(`/api/decisiones?limit=${limit}`)
}

export function fetchExperimento(): Promise<ExperimentoResponse> {
  return request<ExperimentoResponse>('/api/experimento')
}

export function fetchDataset(): Promise<DatasetResponse> {
  return request<DatasetResponse>('/api/dataset')
}

export function fetchCasos(): Promise<CasosResponse> {
  return request<CasosResponse>('/api/casos')
}

export function fetchCorpus(corpusFormat: CorpusFormat): Promise<CorpusResponse> {
  return request<CorpusResponse>(`/api/corpus?corpus_format=${corpusFormat}`)
}
