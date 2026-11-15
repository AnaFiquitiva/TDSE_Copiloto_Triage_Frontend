import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { RevisionView } from './RevisionView'
import { consultaAbstencion, consultaElevada, decisionOk, historialVacio, mockApi } from '../test/fixtures'

async function pedirSugerencia(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/relato libre del paciente/i), 'dolor en el pecho que se corre al brazo')
  await user.click(screen.getByRole('button', { name: /obtener sugerencia/i }))
}

describe('RevisionView', () => {
  it('muestra el nivel elevado por regla de alarma de forma destacada y limpia el fragmento citado', async () => {
    mockApi([
      { method: 'GET', path: '/api/decisiones', body: historialVacio },
      { method: 'POST', path: '/api/consulta', body: consultaElevada() },
    ])
    const user = userEvent.setup()
    render(<RevisionView />)
    await pedirSugerencia(user)

    const alerta = await screen.findByRole('alert')
    expect(alerta).toHaveTextContent('Nivel elevado de III a II por regla de alarma')
    expect(alerta).toHaveTextContent('se corre al brazo')
    expect(screen.getByRole('img', { name: 'II · Emergencia' })).toBeInTheDocument()
    expect(screen.getByText(/Dolor torácico con signos de alarma/)).toBeInTheDocument()
    expect(screen.queryByText(/## \[CITA/)).not.toBeInTheDocument()
  })

  it('no precarga a ninguna persona y exige decisión, cargo y nombre antes de registrar', async () => {
    mockApi([
      { method: 'GET', path: '/api/decisiones', body: historialVacio },
      { method: 'POST', path: '/api/consulta', body: consultaElevada() },
    ])
    const user = userEvent.setup()
    render(<RevisionView />)
    await pedirSugerencia(user)

    const cargo = await screen.findByLabelText(/cargo/i)
    const nombre = screen.getByLabelText(/nombre completo/i)
    expect(cargo).toHaveValue('')
    expect(nombre).toHaveValue('')

    expect(screen.getByRole('button', { name: 'Elige confirmar o corregir' })).toBeDisabled()
    await user.click(screen.getByRole('radio', { name: /confirmar nivel II/i }))
    // Nombre completo pero sin cargo: no se puede registrar.
    await user.type(nombre, 'Ana Pérez')
    expect(screen.getByRole('button', { name: 'Selecciona tu cargo' })).toBeDisabled()
    await user.selectOptions(cargo, 'Médico/a de urgencias')
    expect(screen.getByRole('button', { name: /registrar: confirma nivel II/i })).toBeEnabled()
    // Cargo pero nombre de 1 carácter: tampoco.
    await user.clear(nombre)
    await user.type(nombre, 'A')
    expect(screen.getByRole('button', { name: 'Escribe tu nombre' })).toBeDisabled()
  })

  it('registra la confirmación con nombre y cargo y muestra "Aprobado por" y el historial', async () => {
    const { calls } = mockApi([
      { method: 'GET', path: '/api/decisiones', body: historialVacio },
      { method: 'POST', path: '/api/consulta', body: consultaElevada() },
      { method: 'POST', path: '/api/decision', body: decisionOk() },
    ])
    const user = userEvent.setup()
    render(<RevisionView />)
    await pedirSugerencia(user)

    await user.click(await screen.findByRole('radio', { name: /confirmar nivel II/i }))
    await user.selectOptions(screen.getByLabelText(/cargo/i), 'Enfermero/a jefe')
    await user.type(screen.getByLabelText(/nombre completo/i), '  Ana Pérez ')
    await user.click(screen.getByRole('button', { name: /registrar: confirma nivel II/i }))

    expect(await screen.findByText('Aprobado por Ana Pérez')).toBeInTheDocument()
    const post = calls.find((c) => c.method === 'POST' && c.url.includes('/api/decision'))!
    expect(post.body).toMatchObject({
      record_hash: 'a'.repeat(64),
      action: 'confirma',
      user: 'Ana Pérez',
      user_role: 'Enfermero/a jefe',
    })
    expect(post.body).not.toHaveProperty('final_level')
    // El historial se vuelve a pedir tras registrar.
    await waitFor(() => expect(calls.filter((c) => c.url.includes('/api/decisiones')).length).toBe(2))
  })

  it('al corregir exige nivel y motivo, y los envía', async () => {
    const { calls } = mockApi([
      { method: 'GET', path: '/api/decisiones', body: historialVacio },
      { method: 'POST', path: '/api/consulta', body: consultaElevada() },
      { method: 'POST', path: '/api/decision', body: decisionOk({ action: 'corrige', final_level: 1 }) },
    ])
    const user = userEvent.setup()
    render(<RevisionView />)
    await pedirSugerencia(user)

    await user.click(await screen.findByRole('radio', { name: /corregir nivel/i }))
    await user.selectOptions(screen.getByLabelText(/cargo/i), 'Médico/a general')
    await user.type(screen.getByLabelText(/nombre completo/i), 'Luis Rojas')
    expect(screen.getByRole('button', { name: 'Completa el nivel y el motivo' })).toBeDisabled()

    const niveles = screen.getByRole('radiogroup', { name: 'Nivel final' })
    await user.click(within(niveles).getByRole('radio', { name: 'I · Resucitación' }))
    expect(screen.getByRole('button', { name: 'Completa el nivel y el motivo' })).toBeDisabled()
    await user.type(screen.getByLabelText(/motivo de la corrección/i), 'paro respiratorio')
    await user.click(screen.getByRole('button', { name: /registrar: corrige a nivel I$/i }))

    expect(await screen.findByText(/Corregido por/)).toBeInTheDocument()
    const post = calls.find((c) => c.method === 'POST' && c.url.includes('/api/decision'))!
    expect(post.body).toMatchObject({ action: 'corrige', final_level: 1, reason: 'paro respiratorio', user: 'Luis Rojas' })
  })

  it('en una abstención escala y no permite confirmar', async () => {
    mockApi([
      { method: 'GET', path: '/api/decisiones', body: historialVacio },
      { method: 'POST', path: '/api/consulta', body: consultaAbstencion() },
    ])
    const user = userEvent.setup()
    render(<RevisionView />)
    await pedirSugerencia(user)

    expect(await screen.findByText('Escalar a revisión prioritaria')).toBeInTheDocument()
    expect(screen.getByText(/La evidencia recuperada del corpus no alcanza/)).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /confirmar nivel/i })).toBeDisabled()
  })

  it('muestra el modo degradado cuando la ruta principal no estuvo disponible', async () => {
    mockApi([
      { method: 'GET', path: '/api/decisiones', body: historialVacio },
      { method: 'POST', path: '/api/consulta', body: consultaElevada({ degraded: true, backend_used: 'deterministic_fallback' }) },
    ])
    const user = userEvent.setup()
    render(<RevisionView />)
    await pedirSugerencia(user)
    expect(await screen.findByText(/Modo degradado:/)).toBeInTheDocument()
  })

  it('muestra un error claro con botón de reintentar si la API falla', async () => {
    mockApi([
      { method: 'GET', path: '/api/decisiones', body: historialVacio },
      { method: 'POST', path: '/api/consulta', status: 429, body: { detail: 'Demasiadas consultas seguidas. Intenta de nuevo en 12 s.' } },
    ])
    const user = userEvent.setup()
    render(<RevisionView />)
    await pedirSugerencia(user)
    expect(await screen.findByText(/Demasiadas consultas seguidas/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument()
  })
})
