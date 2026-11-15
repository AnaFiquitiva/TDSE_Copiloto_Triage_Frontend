import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  BellRing,
  Check,
  CheckCircle2,
  ChevronDown,
  Circle,
  FileText,
  History,
  PenLine,
  RotateCcw,
  Send,
  Settings2,
  Siren,
  UserRound,
} from 'lucide-react'
import clsx from 'clsx'

import { errorMessage, fetchConsulta, fetchDecisiones, postDecision } from '../api'
import type { ConsultaResponse, DecisionAction, DecisionHistoryItem, DecisionResponse } from '../types'
import {
  Card,
  DisclaimerBanner,
  ErrorBox,
  PageBody,
  PageHero,
  ScoreBar,
  Skeleton,
  backendText,
  inputClass,
  primaryButton,
  reasonText,
  useCountUp,
} from '../components/Common'
import { LEVELS, LevelBadge, LevelRing, levelColor, levelLabel } from '../components/LevelBadge'

const HERO = 'https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=1800&auto=format&fit=crop'

const EJEMPLOS = [
  { label: 'Dolor torácico', text: 'el paciente tiene dolor en el pecho que se corre al brazo y esta sudando frio' },
  { label: 'Meningitis pediátrica', text: 'el nino tiene mucha fiebre, esta muy decaido, casi no reacciona y tiene el cuello rigido' },
  { label: 'Riesgo suicida', text: 'dice que ya tiene todo listo para hacerse daño esta noche' },
  { label: 'Quemadura leve', text: 'se quemo la mano con la plancha, es una quemadura pequena y superficial' },
  { label: 'Trámite', text: 'vengo a pedir un certificado medico para el trabajo' },
]

/** Cargos fijos; el nombre es libre. Nunca se precarga una persona. */
const CARGOS = [
  'Médico/a de urgencias',
  'Médico/a general',
  'Enfermero/a jefe',
  'Enfermero/a',
  'Auxiliar de enfermería',
  'Otro profesional de salud',
]

type Step = 1 | 2 | 3

export function RevisionView() {
  const [texto, setTexto] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ConsultaResponse | null>(null)
  const [done, setDone] = useState<DecisionResponse | null>(null)
  const [history, setHistory] = useState<DecisionHistoryItem[] | null>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  const loadHistory = useCallback(() => {
    fetchDecisiones(6)
      .then(setHistory)
      .catch(() => setHistory([]))
  }, [])

  useEffect(loadHistory, [loadHistory])

  async function onSubmit() {
    if (!texto.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    setDone(null)
    try {
      // Ruta principal por defecto (Gemini); el backend marca el modo degradado si cae al respaldo.
      const r = await fetchConsulta({ texto, corpus_format: 'reformatted', embedding_mode: 'clinical_es', backend: 'gemini' })
      setResult(r)
      requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setTexto('')
    setResult(null)
    setDone(null)
    setError(null)
    document.getElementById('main')?.scrollTo({ top: 0, behavior: 'smooth' })
    window.setTimeout(() => document.getElementById('relato-revision')?.focus(), 300)
  }

  const step: Step = done ? 3 : result ? 2 : 1

  return (
    <>
      <PageHero
        eyebrow={`Revisión humana · paso ${step} de 3`}
        title="Revisión de la sugerencia"
        description="Revisa la sugerencia, su cita normativa y las alarmas detectadas; luego confirma el nivel o corrígelo con un motivo. Cada decisión queda firmada en el registro de auditoría encadenado."
        image={HERO}
      >
        <div className="w-fit animate-fade-rise" style={{ animationDelay: '220ms' }}>
          <DisclaimerBanner compact />
        </div>
      </PageHero>

      <PageBody>
        <Stepper step={step} />

        <Card className="mt-6" hover={false}>
          <label className="flex flex-col gap-2" htmlFor="relato-revision">
            <span className="flex items-center gap-2 text-sm font-semibold text-fg-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent">1</span>
              Relato libre del paciente
            </span>
          </label>
          <textarea
            id="relato-revision"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) onSubmit()
            }}
            rows={3}
            maxLength={2000}
            className={clsx(inputClass, 'mt-2 resize-y leading-relaxed')}
            placeholder="Escribe lo que cuenta el paciente o su acompañante…"
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted">Ejemplos:</span>
            {EJEMPLOS.map((ej) => (
              <button
                key={ej.label}
                onClick={() => setTexto(ej.text)}
                title={ej.text}
                className="min-h-8 rounded-full border border-line bg-surface-2 px-3 py-1 text-xs text-fg-2 transition hover:-translate-y-0.5 hover:border-accent/60 hover:text-accent"
              >
                {ej.label}
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-muted">{texto.length}/2000 · Ctrl + Enter para enviar</span>
            <button onClick={onSubmit} disabled={loading || !texto.trim()} className={clsx(primaryButton, 'w-full sm:w-auto')}>
              <Send className="h-4 w-4" />
              {loading ? 'Analizando el relato…' : 'Obtener sugerencia'}
            </button>
          </div>
        </Card>

        <div ref={resultRef} className="scroll-mt-4">
          {loading && <ResultSkeleton />}
          {error && (
            <div className="mt-6">
              <ErrorBox message={error} onRetry={onSubmit} />
            </div>
          )}
          {!loading && result && (
            <SuggestionReview
              key={result.record_hash}
              result={result}
              texto={texto}
              done={done}
              onDone={(d) => {
                setDone(d)
                loadHistory()
              }}
              onNew={reset}
            />
          )}
        </div>

        <DecisionHistory items={history} highlight={done?.event_hash} />
      </PageBody>
    </>
  )
}

function Stepper({ step }: { step: Step }) {
  const steps = ['Relato', 'Sugerencia', 'Decisión']
  return (
    <ol className="relative flex items-center justify-between" aria-label="Progreso de la revisión">
      <div className="absolute left-4 right-4 top-4 h-0.5 rounded-full bg-line" aria-hidden />
      <div
        className="absolute left-4 top-4 h-0.5 rounded-full bg-accent transition-[width] duration-700 ease-out"
        style={{ width: `calc((100% - 2rem) * ${(step - 1) / 2})` }}
        aria-hidden
      />
      {steps.map((label, i) => {
        const n = (i + 1) as Step
        const state = n < step ? 'done' : n === step ? 'current' : 'todo'
        return (
          <li key={label} className="relative z-10 flex flex-col items-center gap-1.5" aria-current={state === 'current' ? 'step' : undefined}>
            <span
              className={clsx(
                'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ring-4 ring-bg transition-all duration-500',
                state === 'done' && 'bg-accent text-on-accent',
                state === 'current' && 'scale-110 bg-accent-strong text-on-accent shadow-[0_0_0_6px_color-mix(in_srgb,var(--accent)_20%,transparent)]',
                state === 'todo' && 'border border-line bg-surface-2 text-muted',
              )}
            >
              {state === 'done' ? <Check className="h-4 w-4" /> : n}
            </span>
            <span className={clsx('text-xs font-medium sm:text-sm', state === 'todo' ? 'text-muted' : 'text-fg')}>{label}</span>
          </li>
        )
      })}
    </ol>
  )
}

function ResultSkeleton() {
  return (
    <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12" aria-label="Cargando sugerencia">
      <div className="flex flex-col gap-4 lg:col-span-5">
        <Skeleton className="h-28" />
        <Skeleton className="h-36" />
      </div>
      <div className="lg:col-span-7">
        <Skeleton className="h-72" />
      </div>
    </div>
  )
}

function SuggestionReview({
  result,
  texto,
  done,
  onDone,
  onNew,
}: {
  result: ConsultaResponse
  texto: string
  done: DecisionResponse | null
  onDone: (d: DecisionResponse) => void
  onNew: () => void
}) {
  const shownAt = useRef<number>(0)
  useEffect(() => {
    shownAt.current = performance.now()
  }, [])

  const { suggestion, n_final, n_modelo, n_reglas, alarms } = result
  const hasLevel = n_final !== null
  const raisedByRule = hasLevel && n_modelo !== null && n_reglas !== null && n_reglas < n_modelo
  const ruleReference = !hasLevel && n_reglas !== null ? alarms.find((a) => a.level === n_reglas) : undefined
  const topScore = Math.max(result.retrieved[0]?.score ?? 1, 1e-6)
  const confidence = useCountUp(suggestion.confidence * 100)

  return (
    <div className="mt-6 flex flex-col gap-6">
      {/* Avisos críticos arriba de todo (no se pueden pasar por alto). */}
      {raisedByRule && (
        <div role="alert" className="animate-fade-rise rounded-2xl border border-danger/50 bg-danger/10 p-5">
          <div className="flex gap-3">
            <Siren className="mt-0.5 h-6 w-6 shrink-0 animate-pulse text-danger" />
            <div className="min-w-0">
              <p className="font-display text-lg font-bold text-danger">
                Nivel elevado de {LEVELS[n_modelo!].roman} a {LEVELS[n_final!].roman} por regla de alarma
              </p>
              <p className="mt-1 text-sm text-fg-2">
                El modelo sugirió {levelLabel(n_modelo)} (cita <code className="font-mono text-xs">{result.model_citation}</code>), pero una
                regla de seguridad detectó un signo de alarma y subió el nivel. Revisa la alarma antes de decidir.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {alarms
                  .filter((a) => a.level === n_reglas)
                  .map((a) => (
                    <span key={a.rule_id} className="inline-flex items-center gap-1.5 rounded-full bg-danger/15 px-2.5 py-1 text-xs font-semibold text-danger">
                      <AlertTriangle className="h-3.5 w-3.5" /> “{a.matched_pattern}”
                    </span>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
      {result.escalated && (
        <div role="alert" className="flex animate-fade-rise items-start gap-3 rounded-2xl border border-danger/50 bg-danger/10 p-5 text-danger">
          <BellRing className="mt-0.5 h-6 w-6 shrink-0" />
          <div>
            <p className="font-display text-lg font-bold">Escalar a revisión prioritaria</p>
            <p className="mt-1 text-sm text-fg-2">El sistema se abstuvo y no propone un nivel. Clasifica el caso manualmente.</p>
          </div>
        </div>
      )}
      {result.degraded && (
        <div className="flex animate-fade-rise items-start gap-3 rounded-2xl border border-warn/40 bg-warn/10 p-4 text-sm text-warn">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>
            <strong>Modo degradado:</strong> la ruta principal (Gemini) no estuvo disponible y se usó el respaldo determinista.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-5">
          <Card delay={0}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-fg-2">Relato del paciente</h3>
              <button
                onClick={() => document.getElementById('relato-revision')?.focus()}
                className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
              >
                <PenLine className="h-3.5 w-3.5" /> Editar
              </button>
            </div>
            <blockquote className="rounded-xl border border-line bg-surface-2 p-4 text-sm leading-relaxed text-fg-2">“{texto}”</blockquote>
          </Card>

          <Card delay={90}>
            <h3 className="mb-3 text-sm font-semibold text-fg-2">Alarmas detectadas</h3>
            {alarms.length === 0 ? (
              <p className="text-sm text-muted">Ninguna regla de alarma coincidió con el relato.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {alarms.map((a, i) => (
                  <li
                    key={a.rule_id}
                    className="flex animate-fade-rise flex-wrap items-center gap-2 rounded-xl border border-line bg-surface-2 p-2.5 text-xs"
                    style={{ animationDelay: `${150 + i * 60}ms` }}
                  >
                    <LevelBadge level={a.level} compact />
                    <code className="font-mono text-fg-2">{a.rule_id}</code>
                    <span className="w-full text-muted sm:w-auto">“{a.matched_pattern}”</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-6 lg:col-span-7">
          <Card delay={60} className="sm:p-7">
            <p className="mb-5 flex items-center gap-2 text-sm font-semibold text-fg-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent">2</span>
              Sugerencia del copiloto
            </p>
            {hasLevel ? (
              <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
                <LevelRing level={n_final} />
                <div className="flex min-w-0 flex-col gap-2">
                  <h2 className="font-display text-3xl font-bold" style={{ color: levelColor(n_final) }}>
                    {LEVELS[n_final!].name}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted">Cita</span>
                    <code className="break-all rounded-lg border border-line bg-surface-2 px-2 py-1 font-mono text-xs text-fg-2">{suggestion.citation}</code>
                  </div>
                  <div className="w-full max-w-xs">
                    <div className="mb-1 flex justify-between text-xs text-muted">
                      <span title="Similitud entre el relato y el fragmento citado, no una probabilidad clínica.">Similitud con la evidencia</span>
                      <span className="font-mono">{confidence.toFixed(0)}%</span>
                    </div>
                    <ScoreBar value={suggestion.confidence} color={levelColor(n_final)} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-4 rounded-xl border border-line bg-surface-2 p-4">
                <LevelRing level={null} size="md" />
                <div className="text-sm">
                  <p className="font-display text-lg font-bold text-fg">Sin sugerencia del modelo</p>
                  <p className="mt-1 text-fg-2">{reasonText(suggestion.reason)}</p>
                  {ruleReference && (
                    <p className="mt-2 text-xs text-muted">
                      Referencia de una regla de alarma (no del modelo): {levelLabel(ruleReference.level)} ·{' '}
                      <code className="font-mono">{ruleReference.citation}</code>
                    </p>
                  )}
                </div>
              </div>
            )}

            {result.cited_fragment_text && (
              <div className="mt-6 border-t border-line pt-5">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
                  <FileText className="h-3.5 w-3.5" /> Fragmento normativo citado
                </p>
                <div
                  className="whitespace-pre-wrap rounded-xl border-l-4 p-4 text-sm leading-relaxed text-fg-2"
                  style={{
                    borderColor: levelColor(n_final ?? n_reglas),
                    background: `linear-gradient(90deg, color-mix(in srgb, ${levelColor(n_final ?? n_reglas)} 8%, transparent), transparent)`,
                  }}
                >
                  {cleanFragment(result.cited_fragment_text)}
                </div>
              </div>
            )}
          </Card>

          <details className="group animate-fade-rise rounded-2xl border border-line bg-surface/60 p-4" style={{ animationDelay: '160ms' }}>
            <summary className="flex min-h-8 cursor-pointer list-none items-center justify-between text-sm font-semibold text-muted transition hover:text-fg">
              <span className="flex items-center gap-2">
                <Settings2 className="h-4 w-4" /> Detalles técnicos y fragmentos ({result.retrieved.length})
              </span>
              <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
            </summary>
            <div className="mt-4 space-y-4 border-t border-line pt-4">
              <dl className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
                <div>
                  <dt className="mb-1 text-muted">Ruta</dt>
                  <dd className="text-fg-2">{backendText(result.backend_used)}</dd>
                </div>
                <div>
                  <dt className="mb-1 text-muted">Registro de auditoría</dt>
                  <dd>
                    <code className="font-mono text-fg-2">{result.record_hash.slice(0, 16)}…</code>
                  </dd>
                </div>
              </dl>
              <ul className="space-y-3">
                {result.retrieved.map((rc) => (
                  <li key={rc.chunk_id}>
                    <div className="mb-1 flex justify-between gap-2 text-xs">
                      <code className={clsx('truncate font-mono', rc.chunk_id === suggestion.citation ? 'font-semibold text-accent' : 'text-fg-2')}>
                        {rc.chunk_id}
                      </code>
                      <span className="shrink-0 font-mono text-muted">{rc.score.toFixed(3)}</span>
                    </div>
                    <ScoreBar value={rc.score} max={topScore} color={levelColor(rc.level)} />
                  </li>
                ))}
              </ul>
            </div>
          </details>
        </div>
      </div>

      {done ? (
        <SuccessCard done={done} onNew={onNew} />
      ) : (
        <DecisionForm result={result} hasLevel={hasLevel} shownAt={shownAt} onDone={onDone} />
      )}
    </div>
  )
}

function DecisionForm({
  result,
  hasLevel,
  shownAt,
  onDone,
}: {
  result: ConsultaResponse
  hasLevel: boolean
  shownAt: React.RefObject<number>
  onDone: (d: DecisionResponse) => void
}) {
  // Sin opción preseleccionada: la confirmación exige una elección activa.
  const [action, setAction] = useState<DecisionAction | null>(null)
  const [level, setLevel] = useState<number | null>(null)
  const [reason, setReason] = useState('')
  // Quién revisa: cargo de una lista fija + nombre libre. Empiezan vacíos.
  const [cargo, setCargo] = useState('')
  const [nombre, setNombre] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reviewerOk = cargo !== '' && nombre.trim().length >= 2
  const decisionOk = (action === 'confirma' && hasLevel) || (action === 'corrige' && level !== null && reason.trim().length > 0)
  const valid = decisionOk && reviewerOk

  const missing = !action
    ? 'Elige confirmar o corregir'
    : !decisionOk
      ? 'Completa el nivel y el motivo'
      : !cargo
        ? 'Selecciona tu cargo'
        : !reviewerOk
          ? 'Escribe tu nombre'
          : null

  const buttonText = !valid
    ? missing
    : action === 'confirma'
      ? `Registrar: confirma ${levelLabel(result.n_final, true).replace('Nivel', 'nivel')}`
      : `Registrar: corrige a ${levelLabel(level, true).replace('Nivel', 'nivel')}`

  async function onRegister() {
    if (!valid || action === null) return
    setSending(true)
    setError(null)
    try {
      const reviewSeconds = (performance.now() - (shownAt.current ?? performance.now())) / 1000
      onDone(
        await postDecision({
          record_hash: result.record_hash,
          action,
          final_level: action === 'corrige' ? (level ?? undefined) : undefined,
          reason: action === 'corrige' ? reason.trim() : undefined,
          review_seconds: Math.round(reviewSeconds * 10) / 10,
          user: nombre.trim(),
          user_role: cargo,
        }),
      )
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setSending(false)
    }
  }

  return (
    <Card delay={200} hover={false} className="sm:p-7">
      <h3 className="mb-5 flex items-center gap-2 font-display text-xl font-bold">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/15 text-sm font-bold text-accent">3</span>
        Decisión del profesional
      </h3>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2" role="radiogroup" aria-label="Decisión">
        <ChoiceCard
          selected={action === 'confirma'}
          disabled={!hasLevel}
          onSelect={() => setAction('confirma')}
          title={hasLevel ? `Confirmar ${levelLabel(result.n_final, true).replace('Nivel', 'nivel')}` : 'Confirmar nivel'}
          hint={hasLevel ? 'Acepto la sugerencia como clasificación final.' : 'No hay nivel que confirmar (abstención).'}
        />
        <ChoiceCard
          selected={action === 'corrige'}
          onSelect={() => setAction('corrige')}
          title="Corregir nivel"
          hint="Elijo otro nivel y explico por qué."
        />
      </div>

      {action === 'corrige' && (
        <div className="mt-5 flex animate-fade-rise flex-col gap-4">
          <div>
            <p className="mb-2 text-xs font-medium text-muted">Nivel final</p>
            <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label="Nivel final">
              {[1, 2, 3, 4, 5].map((n) => {
                const sel = level === n
                const c = levelColor(n)
                return (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={sel}
                    aria-label={levelLabel(n)}
                    title={levelLabel(n)}
                    onClick={() => setLevel(n)}
                    className={clsx('flex min-h-14 flex-col items-center justify-center rounded-xl border-2 transition', sel ? 'scale-105' : 'hover:-translate-y-0.5')}
                    style={{
                      borderColor: sel ? c : 'var(--border)',
                      backgroundColor: sel ? `color-mix(in srgb, ${c} 14%, transparent)` : 'var(--surface-2)',
                      color: c,
                    }}
                  >
                    <span className="font-display text-lg font-bold">{LEVELS[n].roman}</span>
                    <span className="hidden text-[11px] font-medium sm:block">{LEVELS[n].name}</span>
                  </button>
                )
              })}
            </div>
          </div>
          <label className="flex flex-col gap-1.5 text-xs font-medium text-muted">
            Motivo de la corrección (obligatorio)
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} maxLength={1000} className={clsx(inputClass, 'resize-y')} />
          </label>
        </div>
      )}

      {/* Personal que revisa: al final, antes de firmar. */}
      <fieldset className="mt-6 rounded-2xl border border-line bg-surface-2/60 p-4">
        <legend className="flex items-center gap-2 px-1 text-sm font-semibold text-fg-2">
          <UserRound className="h-4 w-4 text-accent" /> Personal que revisa
        </legend>
        <div className="mt-1 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-xs font-medium text-muted">
            Cargo *
            <select value={cargo} onChange={(e) => setCargo(e.target.value)} className={inputClass} required>
              <option value="" disabled>
                Selecciona tu cargo…
              </option>
              {CARGOS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-medium text-muted">
            Nombre completo *
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              maxLength={120}
              autoComplete="name"
              placeholder="Escribe tu nombre"
              className={inputClass}
              required
            />
          </label>
        </div>
        <p className="mt-2 text-xs text-muted">Tu nombre y cargo quedan en el registro de auditoría como responsable de la decisión.</p>
      </fieldset>

      {error && (
        <div className="mt-4">
          <ErrorBox message={error} />
        </div>
      )}

      <button onClick={onRegister} disabled={!valid || sending} className={clsx(primaryButton, 'mt-5 w-full py-3.5 text-base')}>
        {valid && <CheckCircle2 className="h-5 w-5" />}
        {sending ? 'Registrando…' : buttonText}
      </button>
    </Card>
  )
}

function ChoiceCard({
  selected,
  disabled = false,
  onSelect,
  title,
  hint,
}: {
  selected: boolean
  disabled?: boolean
  onSelect: () => void
  title: string
  hint: string
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={clsx(
        'relative min-h-20 rounded-xl border-2 p-4 pr-10 text-left transition duration-300 disabled:cursor-not-allowed disabled:opacity-40',
        selected
          ? 'border-accent bg-accent/10 shadow-[0_0_24px_color-mix(in_srgb,var(--accent)_18%,transparent)]'
          : 'border-line bg-surface-2/60 hover:-translate-y-0.5 hover:border-muted',
      )}
    >
      <span className={clsx('absolute right-4 top-4 transition', selected ? 'scale-110 text-accent' : 'text-muted')}>
        {selected ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
      </span>
      <p className={clsx('text-base font-semibold', selected ? 'text-fg' : 'text-fg-2')}>{title}</p>
      <p className="mt-0.5 text-sm text-muted">{hint}</p>
    </button>
  )
}

/** Quita el encabezado markdown "## [CITA: ...]" y las negritas del fragmento. */
function cleanFragment(text: string): string {
  return text
    .replace(/^##\s*\[CITA:[^\]]*\]\s*/m, '')
    .replace(/\*\*/g, '')
    .trim()
}

function formatTime(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleString('es-CO', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })
}

function initials(name: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() || '?'
}

function SuccessCard({ done, onNew }: { done: DecisionResponse; onNew: () => void }) {
  const verb = done.action === 'confirma' ? 'Aprobado' : 'Corregido'
  return (
    <div role="status" className="relative animate-fade-rise overflow-hidden rounded-2xl border border-ok/40 bg-ok/10 p-6 shadow-card sm:p-7">
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 animate-float rounded-full bg-ok/20 blur-3xl" />
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="flex h-14 w-14 shrink-0 animate-pop items-center justify-center rounded-full bg-ok text-on-accent shadow-[0_0_30px_color-mix(in_srgb,var(--ok)_50%,transparent)]">
          <Check className="h-7 w-7" strokeWidth={3} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-xl font-bold text-ok">
            {verb} por {done.user}
          </p>
          <p className="mt-0.5 text-sm text-fg-2">
            {done.user_role} · {formatTime(done.timestamp_utc)} ·{' '}
            {done.action === 'confirma' ? `${levelLabel(done.final_level)} confirmado` : `corregido a ${levelLabel(done.final_level)}`}
          </p>
          <code className="mt-2 inline-block rounded bg-ok/10 px-2 py-0.5 font-mono text-xs text-ok">evento {done.event_hash.slice(0, 12)}…</code>
        </div>
        <button onClick={onNew} className={clsx(primaryButton, 'shrink-0')}>
          <RotateCcw className="h-4 w-4" /> Nueva revisión
        </button>
      </div>
    </div>
  )
}

function DecisionHistory({ items, highlight }: { items: DecisionHistoryItem[] | null; highlight?: string }) {
  return (
    <section className="mt-10" aria-labelledby="historial">
      <h2 id="historial" className="mb-4 flex items-center gap-2 font-display text-lg font-bold">
        <History className="h-5 w-5 text-accent" /> Historial de decisiones
      </h2>
      {items === null ? (
        <div className="grid gap-2">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted">
          Aún no hay decisiones registradas. La primera que confirmes o corrijas aparecerá aquí con quién la firmó.
        </p>
      ) : (
        <ul className="grid gap-2">
          {items.map((h, i) => (
            <li
              key={h.event_hash}
              className={clsx(
                'flex animate-fade-rise flex-wrap items-center gap-3 rounded-2xl border bg-surface/85 p-3 transition sm:flex-nowrap',
                h.event_hash === highlight ? 'border-ok/60 ring-2 ring-ok/30' : 'border-line',
              )}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                style={{ backgroundColor: `color-mix(in srgb, ${levelColor(h.final_level)} 18%, transparent)`, color: levelColor(h.final_level) }}
                aria-hidden
              >
                {initials(h.user)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-fg">{h.user ?? 'Sin identificar'}</p>
                <p className="truncate text-xs text-muted">{h.user_role ?? 'Cargo no registrado'}</p>
              </div>
              <span className="text-xs text-fg-2">{h.action === 'confirma' ? 'Confirma' : 'Corrige a'}</span>
              <LevelBadge level={h.final_level} compact />
              <span className="w-full text-right text-xs text-muted sm:w-24">{formatTime(h.timestamp_utc)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
