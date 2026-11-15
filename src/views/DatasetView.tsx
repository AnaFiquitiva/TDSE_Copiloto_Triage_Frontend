import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Database, ExternalLink } from 'lucide-react'

import { fetchDataset } from '../api'
import { useAsync } from '../useAsync'
import type { DatasetResponse } from '../types'
import { Card, ErrorBox, PageBody, PageHero, Skeleton, StatCard } from '../components/Common'
import { useChartTheme } from '../components/chartTheme'
import { levelColor } from '../components/LevelBadge'

const HERO = 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=1800&auto=format&fit=crop'

const LEVEL_ORDER = ['I', 'II', 'III', 'IV', 'V']
const LEVEL_NUM: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4, V: 5 }

export function DatasetView() {
  const { data, loading, error, reload: load } = useAsync<DatasetResponse>(fetchDataset, [])
  const chart = useChartTheme()

  const distributionData = LEVEL_ORDER.map((lvl) => ({
    nivel: lvl,
    n: data?.distribution[lvl] ?? 0,
    pct: data ? ((data.distribution[lvl] ?? 0) / data.total) * 100 : 0,
  }))

  const durationData = LEVEL_ORDER.filter((lvl) => data?.duration_stats[lvl]).map((lvl) => ({
    nivel: lvl,
    medianaMin: data?.duration_stats[lvl]?.median ?? 0,
  }))

  return (
    <>
      <PageHero
        eyebrow="Fuente de datos reales"
        title="Datos Abiertos Colombia"
        description="Análisis del dataset público 'Clasificación en Triage Urgencias' (datos.gov.co, ~89.000 registros reales). No contiene el relato del paciente, así que no se usa para entrenar ni evaluar el copiloto: sirve para contrastar supuestos de diseño con datos reales."
        image={HERO}
      />
      <PageBody>
      {loading && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Skeleton className="h-72" />
            <Skeleton className="h-72" />
          </div>
        </div>
      )}
      {error && <ErrorBox message={error} onRetry={load} />}

      {data && !loading && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Registros totales" value={data.total} format={(n) => Math.round(n).toLocaleString('es-CO')} accent="teal" />
            <StatCard
              label="Niveles I-II reales"
              value={(((data.distribution.I ?? 0) + (data.distribution.II ?? 0)) / data.total) * 100}
              format={(n) => `${n.toFixed(1)}%`}
              hint="justifica sobremuestrear en el gold standard"
              accent="red"
              delay={60}
            />
            <StatCard
              label="χ² (nivel × red de IPS)"
              value={data.chi2_independence_test.chi2}
              format={(n) => Math.round(n).toLocaleString('es-CO')}
              hint={`${data.chi2_independence_test.df} grados de libertad`}
              accent="sky"
              delay={120}
            />
            <StatCard
              label="Valor p"
              value={data.chi2_independence_test.p_value < 0.001 ? '< 0.001' : data.chi2_independence_test.p_value.toFixed(3)}
              hint="diferencia significativa entre redes"
              accent="amber"
              delay={180}
            />
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Card>
              <h3 className="mb-4 text-sm font-semibold text-fg">Distribución real de niveles de triage</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={distributionData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                    <XAxis dataKey="nivel" stroke={chart.axis} fontSize={12} />
                    <YAxis stroke={chart.axis} fontSize={12} tickFormatter={(v) => `${v}%`} />
                    <Tooltip
                      formatter={(v) => `${Number(v).toFixed(2)}%`}
                      contentStyle={chart.tooltip}
                      labelStyle={chart.tooltipLabel}
                      cursor={{ fill: chart.cursor }}
                    />
                    <Bar dataKey="pct" radius={[6, 6, 0, 0]} animationDuration={900}>
                      {distributionData.map((d) => (
                        <Cell key={d.nivel} fill={levelColor(LEVEL_NUM[d.nivel])} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-2 text-xs text-muted">
                Los niveles I-II son una fracción muy pequeña en la práctica: por eso el gold standard de
                74 casos los sobremuestrea deliberadamente (18 y 15 casos respectivamente).
              </p>
            </Card>

            <Card>
              <h3 className="mb-4 text-sm font-semibold text-fg">Tiempo de ingreso a atención (mediana, min)</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={durationData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                    <XAxis dataKey="nivel" stroke={chart.axis} fontSize={12} />
                    <YAxis stroke={chart.axis} fontSize={12} />
                    <Tooltip
                      formatter={(v) => `${Number(v).toFixed(1)} min`}
                      contentStyle={chart.tooltip}
                      labelStyle={chart.tooltipLabel}
                      cursor={{ fill: chart.cursor }}
                    />
                    <Bar dataKey="medianaMin" radius={[6, 6, 0, 0]} animationDuration={900}>
                      {durationData.map((d) => (
                        <Cell key={d.nivel} fill={levelColor(LEVEL_NUM[d.nivel])} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-2 text-xs text-muted">
                Dato agregado de una red de IPS reportante, no una medición prospectiva in situ. Se
                reporta como referencia secundaria, no como sustituto del instrumento de observación
                descrito en el documento del proyecto.
              </p>
            </Card>
          </div>

          <Card>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-fg">
              <Database className="h-4 w-4 text-accent" />
              Distribución por red de IPS
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px] text-left text-xs">
                <thead>
                  <tr className="border-b border-line text-muted">
                    <th className="px-3 py-2 font-medium">Red</th>
                    {LEVEL_ORDER.map((l) => (
                      <th key={l} className="px-3 py-2 font-medium">
                        {l}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(data.by_red).map(([red, counts]) => {
                    const total = Object.values(counts).reduce((a, b) => a + b, 0)
                    return (
                      <tr key={red} className="border-b border-line text-muted transition hover:bg-surface-2/60">
                        <td className="px-3 py-2 font-semibold text-fg">{red}</td>
                        {LEVEL_ORDER.map((l) => {
                          const pct = ((counts[l] ?? 0) / total) * 100
                          return (
                            <td
                              key={l}
                              className="px-3 py-2 font-mono"
                              style={{ backgroundColor: `color-mix(in srgb, ${levelColor(LEVEL_NUM[l])} ${Math.min(40, pct * 0.6)}%, transparent)` }}
                            >
                              {pct.toFixed(1)}%
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <a
              href="https://www.datos.gov.co/Salud-y-Protecci-n-Social/Clasificaci-n-en-Triage-Urgencias/vt5n-eu2r"
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex min-h-8 items-center gap-1.5 text-xs font-semibold text-accent hover:underline"
            >
              Ver dataset original en datos.gov.co <ExternalLink className="h-3 w-3" />
            </a>
          </Card>
        </div>
      )}
      </PageBody>
    </>
  )
}
