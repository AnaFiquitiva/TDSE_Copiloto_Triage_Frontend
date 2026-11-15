import { useState } from 'react'
import { AlertOctagon, FileText, Scale, Send, Sparkles } from 'lucide-react'
import clsx from 'clsx'

import { errorMessage, fetchConsulta } from '../api'
import type { Backend, ConsultaResponse, CorpusFormat, EmbeddingMode } from '../types'
import {
  Card,
  DisclaimerBanner,
  ErrorBox,
  PageBody,
  PageHero,
  ScoreBar,
  Segmented,
  Skeleton,
  backendText,
  inputClass,
  primaryButton,
  reasonText,
  useCountUp,
} from '../components/Common'
import { LevelBadge, LevelRing, levelColor, LEVELS } from '../components/LevelBadge'

const HERO = 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=1800&auto=format&fit=crop'

const EJEMPLOS = [
  { label: 'Dolor torácico', text: 'el paciente tiene dolor en el pecho que se corre al brazo y esta sudando frio' },
  { label: 'Meningitis pediátrica', text: 'el nino tiene mucha fiebre, esta muy decaido, casi no reacciona y tiene el cuello rigido' },
  { label: 'Quemadura leve', text: 'se quemo la mano con la plancha, es una quemadura pequena y superficial' },
  { label: 'Trámite', text: 'vengo a pedir un certificado medico para el trabajo' },
  { label: 'Relato vago', text: 'no me siento bien desde hace unos dias, algo me pasa pero no sabria decir que es' },
]

export function ConsultaView() {
  const [texto, setTexto] = useState(EJEMPLOS[0].text)
  const [corpusFormat, setCorpusFormat] = useState<CorpusFormat>('reformatted')
  const [embeddingMode, setEmbeddingMode] = useState<EmbeddingMode>('clinical_es')
  const [backend, setBackend] = useState<Backend>('gemini')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ConsultaResponse | null>(null)

  async function onSubmit() {
    if (!texto.trim()) return
    setLoading(true)
    setError(null)
    try {
      setResult(await fetchConsulta({ texto, corpus_format: corpusFormat, embedding_mode: embeddingMode, backend }))
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <PageHero
        eyebrow="Laboratorio · Generación"
        title="Consulta individual"
        description="Prueba un relato y compara la sugerencia del copiloto (nivel + cita, o abstención) con la línea base de reglas, viendo la evidencia recuperada y cambiando la configuración del pipeline."
        image={HERO}
      >
        <div className="w-fit animate-fade-rise" style={{ animationDelay: '220ms' }}>
          <DisclaimerBanner compact />
        </div>
      </PageHero>

      <PageBody>
        <Card hover={false}>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-fg-2">Relato libre del paciente</span>
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) onSubmit()
              }}
              rows={3}
              maxLength={2000}
              className={clsx(inputClass, 'resize-y leading-relaxed')}
              placeholder="Ej: el paciente tiene dolor en el pecho y sudoración fría…"
            />
          </label>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted">Ejemplos:</span>
            {EJEMPLOS.map((ej) => (
              <button
                key={ej.label}
                onClick={() => setTexto(ej.text)}
                title={ej.text}
                className={clsx(
                  'min-h-8 rounded-full border px-3 py-1 text-xs transition hover:-translate-y-0.5',
                  texto === ej.text ? 'border-accent bg-accent/10 text-accent' : 'border-line bg-surface-2 text-fg-2 hover:border-accent/60 hover:text-accent',
                )}
              >
                {ej.label}
              </button>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Segmented
              label="Corpus"
              value={corpusFormat}
              onChange={setCorpusFormat}
              options={[
                { value: 'reformatted', label: 'Reformateado' },
                { value: 'raw', label: 'Crudo' },
              ]}
            />
            <Segmented
              label="Recuperación"
              value={embeddingMode}
              onChange={setEmbeddingMode}
              options={[
                { value: 'clinical_es', label: 'Clínico ES' },
                { value: 'generic', label: 'TF-IDF' },
              ]}
            />
            <Segmented
              label="Generador"
              value={backend}
              onChange={setBackend}
              options={[
                { value: 'gemini', label: 'Gemini' },
                { value: 'deterministic', label: 'Determinista' },
              ]}
            />
          </div>
          {backend === 'gemini' && (
            <p className="mt-3 text-xs text-muted">
              Si el backend no tiene clave de Gemini o la API falla, se usa el respaldo determinista y la respuesta queda marcada como modo degradado.
            </p>
          )}

          <div className="mt-5 flex justify-end">
            <button onClick={onSubmit} disabled={loading || !texto.trim()} className={clsx(primaryButton, 'w-full sm:w-auto')}>
              <Send className="h-4 w-4" />
              {loading ? (backend === 'gemini' ? 'Consultando a Gemini…' : 'Ejecutando el pipeline…') : 'Obtener sugerencia'}
            </button>
          </div>
        </Card>

        <div className="mt-6">
          {loading && (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <Skeleton className="h-72" />
              <Skeleton className="h-72" />
            </div>
          )}
          {error && <ErrorBox message={error} onRetry={onSubmit} />}
          {!loading && result && <ResultPanel key={result.record_hash} result={result} />}
        </div>
      </PageBody>
    </>
  )
}

function ResultPanel({ result }: { result: ConsultaResponse }) {
  const { suggestion, retrieved, baseline, backend_used } = result
  const topScore = Math.max(retrieved[0]?.score ?? 1, 0.001)
  const confidence = useCountUp(suggestion.confidence * 100)
  const agree = !suggestion.abstained && suggestion.level === baseline.level

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <Card className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-fg-2">
            <Sparkles className="h-4 w-4 text-accent" /> Sugerencia del copiloto
          </h3>
          <span
            className={clsx(
              'rounded-full px-2.5 py-1 text-xs font-medium',
              backend_used === 'deterministic_fallback' ? 'bg-warn/15 text-warn' : 'bg-surface-2 text-muted',
            )}
          >
            {backendText(backend_used)}
          </span>
        </div>

        {suggestion.abstained ? (
          <div className="flex items-start gap-3 rounded-xl border border-line bg-surface-2 p-4">
            <AlertOctagon className="mt-0.5 h-5 w-5 shrink-0 text-muted" />
            <div>
              <p className="font-semibold text-fg">Se abstiene y escala a un humano</p>
              <p className="mt-1 text-sm text-fg-2">{reasonText(suggestion.reason)}</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            <LevelRing level={suggestion.level} size="md" />
            <div className="flex min-w-0 flex-col gap-2">
              <p className="font-display text-2xl font-bold" style={{ color: levelColor(suggestion.level) }}>
                {suggestion.level ? LEVELS[suggestion.level].name : ''}
              </p>
              <span className="flex items-center gap-2 text-sm text-fg-2">
                <FileText className="h-4 w-4 text-muted" />
                <code className="break-all rounded bg-surface-2 px-2 py-0.5 font-mono text-xs">{suggestion.citation}</code>
              </span>
              <div className="w-full max-w-xs">
                <div className="mb-1 flex justify-between text-xs text-muted">
                  <span title="Similitud entre el relato y el fragmento citado, no una probabilidad clínica.">Similitud con la evidencia</span>
                  <span className="font-mono">{confidence.toFixed(0)}%</span>
                </div>
                <ScoreBar value={suggestion.confidence} color={levelColor(suggestion.level)} />
              </div>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-line bg-surface-2/60 p-4">
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
            <Scale className="h-3.5 w-3.5" /> Línea base (reglas, sin RAG)
            {!suggestion.abstained && (
              <span className={clsx('ml-auto rounded-full px-2 py-0.5 text-[11px] normal-case', agree ? 'bg-ok/15 text-ok' : 'bg-warn/15 text-warn')}>
                {agree ? 'Coincide' : 'Difiere'}
              </span>
            )}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <LevelBadge level={baseline.level} compact />
            <code className="rounded bg-surface px-2 py-0.5 font-mono text-xs text-fg-2">{baseline.citation}</code>
            {baseline.matched_keyword && (
              <span className="text-xs text-muted">
                palabra clave: <em className="text-fg-2">“{baseline.matched_keyword}”</em>
              </span>
            )}
          </div>
        </div>
      </Card>

      <Card delay={90}>
        <h3 className="mb-4 text-sm font-semibold text-fg-2">Fragmentos recuperados ({retrieved.length})</h3>
        <ul className="flex flex-col gap-3">
          {retrieved.map((rc, i) => (
            <li
              key={rc.chunk_id}
              className={clsx(
                'animate-fade-rise rounded-xl border p-3 transition hover:-translate-y-0.5',
                rc.chunk_id === suggestion.citation ? 'border-accent/50 bg-accent/5' : 'border-line bg-surface-2/50',
              )}
              style={{ animationDelay: `${120 + i * 70}ms` }}
            >
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <code className={clsx('truncate font-mono text-xs font-semibold', rc.chunk_id === suggestion.citation ? 'text-accent' : 'text-fg-2')}>
                  {rc.chunk_id}
                </code>
                <span className="shrink-0 font-mono text-xs text-muted">{rc.score.toFixed(3)}</span>
              </div>
              <ScoreBar value={rc.score} max={topScore} color={levelColor(rc.level)} />
              <p className="mt-2 line-clamp-2 text-xs text-muted">
                {rc.text.replace(/[#*[\]]/g, '').replace(/CITA:.*?\)/, '').trim()}
              </p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
