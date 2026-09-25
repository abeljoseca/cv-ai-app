import { describe, expect, it } from 'vitest'
import { applyEuropassTextEdit, isEuropassEditablePath } from '@/lib/cv/styles/europass/edit'
import { europassMatchText, vacancyFocus } from '@/lib/cv/styles/europass/pipeline'
import { buildEuropassUserMessage, EUROPASS_SYSTEM_PROMPT } from '@/lib/cv/styles/europass/prompt'
import { mapEuropassObjective } from '@/lib/cv/styles/europass/mapper'
import { cvContentName, cvContentTitle, isEuropassV2, withoutInternalFields } from '@/lib/cv/content'
import { parseVisualConfig } from '@/lib/cv/visual-config'
import type { VacancyProfile } from '@/lib/cv/types/pipeline'
import type { Profile } from '@/types'
import { europassReferenceContent } from '../fixtures/europass-content'

describe('Europass preview edits (decision A)', () => {
  it('only accepts the texts the AI writes', () => {
    expect(isEuropassEditablePath('sobre_mi.texto')).toBe(true)
    expect(isEuropassEditablePath('experiencia_laboral.0.bullets.2.texto')).toBe(true)
    expect(isEuropassEditablePath('informacion_personal.nombre_completo')).toBe(false)
    expect(isEuropassEditablePath('experiencia_laboral.0.cargo')).toBe(false)
    const c = europassReferenceContent()
    expect(applyEuropassTextEdit(c, 'experiencia_laboral.0.cargo', 'CEO')).toBe(c)
    expect(applyEuropassTextEdit(c, 'informacion_personal.nombre_completo', 'X')).toBe(c)
  })

  it('an edited sentence becomes the user\'s own text; an untouched one stays as is', () => {
    const c = europassReferenceContent()
    const out = applyEuropassTextEdit(c, 'experiencia_laboral.1.bullets.0.texto', '  Gestión   de proyectos europeos. ')
    expect(out.experiencia_laboral[1].bullets[0]).toMatchObject({ texto: 'Gestión de proyectos europeos.', _origen: 'usuario' })
    expect(out.experiencia_laboral[1].bullets[1]._origen).toBe('ia')
    expect(c.experiencia_laboral[1].bullets[0]._origen).toBe('ia') // not mutated
    const same = applyEuropassTextEdit(c, 'sobre_mi.texto', c.sobre_mi.texto!)
    expect(same).toBe(c)
    expect(applyEuropassTextEdit(c, 'sobre_mi.texto', 'Otro texto.').sobre_mi).toMatchObject({ texto: 'Otro texto.', _origen: 'usuario' })
  })

  it('ignores indexes that do not exist', () => {
    const c = europassReferenceContent()
    expect(applyEuropassTextEdit(c, 'experiencia_laboral.9.bullets.0.texto', 'x')).toBe(c)
  })
})

describe('Europass vacancy mode', () => {
  const vp: VacancyProfile = {
    cargo_objetivo: ' Jefa de Comunicación ', seniority: 'senior', industria: 'Sector público',
    skills_requeridas: ['Comunicación institucional', 'Inglés C1'], skills_deseadas: ['Francés'],
    keywords_ats: ['comunicación institucional'], responsabilidades: ['Coordinar el equipo de prensa'],
  }

  it('passes the title and requirements, deduplicated', () => {
    expect(vacancyFocus(vp)).toEqual({
      cargo: 'Jefa de Comunicación',
      requisitos: ['Comunicación institucional', 'Inglés C1', 'Coordinar el equipo de prensa', 'comunicación institucional', 'Francés'],
    })
  })

  it('the posting goes in the user message, never as a citable source', () => {
    const sources = { resumen: null, hechos: [], experiencias: [] }
    const msg = buildEuropassUserMessage(sources, 'es', undefined, vacancyFocus(vp))
    expect(msg).toContain('"puesto_objetivo"')
    expect(msg).toContain('Coordinar el equipo de prensa')
    expect(buildEuropassUserMessage(sources, 'es')).not.toContain('puesto_objetivo')
    expect(EUROPASS_SYSTEM_PROMPT).toContain('It is not a source: never cite it.')
    expect(EUROPASS_SYSTEM_PROMPT).not.toContain('Coordinar')
  })

  it('match text covers skills, jobs, bullets and summary', () => {
    const t = europassMatchText(europassReferenceContent())
    for (const s of ['canva', 'negociación', 'técnica de proyectos europeos', 'interreg', 'cinco años']) expect(t).toContain(s)
  })
})

describe('spec §8.4: unlinked achievements', () => {
  const base = { user_id: 'u', created_at: '' }
  const src = (logros: Array<{ id: string; descripcion: string; experiencia_id: string | null }>) => ({
    profile: { id: 'u', nombre: 'Ana', apellido: 'Ruiz' } as unknown as Profile,
    experiencias: [
      { ...base, id: 'e1', empresa: 'Acme', cargo: 'Analista', fecha_inicio: '2018', fecha_fin: '2020', activo: false, descripcion: null },
      { ...base, id: 'e2', empresa: 'Globex', cargo: 'Coordinadora', fecha_inicio: '2021', fecha_fin: null, activo: true, descripcion: null },
    ],
    educaciones: [], idiomas: [], habilidades: [], certificaciones: [],
    logros: logros.map(l => ({ ...base, ...l })),
  })

  it('goes to the one job whose company or title it names', () => {
    const { content, aiSources } = mapEuropassObjective(src([
      { id: 'l1', descripcion: 'En Globex reduje costos 7%.', experiencia_id: null },
      { id: 'l2', descripcion: 'Como analista automaticé 12 reportes.', experiencia_id: null },
    ]))
    expect(aiSources.experiencias.find(e => e.ref === 'exp:e2')!.logros.map(l => l.ref)).toEqual(['logro:l1'])
    expect(aiSources.experiencias.find(e => e.ref === 'exp:e1')!.logros.map(l => l.ref)).toEqual(['logro:l2'])
    expect(content.informacion_adicional.logros_destacados.items).toEqual([])
  })

  it('stays in "Logros destacados" when it names no job, or more than one', () => {
    const { content, aiSources } = mapEuropassObjective(src([
      { id: 'l1', descripcion: 'Premio nacional de innovación 2022.', experiencia_id: null },
      { id: 'l2', descripcion: 'Migré datos de Acme a Globex.', experiencia_id: null },
      { id: 'l3', descripcion: 'Acmeología aplicada.', experiencia_id: null },
    ]))
    expect(aiSources.experiencias.flatMap(e => e.logros)).toEqual([])
    expect(content.informacion_adicional.logros_destacados.items).toEqual([
      'Premio nacional de innovación 2022.', 'Migré datos de Acme a Globex.', 'Acmeología aplicada.',
    ])
  })
})

describe('stored-content helpers', () => {
  it('detects europass@2 and reads name/title from either schema', () => {
    const v2 = europassReferenceContent()
    expect(isEuropassV2(v2)).toBe(true)
    expect(isEuropassV2({ nombre: 'Ana' })).toBe(false)
    expect(isEuropassV2(null)).toBe(false)
    expect(cvContentName(v2)).toBe('Laura Fernández Ibáñez')
    expect(cvContentTitle(v2)).toBe('Coordinadora de Comunicación Institucional')
    expect(cvContentName({ nombre: ' Ana ' })).toBe('Ana')
    expect(cvContentTitle({ titulo: 'Dev' })).toBe('Dev')
    expect(cvContentName(null)).toBeNull()
  })

  it('strips internal fields before content leaves the app', () => {
    const out = JSON.stringify(withoutInternalFields(europassReferenceContent()))
    expect(out).not.toMatch(/_fuentes|_origen|"_id"/)
    expect(out).toContain('Laura Fernández Ibáñez')
  })

  it('visual config keeps valid Europass presets and drops anything else', () => {
    expect(parseVisualConfig({ accent_color: '#1a1a1a', densidad: 'amplio', foto_tam: 'pequena' }))
      .toEqual({ accent_color: '#1A1A1A', densidad: 'amplio', foto_tam: 'pequena' })
    expect(parseVisualConfig({ densidad: 'enorme', foto_tam: 'toString' })).toEqual({})
  })
})
