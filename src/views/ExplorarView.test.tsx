import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { ExplorarView } from './ExplorarView'
import { mockApi } from '../test/fixtures'
import type { GoldCase } from '../types'

const caso = (case_id: string, text: string, final_level: number | null): GoldCase => ({
  case_id,
  text,
  final_level,
  final_citation: null,
  ambiguous: false,
  should_abstain: false,
  resolution_method: 'consenso',
})

describe('ExplorarView', () => {
  it('busca sin distinguir tildes y filtra por nivel', async () => {
    mockApi([
      {
        method: 'GET',
        path: '/api/casos',
        body: {
          total: 3,
          cases: [
            caso('C001', 'el nino tiene fiebre y el cuello rigido', 2),
            caso('C002', 'se quemo la mano con la plancha', 4),
            caso('C003', 'no respira y no reacciona', 1),
          ],
        },
      },
    ])
    const user = userEvent.setup()
    render(<ExplorarView />)

    expect(await screen.findByText('3 de 3 casos')).toBeInTheDocument()
    await user.type(screen.getByRole('textbox', { name: /buscar en los relatos/i }), 'niño')
    expect(screen.getByText('1 de 3 casos')).toBeInTheDocument()
    expect(screen.getByText(/el nino tiene fiebre/)).toBeInTheDocument()

    await user.clear(screen.getByRole('textbox', { name: /buscar en los relatos/i }))
    await user.click(screen.getByRole('button', { name: 'Nivel I' }))
    expect(screen.getByText('1 de 3 casos')).toBeInTheDocument()
    expect(screen.getByText(/no respira/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Nivel V' }))
    expect(screen.getByText(/Ningún caso coincide/)).toBeInTheDocument()
  })
})
