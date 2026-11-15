import { vi } from 'vitest'
import type { ConsultaResponse, DecisionHistoryItem, DecisionResponse } from '../types'

const HASH = 'a'.repeat(64)

/** Sugerencia nivel II elevada por regla (el modelo dijo III). */
export function consultaElevada(over: Partial<ConsultaResponse> = {}): ConsultaResponse {
  return {
    suggestion: { level: 2, citation: 'ALARMA-DOLOR-TORACICO-GRAVE', confidence: 0.57, abstained: false, reason: 'elevado_por_regla_de_alarma' },
    retrieved: [
      { chunk_id: 'ALARMA-DOLOR-TORACICO-GRAVE', score: 0.27, text: 'Dolor torácico opresivo → Nivel II', level: 2 },
      { chunk_id: 'ALARMA-DOLOR-TORACICO-LEVE', score: 0.2, text: 'Dolor torácico sin alarma → Nivel III', level: 3 },
    ],
    baseline: { level: 2, citation: 'KW-PECHO', matched_keyword: 'pecho' },
    backend_used: 'gemini',
    record_hash: HASH,
    degraded: false,
    escalated: false,
    n_modelo: 3,
    n_reglas: 2,
    n_final: 2,
    model_citation: 'ALARMA-DOLOR-TORACICO-LEVE',
    alarms: [{ rule_id: 'ALR-026', level: 2, citation: 'ALARMA-DOLOR-TORACICO-GRAVE', matched_pattern: 'se corre al brazo', text: null }],
    cited_fragment_text: '## [CITA: ALARMA-DOLOR-TORACICO-GRAVE] Dolor torácico con signos de alarma\n\nDolor **opresivo** irradiado al brazo.',
    disclaimer: 'Sugerencia de apoyo.',
    ...over,
  }
}

/** Abstención con escalamiento. */
export function consultaAbstencion(): ConsultaResponse {
  return consultaElevada({
    suggestion: { level: null, citation: null, confidence: 0, abstained: true, reason: 'evidencia_insuficiente' },
    escalated: true,
    n_modelo: null,
    n_reglas: null,
    n_final: null,
    model_citation: null,
    alarms: [],
    cited_fragment_text: null,
  })
}

export function decisionOk(over: Partial<DecisionResponse> = {}): DecisionResponse {
  return {
    event_hash: 'b'.repeat(64),
    ref_hash: HASH,
    action: 'confirma',
    final_level: 2,
    suggested_level: 2,
    user: 'Ana Pérez',
    user_role: 'Enfermero/a jefe',
    timestamp_utc: '2026-11-15T21:00:00Z',
    ...over,
  }
}

type Route = { method: string; path: string; status?: number; body: unknown }

/** fetch falso: responde según método + inicio de la ruta y registra las llamadas. */
export function mockApi(routes: Route[]) {
  const calls: { method: string; url: string; body: unknown }[] = []
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    const method = (init?.method ?? 'GET').toUpperCase()
    calls.push({ method, url, body: init?.body ? JSON.parse(String(init.body)) : undefined })
    const route = routes.find((r) => r.method === method && url.includes(r.path))
    if (!route) return new Response(JSON.stringify({ detail: `sin ruta simulada: ${method} ${url}` }), { status: 500 })
    return new Response(JSON.stringify(route.body), {
      status: route.status ?? 200,
      headers: { 'Content-Type': 'application/json' },
    })
  })
  vi.stubGlobal('fetch', fetchMock)
  return { calls, fetchMock }
}

export const historialVacio: DecisionHistoryItem[] = []
