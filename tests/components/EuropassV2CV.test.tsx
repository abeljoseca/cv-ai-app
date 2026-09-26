import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'

// next/font only works inside the Next compiler.
vi.mock('next/font/google', () => {
  const font = () => ({ variable: 'font-var', className: 'font' })
  return { Carlito: font, Gelasio: font, Arimo: font, Inter: font }
})

import CVRenderer from '@/components/CVTemplates'
import EuropassV2CV from '@/components/CVTemplates/EuropassV2CV'
import type { EuropassContent } from '@/lib/cv/styles/europass/schema'
import { europassReferenceContent } from '../fixtures/europass-content'

const titles = (c: HTMLElement) => [...c.querySelectorAll('h2.section-title')].map(h => h.textContent)
const text = (c: HTMLElement) => c.textContent ?? ''

describe('EuropassV2CV', () => {
  it('renders every section of the approved reference in the fixed order', () => {
    const { container } = render(<EuropassV2CV data={europassReferenceContent()} />)
    expect(titles(container)).toEqual([
      'Sobre mí', 'Experiencia laboral', 'Educación y formación', 'Competencias lingüísticas',
      'Competencias digitales', 'Otras competencias', 'Permiso de conducir', 'Información adicional', 'Anexos',
    ])
  })

  it('never renders internal "_" fields', () => {
    const { container } = render(<EuropassV2CV data={europassReferenceContent()} />)
    expect(text(container)).not.toMatch(/exp:e1|perfil:resumen|_fuentes|_origen/)
  })

  it('hides empty sections instead of printing empty headings', () => {
    const c = europassReferenceContent()
    c.sobre_mi.texto = null
    c.otras_competencias = []
    c.permiso_conducir = { activo: false, categorias: ['B'] }
    c.informacion_adicional.activo = false
    c.anexos = { activo: true, items: [] }
    c.competencias_digitales = { ...c.competencias_digitales, herramientas: [], digcomp: { ...c.competencias_digitales.digcomp, activo: false } }
    const { container } = render(<EuropassV2CV data={c} />)
    expect(titles(container)).toEqual(['Experiencia laboral', 'Educación y formación', 'Competencias lingüísticas'])
  })

  it('header: fields in contract order; the full address replaces the city; URLs shown bare', () => {
    const { container } = render(<EuropassV2CV data={europassReferenceContent()} />)
    const rows = [...container.querySelectorAll('.datos-personales > div')].map(d => d.textContent)
    expect(rows).toEqual([
      'Fecha de nacimiento: 14/03/1994',
      'Nacionalidad: Española',
      'Dirección: Calle Alcalá 142, 28009 Madrid, España',
      'Teléfono: +34 611 223 344',
      'Email: laura.fernandez@email.com',
      'LinkedIn: linkedin.com/in/laurafernandezib',
    ])

    const c = europassReferenceContent()
    c.informacion_personal.direccion = { activo: false, valor: 'Calle Alcalá 142' }
    c.informacion_personal.fecha_nacimiento = { activo: false, valor: '14/03/1994' }
    const { container: c2 } = render(<EuropassV2CV data={c} />)
    const rows2 = [...c2.querySelectorAll('.datos-personales > div')].map(d => d.textContent)
    expect(rows2).toContain('Ciudad: Madrid, España')
    expect(rows2.join()).not.toMatch(/Alcalá|Fecha de nacimiento/)
  })

  it('shows the photo only when active and present, at the chosen preset size', () => {
    const c = europassReferenceContent()
    expect(render(<EuropassV2CV data={c} />).container.querySelector('.foto')).toBeNull()
    c.informacion_personal.foto = { activo: true, url: 'https://x.test/f.jpg' }
    const { container } = render(<EuropassV2CV data={c} fotoTam="grande" />)
    expect(container.querySelector('.foto img')?.getAttribute('src')).toBe('https://x.test/f.jpg')
    const root = container.querySelector('.ep2') as HTMLElement
    expect(root.style.getPropertyValue('--foto-w')).toBe('33mm')
    expect(root.style.getPropertyValue('--foto-h')).toBe('44mm')
  })

  it('applies density presets and the accent color (default #003399)', () => {
    const { container } = render(<EuropassV2CV data={europassReferenceContent()} densidad="compacto" />)
    const root = container.querySelector('.ep2') as HTMLElement
    expect(root.style.getPropertyValue('--lh')).toBe('1.1')
    expect(root.style.getPropertyValue('--entre-secciones')).toBe('10.5pt')
    expect(root.style.getPropertyValue('--acento')).toBe('#003399')
    const { container: c2 } = render(<EuropassV2CV data={europassReferenceContent()} accentColor="#1A1A1A" />)
    expect((c2.querySelector('.ep2') as HTMLElement).style.getPropertyValue('--acento')).toBe('#1A1A1A')
  })

  it('experience: title, period, employer + place, bullets, NACE', () => {
    const { container } = render(<EuropassV2CV data={europassReferenceContent()} />)
    const first = container.querySelector('.item') as HTMLElement
    expect(first.querySelector('.item-fecha')?.textContent).toBe('09/2022 – actualidad')
    expect(first.querySelector('.item-sub')?.textContent).toBe('Representación Permanente de España ante la Unión Europea — Bruselas, Bélgica')
    expect(first.querySelectorAll('li')).toHaveLength(4)
    expect(first.querySelector('.item-meta')?.textContent).toBe('Sector de actividad (NACE): O84 — Administración pública y defensa')
  })

  it('education: ISCED + subjects line, area as a gray line, certification with only a year', () => {
    const c = europassReferenceContent()
    c.educacion_formacion[1].area = 'Comunicación audiovisual'
    c.educacion_formacion.push({
      _id: 'c1', origen: 'certificacion', titulo: 'Curso de Power BI', institucion: '', area: null,
      fecha_inicio: null, fecha_fin: '2021', nivel_isced: { activo: false, valor: null }, lugar: { activo: false, valor: null }, materias: { activo: false, valor: null },
    })
    const { container } = render(<EuropassV2CV data={c} />)
    const items = [...container.querySelectorAll('section')].find(s => s.textContent?.startsWith('Educación'))!.querySelectorAll('.item')
    expect(items[0].querySelector('.item-meta')?.textContent).toBe('Nivel CINE/ISCED: 7 (Máster) · Materias principales: Derecho institucional de la UE, Comunicación pública, Políticas comparadas')
    expect(items[1].querySelector('.item-area')?.textContent).toBe('Comunicación audiovisual')
    expect(items[2].querySelector('.item-fecha')?.textContent).toBe('2021')
    expect(items[2].querySelector('.item-sub')).toBeNull()
  })

  it('languages: native line, CEFR table with codes only, unconfirmed languages on a line below', () => {
    const c = europassReferenceContent()
    c.competencias_linguisticas.otras_lenguas.push({ idioma: 'Portugués', niveles: null, niveles_confirmados: false, certificacion: { activo: false, valor: null } })
    const { container } = render(<EuropassV2CV data={c} />)
    expect(container.querySelector('.lengua-materna')?.textContent).toBe('Lengua materna: Español')
    const rows = [...container.querySelectorAll('table.cefr tbody tr')].map(r => [...r.querySelectorAll('td')].map(td => td.textContent))
    expect(rows).toEqual([
      ['Francés', 'C1', 'C1', 'C1', 'C1', 'B2'],
      ['Inglés', 'C1', 'C1', 'B2', 'B2', 'B2'],
      ['Italiano', 'B1', 'B2', 'B1', 'B1', 'A2'],
    ])
    expect(container.querySelector('.otras-lenguas')?.textContent).toBe('Otras lenguas: Portugués')
    expect(container.querySelector('.cefr-nota')?.textContent).toBe('Certificaciones oficiales: DELF C1, 2018 (francés) · Cambridge C1 Advanced, 2019 (inglés)')
    const idiomas = [...container.querySelectorAll('section')].find(s => s.textContent?.startsWith('Competencias lingüísticas'))!
    expect(idiomas.textContent).not.toMatch(/Avanzado|Intermedio|Básico|Nativo/)
  })

  it('without any confirmed level there is no table, only the line', () => {
    const c = europassReferenceContent()
    c.competencias_linguisticas.otras_lenguas = [{ idioma: 'Alemán', niveles: null, niveles_confirmados: false, certificacion: { activo: false, valor: null } }]
    const { container } = render(<EuropassV2CV data={c} />)
    expect(container.querySelector('table.cefr')).toBeNull()
    expect(container.querySelector('.otras-lenguas')?.textContent).toBe('Otras lenguas: Alemán')
  })

  it('licence as "Categoría X"; additional info in its fixed sub-group order; numbered annexes', () => {
    const { container } = render(<EuropassV2CV data={europassReferenceContent()} />)
    expect(text(container)).toContain('Categoría B')
    expect([...container.querySelectorAll('.subgrupo-titulo')].map(p => p.textContent)).toEqual(['Ponencias', 'Premios y becas', 'Afiliaciones'])
    expect([...container.querySelectorAll('.anexos-list .num')].map(n => n.textContent)).toEqual(['1.', '2.', '3.'])
  })

  it('edit mode: only "Sobre mí" and bullets are editable, never objective data', () => {
    const { container } = render(<EuropassV2CV data={europassReferenceContent()} isEditMode onFieldChange={() => {}} />)
    const editable = [...container.querySelectorAll('[contenteditable="true"]')]
    expect(editable).toHaveLength(1 + 4 + 4 + 3)
    expect(editable.every(el => el.tagName === 'LI' || el.closest('.sobre-mi'))).toBe(true)
  })

  it('language section switched off: gone entirely', () => {
    const c = europassReferenceContent()
    c.competencias_linguisticas.activo = false
    const { container } = render(<EuropassV2CV data={c} />)
    expect(titles(container)).not.toContain('Competencias lingüísticas')
  })

  it('online profiles take a full row; clickable plain-looking links only in the exported document', () => {
    const { container } = render(<EuropassV2CV data={europassReferenceContent()} />)
    const row = [...container.querySelectorAll('.datos-personales > div')].find(d => d.textContent?.startsWith('LinkedIn'))!
    expect(row.className).toBe('perfil')
    expect(row.querySelector('a')).toBeNull()
    const { container: pdf } = render(<EuropassV2CV data={europassReferenceContent()} enlaces />)
    const a = pdf.querySelector('.datos-personales a') as HTMLAnchorElement
    expect(a.getAttribute('href')).toBe('https://www.linkedin.com/in/laurafernandezib/')
    expect(a.textContent).toBe('linkedin.com/in/laurafernandezib')
  })
})

describe('CVRenderer dispatch', () => {
  it('uses the new template for europass@2 content and the legacy one otherwise', () => {
    const v2 = render(<CVRenderer estilo="europass" data={europassReferenceContent()} />)
    expect(v2.container.querySelector('.ep2')).not.toBeNull()
    const legacy = render(<CVRenderer estilo="europass" data={{ nombre: 'Ana', titulo: 'X', contacto: {}, experiencias: [], educacion: [], habilidades: [], idiomas: [] } as never} />)
    expect(legacy.container.querySelector('.ep2')).toBeNull()
    expect(legacy.container.textContent).toContain('Ana')
  })

  it('a europass@2 CV renders the new template whatever the stored estilo says', () => {
    const data = europassReferenceContent() as EuropassContent
    const { container } = render(<CVRenderer estilo="harvard" data={data} />)
    expect(container.querySelector('.ep2')).not.toBeNull()
  })
})
