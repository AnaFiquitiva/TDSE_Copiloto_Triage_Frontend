import { Suspense, lazy, useEffect, useState } from 'react'
import {
  BookOpen,
  ClipboardCheck,
  Database,
  ExternalLink,
  FlaskConical,
  Menu,
  MessageSquareText,
  Moon,
  Stethoscope,
  Sun,
  X,
} from 'lucide-react'
import clsx from 'clsx'

import { ConsultaView } from './views/ConsultaView'
import { ExplorarView } from './views/ExplorarView'
import { RevisionView } from './views/RevisionView'
import { useTheme } from './theme'
import { Spinner } from './components/Common'

// Vistas con gráficos (Recharts) en su propio chunk: no pesan en la carga inicial.
const ExperimentoView = lazy(() => import('./views/ExperimentoView').then((m) => ({ default: m.ExperimentoView })))
const DatasetView = lazy(() => import('./views/DatasetView').then((m) => ({ default: m.DatasetView })))

type Tab = 'revision' | 'consulta' | 'experimento' | 'dataset' | 'explorar'

const NAV_ITEMS: { id: Tab; label: string; icon: typeof MessageSquareText }[] = [
  { id: 'revision', label: 'Revisión', icon: ClipboardCheck },
  { id: 'consulta', label: 'Consulta individual', icon: MessageSquareText },
  { id: 'experimento', label: 'Experimento', icon: FlaskConical },
  { id: 'dataset', label: 'Dataset real', icon: Database },
  { id: 'explorar', label: 'Corpus y casos', icon: BookOpen },
]

const VIEWS: Record<Tab, React.ComponentType> = {
  revision: RevisionView,
  consulta: ConsultaView,
  experimento: ExperimentoView,
  dataset: DatasetView,
  explorar: ExplorarView,
}

function initialTab(): Tab {
  const h = window.location.hash.replace('#', '') as Tab
  return h in VIEWS ? h : 'revision'
}

function readCollapsed(): boolean {
  try {
    return localStorage.getItem('tdse-rail') === 'collapsed'
  } catch {
    return false
  }
}

function useIsDesktop(): boolean {
  const [desktop, setDesktop] = useState(() => window.matchMedia('(min-width: 1024px)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const on = () => setDesktop(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return desktop
}

export default function App() {
  const [tab, setTab] = useState<Tab>(initialTab)
  // Vistas ya visitadas: se mantienen montadas (ocultas) para no perder el
  // relato, el resultado ni una decisión a medio llenar al cambiar de pestaña.
  const [visited, setVisited] = useState<Set<Tab>>(() => new Set([initialTab()]))
  const [collapsed, setCollapsed] = useState(readCollapsed) // riel en escritorio
  const [drawerOpen, setDrawerOpen] = useState(false) // cajón en móvil/tablet
  const [theme, toggleTheme] = useTheme()
  const isDesktop = useIsDesktop()

  function go(id: Tab) {
    setTab(id)
    setVisited((v) => new Set(v).add(id))
    setDrawerOpen(false)
    history.replaceState(null, '', `#${id}`)
    document.getElementById('main')?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function onHamburger() {
    if (isDesktop) {
      setCollapsed((c) => {
        try {
          localStorage.setItem('tdse-rail', c ? 'expanded' : 'collapsed')
        } catch {
          /* sin almacenamiento */
        }
        return !c
      })
    } else {
      setDrawerOpen((o) => !o)
    }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawerOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // ✕ cuando el menú está desplegado (cajón abierto o riel expandido).
  const menuOpenIcon = isDesktop ? !collapsed : drawerOpen
  const current = NAV_ITEMS.find((n) => n.id === tab)!

  return (
    <div className="flex h-dvh overflow-hidden bg-bg text-fg">
      {/* Fondo del cajón móvil */}
      <div
        onClick={() => setDrawerOpen(false)}
        className={clsx(
          'fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden',
          drawerOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        aria-hidden
      />

      <aside
        id="side-menu"
        aria-label="Navegación principal"
        className={clsx(
          'fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-line bg-surface transition-[width,transform] duration-300 ease-out lg:static lg:translate-x-0',
          drawerOpen ? 'translate-x-0' : '-translate-x-full',
          collapsed ? 'lg:w-[76px]' : 'lg:w-64',
        )}
      >
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-line px-4">
          <LogoTile />
          <div className={clsx('min-w-0 transition-opacity duration-200', collapsed && 'lg:pointer-events-none lg:opacity-0')}>
            <p className="font-display text-sm font-bold leading-tight">TDSE Pulso</p>
            <p className="truncate text-xs leading-tight text-muted">Copiloto de Triage RAG</p>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="ml-auto flex h-10 w-10 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg lg:hidden"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto overflow-x-hidden p-3">
          {NAV_ITEMS.map((item, i) => {
            const active = tab === item.id
            return (
              <button
                key={item.id}
                onClick={() => go(item.id)}
                title={collapsed ? item.label : undefined}
                aria-current={active ? 'page' : undefined}
                className={clsx(
                  'group relative flex min-h-11 animate-fade-rise items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium transition',
                  active
                    ? 'bg-accent/12 text-accent ring-1 ring-inset ring-accent/30'
                    : 'text-muted hover:bg-surface-2 hover:text-fg',
                )}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {active && <span className="absolute -left-3 top-2 bottom-2 w-1 rounded-r-full bg-accent" aria-hidden />}
                <item.icon className="h-5 w-5 shrink-0 transition-transform group-hover:scale-110" />
                <span className={clsx('transition-opacity duration-200', collapsed && 'lg:opacity-0')}>{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="shrink-0 border-t border-line p-4">
          <a
            href="https://github.com/AnaFiquitiva/TDSE_Copiloto_de_Triage_RAG"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 whitespace-nowrap rounded-lg px-1 py-1.5 text-xs text-muted transition hover:text-fg"
          >
            <ExternalLink className="h-4 w-4 shrink-0" />
            <span className={clsx(collapsed && 'lg:hidden')}>Ver repositorio</span>
          </a>
          <p className={clsx('mt-2 text-xs leading-relaxed text-muted', collapsed && 'lg:hidden')}>
            Prototipo académico. Asiste, no decide.
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="z-30 flex h-16 shrink-0 items-center gap-2 border-b border-line bg-bg/80 px-3 backdrop-blur-md sm:px-5">
          <button
            onClick={onHamburger}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-muted transition hover:bg-surface-2 hover:text-fg"
            aria-label={drawerOpen ? 'Cerrar menú' : 'Abrir o contraer menú'}
            aria-controls="side-menu"
            aria-expanded={menuOpenIcon}
          >
            <span className="relative h-5 w-5">
              <Menu
                className={clsx('absolute inset-0 h-5 w-5 transition-all duration-300', menuOpenIcon ? 'rotate-90 opacity-0' : 'rotate-0 opacity-100')}
              />
              <X
                className={clsx('absolute inset-0 h-5 w-5 transition-all duration-300', menuOpenIcon ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0')}
              />
            </span>
          </button>
          <div className="flex min-w-0 items-center gap-2.5 lg:hidden">
            <LogoTile small />
            <span className="font-display text-sm font-bold">TDSE Pulso</span>
          </div>
          <span className="hidden items-center gap-2 text-sm text-muted lg:flex">
            <current.icon className="h-4 w-4 text-accent" />
            <span className="font-medium text-fg">{current.label}</span>
          </span>

          <button
            onClick={toggleTheme}
            className="ml-auto flex h-11 items-center gap-2 rounded-xl border border-line bg-surface px-3 text-sm font-medium text-fg-2 transition hover:border-accent/50 hover:text-fg"
            aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            <span className="relative h-5 w-5">
              <Sun className={clsx('absolute inset-0 h-5 w-5 text-warn transition-all duration-500', theme === 'dark' ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0')} />
              <Moon className={clsx('absolute inset-0 h-5 w-5 text-accent-2 transition-all duration-500', theme === 'light' ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0')} />
            </span>
            <span className="hidden sm:inline">{theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}</span>
          </button>
        </header>

        <main id="main" className="relative flex-1 overflow-y-auto overflow-x-hidden">
          {(Object.keys(VIEWS) as Tab[]).map((id) => {
            if (!visited.has(id)) return null
            const View = VIEWS[id]
            return (
              <div key={id} hidden={tab !== id}>
                <Suspense fallback={<div className="p-8"><Spinner label="Cargando vista…" /></div>}>
                  <View />
                </Suspense>
              </div>
            )
          })}
        </main>
      </div>
    </div>
  )
}

function LogoTile({ small = false }: { small?: boolean }) {
  return (
    <div
      className={clsx(
        'flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-2 text-on-accent shadow-[0_0_18px_color-mix(in_srgb,var(--accent)_35%,transparent)]',
        small ? 'h-8 w-8' : 'h-10 w-10',
      )}
    >
      <Stethoscope className={small ? 'h-4 w-4' : 'h-5 w-5'} />
    </div>
  )
}
