import { useEffect, useMemo, useState } from 'react'
import { BookOpen, ListChecks, Search } from 'lucide-react'
import clsx from 'clsx'

import { errorMessage, fetchCasos, fetchCorpus } from '../api'
import type { CorpusFormat, CorpusChunk, GoldCase } from '../types'
import { Card, ErrorBox, PageBody, PageHero, Skeleton, inputClass } from '../components/Common'

const HERO = 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?q=80&w=1800&auto=format&fit=crop'

/** Minúsculas y sin tildes: "niño" encuentra "nino" y viceversa. */
function normalize(s: string): string {
  return s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
}
import { LEVELS, LevelBadge, levelColor } from '../components/LevelBadge'

type SubTab = 'corpus' | 'casos'

/** Limpia el markdown crudo del fragmento (## encabezado, [CITA: ...], **negritas**)
 * para una vista de lectura más cómoda; el texto original completo sigue
 * disponible vía la API (/api/corpus) para quien lo necesite tal cual. */
function formatChunkText(text: string): string {
  return text
    .replace(/^##\s*\[CITA:[^\]]*\]\s*/m, '')
    .replace(/\*\*/g, '')
    .trim()
}

export function ExplorarView() {
  const [subTab, setSubTab] = useState<SubTab>('casos')

  return (
    <>
      <PageHero
        eyebrow="Transparencia del gold standard"
        title="Corpus normativo y casos de prueba"
        description="Navega el corpus normativo (los 31 fragmentos citables) y las 74 viñetas sintéticas del gold standard, con su nivel de referencia y su cita."
        image={HERO}
      />
      <PageBody>
      <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Contenido">
        <TabButton active={subTab === 'casos'} onClick={() => setSubTab('casos')} icon={ListChecks}>
          Casos de prueba (74)
        </TabButton>
        <TabButton active={subTab === 'corpus'} onClick={() => setSubTab('corpus')} icon={BookOpen}>
          Corpus normativo
        </TabButton>
      </div>

      {subTab === 'casos' ? <CasosExplorer /> : <CorpusExplorer />}
      </PageBody>
    </>
  )
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean
  onClick: () => void
  icon: typeof BookOpen
  children: React.ReactNode
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={clsx(
        'flex min-h-11 items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition',
        active ? 'bg-accent-strong text-on-accent' : 'bg-surface-2 text-muted hover:text-fg',
      )}
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  )
}

function CasosExplorer() {
  const [cases, setCases] = useState<GoldCase[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [levelFilter, setLevelFilter] = useState<number | 'all' | 'ambiguo' | 'abstencion'>('all')

  useEffect(() => {
    fetchCasos()
      .then((r) => setCases(r.cases))
      .catch((e) => setError(errorMessage(e)))
  }, [])

  const filtered = useMemo(() => {
    if (!cases) return []
    const q = normalize(query.trim())
    return cases.filter((c) => {
      const matchesQuery = q === '' || normalize(c.text).includes(q) || normalize(c.case_id).includes(q)
      if (!matchesQuery) return false
      if (levelFilter === 'all') return true
      if (levelFilter === 'ambiguo') return c.ambiguous
      if (levelFilter === 'abstencion') return c.should_abstain
      return c.final_level === levelFilter
    })
  }, [cases, query, levelFilter])

  if (error) return <ErrorBox message={error} />
  if (!cases)
    return (
      <div className="grid gap-2">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    )

  return (
    <Card>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar en el relato..."
            aria-label="Buscar en los relatos"
            className={clsx(inputClass, 'pl-9')}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(['all', 1, 2, 3, 4, 5, 'ambiguo', 'abstencion'] as const).map((f) => (
            <button
              key={String(f)}
              onClick={() => setLevelFilter(f)}
              aria-pressed={levelFilter === f}
              className={clsx(
                'min-h-8 rounded-full px-3 py-1 text-xs font-semibold transition',
                levelFilter === f ? 'bg-accent-strong text-on-accent' : 'bg-surface-2 text-muted hover:text-fg',
              )}
            >
              {f === 'all' ? 'Todos' : f === 'ambiguo' ? 'Ambiguos' : f === 'abstencion' ? 'Abstención' : `Nivel ${LEVELS[f].roman}`}
            </button>
          ))}
        </div>
      </div>

      <p className="mb-3 text-xs text-muted">{filtered.length} de {cases.length} casos</p>

      <div className="flex max-h-[32rem] flex-col gap-2 overflow-y-auto pr-1">
        {filtered.length === 0 && (
          <p className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">
            Ningún caso coincide con la búsqueda. Prueba otra palabra o quita el filtro.
          </p>
        )}
        {filtered.map((c, i) => (
          <div
            key={c.case_id}
            className="animate-fade-rise rounded-xl border border-line bg-surface-2/60 p-3 transition hover:-translate-y-0.5 hover:border-accent/40"
            style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}
          >
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <code className="text-xs font-semibold text-muted">{c.case_id}</code>
              {c.should_abstain ? (
                <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-fg-2">
                  caso de abstención
                </span>
              ) : c.ambiguous ? (
                <span className="rounded-full bg-accent-2/15 px-2 py-0.5 text-[11px] text-accent-2">
                  ambiguo (excluido)
                </span>
              ) : (
                <LevelBadge level={c.final_level} compact />
              )}
              {c.final_citation && (
                <code className="text-[11px] text-muted">{c.final_citation}</code>
              )}
            </div>
            <p className="text-sm text-fg-2">{c.text}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}

function CorpusExplorer() {
  const [format, setFormat] = useState<CorpusFormat>('reformatted')
  const [chunks, setChunks] = useState<CorpusChunk[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setChunks(null)
    setError(null)
    fetchCorpus(format)
      .then((r) => setChunks(r.chunks))
      .catch((e) => setError(errorMessage(e)))
  }, [format])

  return (
    <Card>
      <div className="mb-4 flex items-center gap-2">
        {(['reformatted', 'raw'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFormat(f)}
            aria-pressed={format === f}
            className={clsx(
              'min-h-8 rounded-full px-3 py-1 text-xs font-semibold transition',
              format === f ? 'bg-accent-strong text-on-accent' : 'bg-surface-2 text-muted hover:text-fg',
            )}
          >
            {f === 'reformatted' ? 'Reformateado' : 'Crudo'}
          </button>
        ))}
      </div>

      {error && <ErrorBox message={error} />}
      {!chunks && !error && (
        <div className="grid gap-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      )}

      {chunks && (
        <div className="flex max-h-[32rem] flex-col gap-2 overflow-y-auto pr-1">
          {chunks.map((c, i) => (
            <div
              key={c.chunk_id}
              className="animate-fade-rise rounded-xl border border-line bg-surface-2/60 p-3 transition hover:border-accent/40"
              style={{ animationDelay: `${Math.min(i, 12) * 30}ms`, borderLeft: `3px solid ${levelColor(c.level)}` }}
            >
              <div className="mb-1.5 flex items-center gap-2">
                <code className="text-xs font-semibold text-accent">{c.chunk_id}</code>
                <LevelBadge level={c.level} compact />
              </div>
              <p className="whitespace-pre-line text-xs leading-relaxed text-muted">
                {formatChunkText(c.text)}
              </p>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
