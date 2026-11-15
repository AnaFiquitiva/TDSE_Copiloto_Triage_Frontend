import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import App from './App'
import { historialVacio, mockApi } from './test/fixtures'

describe('App (armazón)', () => {
  it('cambia entre modo claro y oscuro y recuerda la elección', async () => {
    mockApi([{ method: 'GET', path: '/api/decisiones', body: historialVacio }])
    const user = userEvent.setup()
    render(<App />)

    const html = document.documentElement
    expect(html).not.toHaveClass('dark') // matchMedia simulado: el sistema no pide oscuro
    await user.click(screen.getByRole('button', { name: 'Cambiar a modo oscuro' }))
    expect(html).toHaveClass('dark')
    expect(localStorage.getItem('tdse-theme')).toBe('dark')
    await user.click(screen.getByRole('button', { name: 'Cambiar a modo claro' }))
    expect(html).not.toHaveClass('dark')
    expect(localStorage.getItem('tdse-theme')).toBe('light')
  })

  it('la hamburguesa contrae y expande el menú lateral en escritorio', async () => {
    mockApi([{ method: 'GET', path: '/api/decisiones', body: historialVacio }])
    const user = userEvent.setup()
    render(<App />)

    const burger = screen.getByRole('button', { name: /abrir o contraer menú/i })
    expect(burger).toHaveAttribute('aria-expanded', 'true')
    await user.click(burger)
    expect(burger).toHaveAttribute('aria-expanded', 'false')
    expect(localStorage.getItem('tdse-rail')).toBe('collapsed')
    await user.click(burger)
    expect(burger).toHaveAttribute('aria-expanded', 'true')
  })

  it('no pierde el relato escrito al cambiar de pestaña', async () => {
    mockApi([{ method: 'GET', path: '/api/decisiones', body: historialVacio }])
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText(/relato libre del paciente/i), 'fiebre alta y rigidez de nuca')
    const nav = screen.getByRole('complementary', { name: 'Navegación principal' })
    await user.click(screen.getAllByRole('button', { name: /consulta individual/i }).find((b) => nav.contains(b))!)
    expect(screen.getByRole('button', { name: /consulta individual/i, current: 'page' })).toBeInTheDocument()
    await user.click(screen.getAllByRole('button', { name: /revisión/i }).find((b) => nav.contains(b))!)
    // La vista Consulta sigue montada (oculta); el campo de Revisión conserva el texto.
    expect(document.getElementById('relato-revision')).toHaveValue('fiebre alta y rigidez de nuca')
  })
})
