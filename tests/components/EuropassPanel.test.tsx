import { describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import EuropassPanel from '@/components/cv-editor/EuropassPanel'
import { withoutIdentity } from '@/lib/cv/styles/europass/identity-view'
import type { EuropassContent } from '@/lib/cv/styles/europass/schema'
import { europassReferenceContent } from '../fixtures/europass-content'

function content(): EuropassContent {
  const c = withoutIdentity(europassReferenceContent())
  c.competencias_linguisticas.otras_lenguas = c.competencias_linguisticas.otras_lenguas.map((l, i) => ({ ...l, _id: `i${i}` }))
  c.informacion_personal.fecha_nacimiento = { activo: false, valor: null }
  return c
}

// Accordions start closed (CEO 2026-09-25): open them all, as a user would.
function openAll(container: HTMLElement) {
  for (const b of [...container.querySelectorAll('button[aria-expanded="false"]')].filter(b => !b.getAttribute('aria-label'))) fireEvent.click(b)
}

function setup(over: Partial<React.ComponentProps<typeof EuropassPanel>> = {}) {
  const send = vi.fn(async () => ({ ok: true, vacio: true }))
  const utils = render(<EuropassPanel content={content()} visual={{}} send={send} identidadDisponible onUploadPhoto={async () => true} {...over} />)
  openAll(utils.container)
  return { send, ...utils }
}

describe('EuropassPanel', () => {
  it('shows the recommended sections first, then the rest', () => {
    const { container } = setup()
    const text = container.textContent ?? ''
    expect(text.indexOf('Recomendadas en Europass')).toBeLessThan(text.indexOf('Fecha de nacimiento'))
    expect(text.indexOf('Nacionalidad')).toBeLessThan(text.indexOf('Fecha de nacimiento'))
  })

  it('switching on an empty slot sends the operation and opens its input in the panel', async () => {
    const { send } = setup()
    const sw = screen.getByRole('switch', { name: 'Fecha de nacimiento' })
    expect(sw.getAttribute('aria-checked')).toBe('false')
    await act(async () => { fireEvent.click(sw) })
    expect(send).toHaveBeenCalledWith({ op: 'activar', slot: 'fecha_nacimiento', activo: true })
    expect(screen.getByLabelText('Fecha de nacimiento', { selector: 'input' })).toBeTruthy()
    expect(screen.getByText('Aparecerá en tu CV al completarlo')).toBeTruthy()
  })

  it('a text field saves on blur, only when it changed', async () => {
    const { send } = setup()
    const input = screen.getByLabelText('Nacionalidad', { selector: 'input' }) as HTMLInputElement
    await act(async () => { fireEvent.blur(input) })
    expect(send).not.toHaveBeenCalled()
    fireEvent.change(input, { target: { value: 'Venezolana' } })
    await act(async () => { fireEvent.blur(input) })
    expect(send).toHaveBeenCalledWith({ op: 'identidad', campo: 'nacionalidad', valor: 'Venezolana' })
  })

  it('shows the server error under the field', async () => {
    const send = vi.fn(async () => ({ ok: false, error: 'El enlace debe ser de orcid.org.' }))
    setup({ send })
    await act(async () => { fireEvent.click(screen.getByRole('switch', { name: 'ORCID' })) })
    const input = screen.getByLabelText('ORCID', { selector: 'input' })
    fireEvent.change(input, { target: { value: 'https://evil.example.com' } })
    await act(async () => { fireEvent.blur(input) })
    expect(screen.getByRole('alert').textContent).toBe('El enlace debe ser de orcid.org.')
  })

  it('identity fields are disabled when the data is not available', () => {
    setup({ identidadDisponible: false })
    expect((screen.getByRole('switch', { name: 'Fecha de nacimiento' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('photo size only appears with an active photo; density always', () => {
    setup()
    expect(screen.getByText('Densidad textual')).toBeTruthy()
    expect(screen.queryByText('Tamaño de foto')).toBeNull()
    const c = content()
    c.informacion_personal.foto = { activo: true, url: 'https://x.test/f.jpg' }
    render(<EuropassPanel content={c} visual={{}} send={vi.fn()} identidadDisponible onUploadPhoto={async () => true} />)
    expect(screen.getAllByText('Tamaño de foto')).toHaveLength(1)
  })

  it('per-item fields: one switch for the section, one field per item', () => {
    setup()
    expect(screen.getAllByRole('switch', { name: 'Ciudad y país del puesto' })).toHaveLength(1)
    // Section already on in the fixture → a city field per job.
    expect(screen.getAllByPlaceholderText('Ciudad').length).toBeGreaterThanOrEqual(3)
  })

  it('licence categories toggle through the server operation', async () => {
    const { send } = setup()
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'C' })) })
    expect(send).toHaveBeenCalledWith({ op: 'permiso', valor: ['B', 'C'] })
  })

  it('keeps a half-typed draft when the panel re-renders with new server content', async () => {
    const send = vi.fn(async () => ({ ok: true }))
    const { rerender, container } = render(<EuropassPanel content={content()} visual={{}} send={send} identidadDisponible onUploadPhoto={async () => true} />)
    openAll(container)
    const input = screen.getByLabelText('Nacionalidad', { selector: 'input' }) as HTMLInputElement
    input.focus()
    fireEvent.change(input, { target: { value: 'Venez' } })
    rerender(<EuropassPanel content={{ ...content(), otras_competencias: ['Nueva'] }} visual={{ densidad: 'amplio' }} send={send} identidadDisponible onUploadPhoto={async () => true} />)
    const again = screen.getByLabelText('Nacionalidad', { selector: 'input' }) as HTMLInputElement
    expect(again).toBe(input)
    expect(again.value).toBe('Venez')
  })

  it('sections start closed inside accordions and open on click', () => {
    render(<EuropassPanel content={content()} visual={{}} send={vi.fn()} identidadDisponible onUploadPhoto={async () => true} />)
    expect(screen.queryByRole('switch', { name: 'Nacionalidad' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Recomendadas en Europass' }))
    expect(screen.getByRole('switch', { name: 'Nacionalidad' })).toBeTruthy()
    expect(screen.queryByRole('switch', { name: 'Fecha de nacimiento' })).toBeNull()
  })

  it('explains unfamiliar fields with a tooltip next to the name', () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: '¿Qué es Nivel CINE/ISCED?' }))
    expect(screen.getByRole('tooltip').textContent).toContain('6 es una carrera universitaria')
    expect(screen.queryByRole('button', { name: '¿Qué es Nacionalidad?' })).toBeNull()
  })

  it('the ✓ button saves the field without leaving it', async () => {
    const { send } = setup()
    const input = screen.getByLabelText('Nacionalidad', { selector: 'input' })
    fireEvent.change(input, { target: { value: 'Chilena' } })
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Guardar Nacionalidad' })) })
    expect(send).toHaveBeenCalledWith({ op: 'identidad', campo: 'nacionalidad', valor: 'Chilena' })
  })

  it('city + country save once, when the focus leaves both fields', async () => {
    const send = vi.fn(async () => ({ ok: true }))
    const c = content()
    c.experiencia_laboral = c.experiencia_laboral.map(e => ({ ...e, lugar: { activo: true, valor: null } }))
    const { container } = render(<EuropassPanel content={c} visual={{}} send={send} identidadDisponible onUploadPhoto={async () => true} />)
    openAll(container)
    const [ciudad] = screen.getAllByPlaceholderText('Ciudad')
    const [pais] = screen.getAllByPlaceholderText('País')
    fireEvent.change(ciudad, { target: { value: 'Caracas' } })
    await act(async () => { fireEvent.blur(ciudad, { relatedTarget: pais }) })
    expect(send).not.toHaveBeenCalled()
    fireEvent.change(pais, { target: { value: 'Venezuela' } })
    await act(async () => { fireEvent.blur(pais, { relatedTarget: document.body }) })
    expect(send).toHaveBeenCalledTimes(1)
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ campo: 'lugar', valor: { ciudad: 'Caracas', pais: 'Venezuela' } }))
  })

  it('an open section shows its title in Momentum blue, on one line', () => {
    render(<EuropassPanel content={content()} visual={{}} send={vi.fn()} identidadDisponible onUploadPhoto={async () => true} />)
    const btn = screen.getByRole('button', { name: 'Competencias lingüísticas' })
    const title = btn.querySelector('span') as HTMLElement
    expect(title.style.color).toBe('var(--deep)')
    fireEvent.click(btn)
    expect(title.style.color).toBe('var(--blue)')
    expect(title.style.whiteSpace).toBe('nowrap')
  })

  it('does not show a page counter in the panel (CEO 2026-09-26)', () => {
    render(<EuropassPanel content={content()} visual={{}} send={vi.fn()} identidadDisponible onUploadPhoto={async () => true} />)
    expect(screen.queryByText(/Tu CV ocupa/)).toBeNull()
  })

  it('"Foto visible": upload/replace only while the photo is visible', () => {
    const c = content()
    c.informacion_personal.foto = { activo: false, url: null }
    const { unmount } = render(<EuropassPanel content={c} visual={{}} send={vi.fn()} identidadDisponible onUploadPhoto={async () => true} />)
    expect(screen.getByRole('switch', { name: 'Foto visible' }).getAttribute('aria-checked')).toBe('false')
    expect(screen.queryByRole('button', { name: /foto$/ })).toBeNull()
    unmount()
    c.informacion_personal.foto = { activo: true, url: null }
    const r2 = render(<EuropassPanel content={c} visual={{}} send={vi.fn()} identidadDisponible onUploadPhoto={async () => true} />)
    expect(screen.getByRole('button', { name: 'Subir foto' })).toBeTruthy()
    r2.unmount()
    c.informacion_personal.foto = { activo: true, url: 'https://x.test/f.jpg' }
    render(<EuropassPanel content={c} visual={{}} send={vi.fn()} identidadDisponible onUploadPhoto={async () => true} />)
    expect(screen.getByRole('button', { name: 'Cambiar foto' })).toBeTruthy()
  })

  it('the whole language section can be switched off', async () => {
    const { send } = setup()
    const sw = screen.getByRole('switch', { name: 'Mostrar en el CV' })
    expect(sw.getAttribute('aria-checked')).toBe('true')
    await act(async () => { fireEvent.click(sw) })
    expect(send).toHaveBeenCalledWith({ op: 'activar', slot: 'idiomas', activo: false })
  })
})
