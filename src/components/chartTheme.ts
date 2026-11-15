import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'

/** Colores de Recharts que siguen al tema claro/oscuro. Los atributos SVG
 * aceptan var(--x); los estilos del tooltip también. Se re-renderiza al
 * cambiar la clase `dark` para que Recharts repinte. */
export function useChartTheme() {
  const [, setTick] = useState(0)
  useEffect(() => {
    const obs = new MutationObserver(() => setTick((t) => t + 1))
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])
  const tooltip: CSSProperties = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    color: 'var(--text)',
    boxShadow: '0 10px 30px var(--shadow-color)',
  }
  return {
    grid: 'var(--border)',
    axis: 'var(--muted)',
    cursor: 'color-mix(in srgb, var(--accent) 10%, transparent)',
    tooltip,
    tooltipLabel: { color: 'var(--text)', fontWeight: 600 } as CSSProperties,
  }
}
