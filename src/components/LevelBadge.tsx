import clsx from 'clsx'

export const LEVELS: Record<number, { roman: string; name: string }> = {
  1: { roman: 'I', name: 'Resucitación' },
  2: { roman: 'II', name: 'Emergencia' },
  3: { roman: 'III', name: 'Urgencia' },
  4: { roman: 'IV', name: 'Urgencia menor' },
  5: { roman: 'V', name: 'No urgencia' },
}

/** Color del nivel como variable CSS (cambia con el tema claro/oscuro). Sirve
 * tanto en `style` como en atributos SVG de Recharts (fill/stroke). */
export function levelColor(level: number | null): string {
  return level && LEVELS[level] ? `var(--lvl-${level})` : 'var(--lvl-null)'
}

export function levelLabel(level: number | null, short = false): string {
  if (!level || !LEVELS[level]) return 'Sin nivel'
  return short ? `Nivel ${LEVELS[level].roman}` : `${LEVELS[level].roman} · ${LEVELS[level].name}`
}

export function LevelBadge({ level, compact = false }: { level: number | null; compact?: boolean }) {
  const color = levelColor(level)
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset"
      style={{
        color,
        backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
        ['--tw-ring-color' as string]: `color-mix(in srgb, ${color} 40%, transparent)`,
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {level === null ? 'Sin nivel' : levelLabel(level, compact)}
    </span>
  )
}

/** Anillo grande con el numeral romano y brillo pulsante (resultado principal). */
export function LevelRing({ level, size = 'lg' }: { level: number | null; size?: 'md' | 'lg' }) {
  const color = levelColor(level)
  return (
    <div
      className={clsx(
        'relative flex shrink-0 items-center justify-center rounded-full border-4 bg-bg',
        size === 'lg' ? 'h-28 w-28 sm:h-32 sm:w-32' : 'h-20 w-20',
      )}
      style={{ borderColor: color, ['--ring-color' as string]: color, animation: 'pop .5s cubic-bezier(.34,1.56,.64,1) both, glow 3s ease-in-out .5s infinite' }}
      role="img"
      aria-label={levelLabel(level)}
    >
      <span
        className={clsx('font-display font-bold tracking-tighter', size === 'lg' ? 'text-5xl sm:text-6xl' : 'text-3xl')}
        style={{ color }}
      >
        {level && LEVELS[level] ? LEVELS[level].roman : '—'}
      </span>
    </div>
  )
}
