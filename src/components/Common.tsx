import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, RotateCcw, ShieldAlert } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import clsx from 'clsx'

export function DisclaimerBanner({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={clsx(
        'flex items-start gap-3 rounded-xl border border-warn/30 bg-warn/10 text-sm text-warn',
        compact ? 'px-3 py-1.5' : 'px-4 py-3',
      )}
    >
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
      <p>
        <strong>Asiste, no decide.</strong>
        {!compact && ' La clasificación final es siempre responsabilidad del personal de salud. Prototipo académico: no usar para decisiones clínicas reales.'}
      </p>
    </div>
  )
}

export function Card({
  children,
  className,
  delay = 0,
  hover = true,
}: {
  children: ReactNode
  className?: string
  /** Retraso (ms) de la animación de entrada, para escalonar tarjetas. */
  delay?: number
  hover?: boolean
}) {
  return (
    <div
      className={clsx(
        'animate-fade-rise rounded-2xl border border-line bg-surface/85 p-5 shadow-card backdrop-blur-md',
        hover && 'transition-transform duration-300 hover:-translate-y-0.5',
        className,
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

/** Línea ECG animada (se dibuja continuamente). */
export function EcgLine({ className, width = 160 }: { className?: string; width?: number }) {
  return (
    <svg width={width} height={44} viewBox="0 0 160 44" fill="none" className={className} aria-hidden>
      <path
        className="ecg-path"
        d="M0 24H38L45 12L55 38L66 4L77 32L83 24H160"
        stroke="var(--accent)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Banda superior de cada vista: imagen + degradado + título + línea ECG. Si
 * la imagen no carga, queda el degradado (el texto sigue legible). */
export function PageHero({
  eyebrow,
  title,
  description,
  image,
  children,
}: {
  eyebrow: string
  title: string
  description?: string
  image: string
  children?: ReactNode
}) {
  const [imgOk, setImgOk] = useState(true)
  return (
    <section className="relative isolate overflow-hidden border-b border-line bg-surface-2">
      {imgOk && (
        <img
          src={image}
          alt=""
          onError={() => setImgOk(false)}
          className="absolute inset-0 -z-10 h-full w-full scale-105 animate-[fade-rise_1.2s_ease-out_both] object-cover opacity-90"
        />
      )}
      <div
        className="absolute inset-0 -z-10"
        style={{ background: 'linear-gradient(90deg, var(--hero-overlay) 0%, var(--hero-overlay) 48%, transparent 88%)' }}
      />
      <div
        className="absolute inset-0 -z-10 sm:hidden"
        style={{ background: 'linear-gradient(0deg, var(--hero-overlay) 10%, transparent 100%)' }}
      />
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 -z-10 h-72 w-72 animate-float rounded-full bg-accent/15 blur-3xl" />
      <div className="mx-auto flex max-w-6xl flex-col justify-end gap-3 px-4 pb-6 pt-14 sm:min-h-56 sm:px-8 lg:min-h-64 lg:px-10">
        <p className="animate-fade-rise text-xs font-semibold uppercase tracking-widest text-accent">{eyebrow}</p>
        <div className="flex items-end justify-between gap-4">
          <h1
            className="animate-fade-rise font-display text-3xl font-bold leading-tight tracking-tight text-fg sm:text-4xl"
            style={{ animationDelay: '80ms' }}
          >
            {title}
          </h1>
          <EcgLine className="hidden shrink-0 opacity-90 md:block" />
        </div>
        {description && (
          <p
            className="max-w-2xl animate-fade-rise text-sm leading-relaxed text-fg-2"
            style={{ animationDelay: '160ms' }}
          >
            {description}
          </p>
        )}
        {children}
      </div>
    </section>
  )
}

export function PageBody({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return <div className={clsx('mx-auto w-full px-4 py-6 sm:px-8 sm:py-8 lg:px-10', wide ? 'max-w-7xl' : 'max-w-6xl')}>{children}</div>
}

/** Cargador con pulso ECG y esqueleto opcional. */
export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 py-8 text-muted" role="status" aria-live="polite">
      <EcgLine width={90} />
      <span className="text-sm">{label ?? 'Cargando...'}</span>
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('skeleton rounded-xl', className)} aria-hidden />
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="flex animate-fade-rise flex-wrap items-start gap-3 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger"
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
      <p className="min-w-0 flex-1">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 rounded-lg border border-danger/40 px-2.5 py-1 text-xs font-semibold transition hover:bg-danger/10"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reintentar
        </button>
      )}
    </div>
  )
}

/** Barra de puntaje que crece desde 0 al aparecer. */
export function ScoreBar({ value, max = 1, color = 'var(--accent)' }: { value: number; max?: number; color?: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
      <div
        className="h-full origin-left animate-grow rounded-full"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  )
}

/** Cuenta animada de 0 al valor (respeta prefers-reduced-motion). */
export function useCountUp(target: number, duration = 900): number {
  const [value, setValue] = useState(0)
  const frame = useRef<number>(0)
  // Sin animación (movimiento reducido o valor no finito) se devuelve el valor
  // final directamente, sin pasar por el estado.
  const [reduce] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const animate = !reduce && Number.isFinite(target)
  useEffect(() => {
    if (!animate) return
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      setValue(target * (1 - Math.pow(1 - t, 3)))
      if (t < 1) frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame.current)
  }, [target, duration, animate])
  return animate ? value : target
}

export function CountUp({ value, format }: { value: number; format: (n: number) => string }) {
  const v = useCountUp(value)
  return <>{format(v)}</>
}

const ACCENTS: Record<string, string> = {
  teal: 'var(--accent)',
  sky: 'var(--accent-2)',
  amber: 'var(--warn)',
  red: 'var(--danger)',
  green: 'var(--ok)',
}

export function StatCard({
  label,
  value,
  format,
  hint,
  accent = 'teal',
  delay = 0,
}: {
  label: string
  /** Número (se anima) o texto ya formateado. */
  value: number | string
  format?: (n: number) => string
  hint?: string
  accent?: 'teal' | 'red' | 'amber' | 'sky' | 'green'
  delay?: number
}) {
  const color = ACCENTS[accent]
  return (
    <div
      className="group relative animate-fade-rise overflow-hidden rounded-2xl border border-line bg-surface/85 p-5 shadow-card transition-transform duration-300 hover:-translate-y-0.5"
      style={{ animationDelay: `${delay}ms` } as CSSProperties}
    >
      <div
        aria-hidden
        className="absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-40"
        style={{ backgroundColor: color }}
      />
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold" style={{ color }}>
        {typeof value === 'number' ? <CountUp value={value} format={format ?? ((n) => n.toFixed(0))} /> : value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  )
}

/** Control segmentado para opciones cortas (reemplaza selects de 2 opciones). */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted">{label}</span>
      <div role="radiogroup" aria-label={label} className="flex rounded-xl border border-line bg-surface-2 p-1">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            onClick={() => onChange(o.value)}
            className={clsx(
              'min-h-9 flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition',
              value === o.value ? 'bg-surface text-accent shadow-card' : 'text-muted hover:text-fg',
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export const inputClass =
  'w-full rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-sm text-fg outline-none transition placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/30'

export const primaryButton =
  'ripple inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-accent-strong px-5 py-2.5 text-sm font-semibold text-on-accent shadow-[0_6px_18px_color-mix(in_srgb,var(--accent)_35%,transparent)] transition hover:-translate-y-0.5 hover:bg-accent disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none'

/** Texto humano para los códigos de motivo del backend. */
export function reasonText(reason: string): string {
  return (
    {
      evidencia_insuficiente: 'La evidencia recuperada del corpus no alcanza para sugerir un nivel con respaldo.',
      evidencia_contradictoria: 'Los fragmentos recuperados apuntan a niveles distintos; no hay un nivel claro.',
      abstencion_del_modelo: 'El modelo decidió no proponer un nivel con la evidencia disponible.',
      elevado_por_regla_de_alarma: 'Una regla de alarma clínica subió el nivel sugerido.',
      ok: 'Sugerencia con respaldo en el corpus.',
      ok_llm: 'Sugerencia del modelo con respaldo en el corpus.',
    }[reason] ?? reason.replace(/_/g, ' ')
  )
}

export function backendText(b: string): string {
  return { gemini: 'Ruta principal (Gemini)', deterministic: 'Determinista (sin red)', deterministic_fallback: 'Respaldo determinista (modo degradado)' }[b] ?? b
}
