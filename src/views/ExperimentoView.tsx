import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { FlaskConical, RefreshCw } from 'lucide-react'

import { errorMessage, fetchExperimento } from '../api'
import type { ExperimentoResponse } from '../types'
import { Card, ErrorBox, PageBody, PageHero, Skeleton, StatCard } from '../components/Common'
import { useChartTheme } from '../components/chartTheme'

const HERO = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1800&auto=format&fit=crop'

const COLUMN_HELP: Record<string, string> = {
  N: 'Casos elegibles evaluados',
  Cobertura: 'Fracción de casos con nivel sugerido (sin abstención)',
  S: 'Sub-triage: sugerir un nivel menos urgente que el de referencia (menor es mejor)',
  'Sens. I-II': 'Sensibilidad en casos de nivel I-II (mayor es mejor)',
  'Recall@1': 'La cita correcta quedó en el primer fragmento recuperado',
  'Recall@k': 'La cita correcta quedó entre los k fragmentos recuperados',
  MRR: 'Rango recíproco medio de la cita correcta',
  Fidelidad: 'La cita emitida respalda el nivel sugerido',
  'Abst. correcta': 'Se abstuvo en casos que debían escalarse',
  'Abst. indebida': 'Se abstuvo en casos que sí tenían un nivel claro',
  'Sobre-triage': 'Sugerir un nivel más urgente que el de referencia',
  Degradado: 'Fracción de casos que cayeron al respaldo determinista',
}

export function ExperimentoView() {
  const [data, setData] = useState<ExperimentoResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setData(await fetchExperimento())
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const chart = useChartTheme()
  const evaluated = data ? data.cells.filter((c) => !c.no_evaluada) : []
  const notEvaluated = data ? data.cells.filter((c) => c.no_evaluada) : []

  const bestS = [...evaluated].filter((c) => c.S_sub_triage != null).sort((a, b) => a.S_sub_triage! - b.S_sub_triage!)[0]
  const bestSens = [...evaluated]
    .filter((c) => c.sensibilidad_I_II != null)
    .sort((a, b) => b.sensibilidad_I_II! - a.sensibilidad_I_II!)[0]

  const chartData = data
    ? [
        {
          celda: 'C0 (reglas)',
          'S (sub-triage)': round(data.baseline.S_sub_triage),
          'Sensibilidad I-II': round(data.baseline.sensibilidad_I_II),
          // C0 no recupera fragmentos: Recall@k no aplica (null, no 0).
          'Recall@k': null,
        },
        ...evaluated.map((c) => ({
          celda: c.cell,
          'S (sub-triage)': round(c.S_sub_triage),
          'Sensibilidad I-II': round(c.sensibilidad_I_II),
          'Recall@k': round(c.recall_at_k),
        })),
      ]
    : []

  return (
    <>
      <PageHero
        eyebrow="Diseño experimental"
        title="Experimento E1–E6 + línea base C0"
        description="El mismo cómputo que `python -m experiments.run_experiment` sobre el gold standard: E1–E4 comparan formato de corpus y recuperación (ruta determinista, sin red); E5–E6 son la ruta Gemini sin y con guardarraíl, evaluadas solo desde la caché de respuestas."
        image={HERO}
      >
        <button
          onClick={load}
          disabled={loading}
          className="mt-1 flex min-h-10 w-fit items-center gap-2 rounded-xl border border-line bg-surface/80 px-3 py-2 text-xs font-semibold text-fg-2 backdrop-blur transition hover:border-accent/50 hover:text-accent disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Volver a ejecutar
        </button>
      </PageHero>
      <PageBody>
      {loading && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
          <Skeleton className="h-80" />
        </div>
      )}
      {error && <ErrorBox message={error} onRetry={load} />}

      {data && !loading && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Casos totales" value={data.n_total_cases} accent="teal" />
            <StatCard
              label="Kappa intra-equipo"
              value={data.kappa.kappa_ponderado_cuadratico}
              format={(n) => n.toFixed(3)}
              hint={`sobre ${data.kappa.n_pares} pares`}
              accent="sky"
              delay={60}
            />
            {bestS && (
              <StatCard
                label="Menor sub-triage S"
                value={bestS.S_sub_triage ?? 0}
                format={(n) => n.toFixed(3)}
                hint={`celda ${bestS.cell} · menor es mejor`}
                accent="amber"
                delay={120}
              />
            )}
            {bestSens && (
              <StatCard
                label="Mejor sensibilidad I-II"
                value={(bestSens.sensibilidad_I_II ?? 0) * 100}
                format={(n) => `${n.toFixed(0)}%`}
                hint={`celda ${bestSens.cell} · mayor es mejor`}
                accent="green"
                delay={180}
              />
            )}
          </div>

          <Card delay={120}>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-fg">
              <FlaskConical className="h-4 w-4 text-accent" />
              Comparación por celda
            </h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                  <XAxis dataKey="celda" stroke={chart.axis} fontSize={12} />
                  <YAxis stroke={chart.axis} fontSize={12} domain={[0, 1]} />
                  <Tooltip
                    contentStyle={chart.tooltip}
                    labelStyle={chart.tooltipLabel}
                    cursor={{ fill: chart.cursor }}
                    formatter={(v) => (v == null ? 'no aplica' : Number(v).toFixed(3))}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="S (sub-triage)" fill="var(--danger)" radius={[4, 4, 0, 0]} animationDuration={900} />
                  <Bar dataKey="Sensibilidad I-II" fill="var(--accent-2)" radius={[4, 4, 0, 0]} animationDuration={900} />
                  <Bar dataKey="Recall@k" fill="var(--ok)" radius={[4, 4, 0, 0]} animationDuration={900} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-xs text-muted">
              S (sub-triage): más bajo es mejor. Sensibilidad I-II y Recall@k: más alto es mejor. C0 no
              recupera fragmentos, por eso no tiene Recall@k.
            </p>
          </Card>

          <Card className="overflow-x-auto" delay={200} hover={false}>
            <h3 className="mb-4 text-sm font-semibold text-fg">Tabla completa</h3>
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead>
                <tr className="border-b border-line text-muted">
                  {['Celda', 'Corpus', 'Recuperación', 'N', 'Cobertura', 'S', 'Sens. I-II', 'Recall@1', 'Recall@k', 'MRR', 'Fidelidad', 'Abst. correcta', 'Abst. indebida', 'Sobre-triage', 'Degradado'].map(
                    (h) => (
                      <th
                        key={h}
                        title={COLUMN_HELP[h]}
                        className={`whitespace-nowrap px-3 py-2 font-medium ${COLUMN_HELP[h] ? 'cursor-help underline decoration-dotted underline-offset-4' : ''}`}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-line text-muted">
                  <td className="px-3 py-2 font-semibold text-fg">C0</td>
                  <td className="px-3 py-2">reglas</td>
                  <td className="px-3 py-2">—</td>
                  <td className="px-3 py-2">{data.baseline.n_eligible_cases}</td>
                  <td className="px-3 py-2">1.00</td>
                  <td className="px-3 py-2">{fmt(data.baseline.S_sub_triage)}</td>
                  <td className="px-3 py-2">{fmt(data.baseline.sensibilidad_I_II)}</td>
                  <td className="px-3 py-2">—</td>
                  <td className="px-3 py-2">—</td>
                  <td className="px-3 py-2">—</td>
                  <td className="px-3 py-2">{fmt(data.baseline.fidelidad_citacion)}</td>
                  <td className="px-3 py-2">—</td>
                  <td className="px-3 py-2">—</td>
                  <td className="px-3 py-2">{fmt(data.baseline.sobre_triage)}</td>
                  <td className="px-3 py-2">—</td>
                </tr>
                {evaluated.map((c) => (
                  <tr key={c.cell} className="border-b border-line text-muted transition hover:bg-surface-2/60">
                    <td className="px-3 py-2 font-semibold text-accent">{c.cell}</td>
                    <td className="px-3 py-2">{c.corpus_format}</td>
                    <td className="px-3 py-2">{c.embedding_mode}</td>
                    <td className="px-3 py-2">{c.n_eligible_cases}</td>
                    <td className="px-3 py-2">{fmt(c.cobertura, 2)}</td>
                    <td className="px-3 py-2">{fmt(c.S_sub_triage)}</td>
                    <td className="px-3 py-2">{fmt(c.sensibilidad_I_II)}</td>
                    <td className="px-3 py-2">{fmt(c.recall_at_1)}</td>
                    <td className="px-3 py-2">{fmt(c.recall_at_k)}</td>
                    <td className="px-3 py-2">{fmt(c.mrr)}</td>
                    <td className="px-3 py-2">{fmt(c.fidelidad_citacion)}</td>
                    <td className="px-3 py-2">{fmt(c.tasa_abstencion_correcta)}</td>
                    <td className="px-3 py-2">{fmt(c.tasa_abstencion_indebida)}</td>
                    <td className="px-3 py-2">{fmt(c.sobre_triage)}</td>
                    <td className="px-3 py-2">{fmt(c.tasa_modo_degradado, 2)}</td>
                  </tr>
                ))}
                {notEvaluated.map((c) => (
                  <tr key={c.cell} className="border-b border-line text-muted">
                    <td className="px-3 py-2 font-semibold text-muted">{c.cell}</td>
                    <td className="px-3 py-2">{c.corpus_format}</td>
                    <td className="px-3 py-2">{c.embedding_mode}</td>
                    <td className="px-3 py-2 italic" colSpan={12}>
                      {c.no_evaluada}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}
      </PageBody>
    </>
  )
}

function round(n: number | null | undefined): number | null {
  return n == null ? null : Math.round(n * 1000) / 1000
}

function fmt(n: number | null | undefined, digits = 3): string {
  return n == null || !Number.isFinite(n) ? 'n/d' : n.toFixed(digits)
}
