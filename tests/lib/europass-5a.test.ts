// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { randomBytes } from 'node:crypto'
import { decryptForUser, encryptForUser, IdentityKeyError } from '@/lib/identity-crypto'
import { validateIdentityValue } from '@/lib/identity'
import { applyEuropassEdit, type EditContext } from '@/lib/cv/styles/europass/edit-ops'
import { withIdentity, withoutIdentity } from '@/lib/cv/styles/europass/identity-view'
import { professionalView } from '@/lib/cv/content'
import type { EuropassContent } from '@/lib/cv/styles/europass/schema'
import { europassReferenceContent } from '../fixtures/europass-content'

const U1 = '11111111-1111-4111-8111-111111111111'
const U2 = '22222222-2222-4222-8222-222222222222'

describe('identity encryption', () => {
  const saved = process.env.IDENTITY_ENCRYPTION_KEY
  beforeEach(() => { process.env.IDENTITY_ENCRYPTION_KEY = randomBytes(32).toString('base64') })
  afterEach(() => { process.env.IDENTITY_ENCRYPTION_KEY = saved })

  it('round-trips and never contains the plaintext', () => {
    const c = encryptForUser(U1, '{"direccion":"Calle Alcalá 142"}')
    expect(c.startsWith('v1.')).toBe(true)
    expect(c).not.toContain('Alcal')
    expect(decryptForUser(U1, c)).toBe('{"direccion":"Calle Alcalá 142"}')
    expect(encryptForUser(U1, 'x')).not.toBe(encryptForUser(U1, 'x')) // random IV
  })

  it('a value copied to another user, tampered, or read with another key does not decrypt', () => {
    const c = encryptForUser(U1, 'secreto')
    expect(() => decryptForUser(U2, c)).toThrow()
    const tampered = c.slice(0, -2) + (c.endsWith('A') ? 'BB' : 'AA')
    expect(() => decryptForUser(U1, tampered)).toThrow()
    process.env.IDENTITY_ENCRYPTION_KEY = randomBytes(32).toString('base64')
    expect(() => decryptForUser(U1, c)).toThrow()
  })

  it('refuses to work without a proper key (never falls back to plaintext)', () => {
    delete process.env.IDENTITY_ENCRYPTION_KEY
    expect(() => encryptForUser(U1, 'x')).toThrow(IdentityKeyError)
    process.env.IDENTITY_ENCRYPTION_KEY = Buffer.from('short').toString('base64')
    expect(() => encryptForUser(U1, 'x')).toThrow(IdentityKeyError)
  })
})

describe('identity validation', () => {
  const today = new Date(Date.UTC(2026, 8, 25))
  it('accepts real past dates of people at least 14', () => {
    expect(validateIdentityValue('fecha_nacimiento', '1994-03-14', today)).toEqual({ ok: true, value: '1994-03-14' })
    expect(validateIdentityValue('fecha_nacimiento', '2012-09-25', today).ok).toBe(true)
  })
  it('rejects impossible, future, too-recent or malformed dates', () => {
    for (const v of ['1994-02-30', '2030-01-01', '2012-09-26', '14/03/1994', '1899-12-31']) {
      expect(validateIdentityValue('fecha_nacimiento', v, today).ok).toBe(false)
    }
  })
  it('trims text, allows clearing, caps length', () => {
    expect(validateIdentityValue('nacionalidad', '  Española ')).toEqual({ ok: true, value: 'Española' })
    expect(validateIdentityValue('direccion', '')).toEqual({ ok: true, value: '' })
    expect(validateIdentityValue('nacionalidad', 'x'.repeat(61)).ok).toBe(false)
    expect(validateIdentityValue('direccion', 42).ok).toBe(false)
  })
})

describe('identity in the CV', () => {
  it('injects formatted values for rendering and strips them for storage', () => {
    const c = withoutIdentity(europassReferenceContent())
    const shown = withIdentity(c, { fecha_nacimiento: '1994-03-14', direccion: 'Calle Alcalá 142' })
    expect(shown.informacion_personal.fecha_nacimiento.valor).toBe('14/03/1994')
    expect(shown.informacion_personal.nacionalidad.valor).toBeNull()
    const stored = withoutIdentity(shown)
    for (const f of ['fecha_nacimiento', 'nacionalidad', 'direccion'] as const) expect(stored.informacion_personal[f].valor).toBeNull()
    expect(stored.informacion_personal.fecha_nacimiento.activo).toBe(true)
  })
})

// Stored content = what the DB holds: identity values stripped, some optional data empty.
function stored(): EuropassContent {
  const c = withoutIdentity(europassReferenceContent())
  c.competencias_linguisticas.otras_lenguas = c.competencias_linguisticas.otras_lenguas.map((l, i) => ({ ...l, _id: `i${i}` }))
  return c
}
const ctx: EditContext = { identity: { nacionalidad: 'Española' }, fotoUrl: null }
const edit = (op: unknown, c = stored(), x = ctx) => applyEuropassEdit(c, op, x)
const ok = (r: ReturnType<typeof applyEuropassEdit>) => { if (!r.ok) throw new Error(r.error); return r }

describe('europass editor operations', () => {
  it('rejects anything malformed or outside the closed lists', () => {
    for (const op of [
      null, {}, { op: 'borrar_todo' }, { op: 'activar', slot: 'habilidades', activo: true },
      { op: 'permiso', valor: ['B', 'Z'] }, { op: 'digcomp', valor: { seguridad: 'Experto' } },
      { op: 'item', seccion: 'educacion', id: 'd1', campo: 'nivel_isced', valor: 9 },
      { op: 'item', seccion: 'educacion', id: 'd1', campo: 'nivel_isced', valor: 6.5 },
      { op: 'item', seccion: 'experiencia', id: 'nope', campo: 'sector_nace', valor: 'x' },
      { op: 'visual', densidad: 'enorme' }, { op: 'visual' },
      { op: 'texto', ruta: 'informacion_personal.nombre_completo', valor: 'Otro' },
      { op: 'perfil_url', tipo: 'orcid', valor: 'https://evil.example.com/0000' },
      { op: 'lista', campo: 'anexos', valor: Array(21).fill('x') },
    ]) expect(edit(op).ok).toBe(false)
  })

  it('switching on an empty slot does nothing (an empty section is never "on")', () => {
    const c = stored()
    const r = ok(edit({ op: 'activar', slot: 'fecha_nacimiento', activo: true }, c))
    expect(r.vacio).toBe(true)
    expect(r.content).toBe(c)
    expect(ok(edit({ op: 'activar', slot: 'foto', activo: true })).vacio).toBe(true)
  })

  it('switching on a slot with data works; off hides without deleting', () => {
    const on = ok(edit({ op: 'activar', slot: 'nacionalidad', activo: true }, { ...stored(), informacion_personal: { ...stored().informacion_personal, nacionalidad: { activo: false, valor: null } } }))
    expect(on.content.informacion_personal.nacionalidad.activo).toBe(true)
    const off = ok(edit({ op: 'activar', slot: 'anexos', activo: false }))
    expect(off.content.anexos).toEqual({ activo: false, items: stored().anexos.items })
  })

  it('identity: validated, written encrypted-side only, the CV keeps just the switch', () => {
    const r = ok(edit({ op: 'identidad', campo: 'fecha_nacimiento', valor: '1994-03-14' }))
    expect(r.writes).toEqual({ identidad: { campo: 'fecha_nacimiento', valor: '1994-03-14' } })
    expect(r.content.informacion_personal.fecha_nacimiento).toEqual({ activo: true, valor: null })
    const cleared = ok(edit({ op: 'identidad', campo: 'nacionalidad', valor: '' }))
    expect(cleared.content.informacion_personal.nacionalidad).toEqual({ activo: false, valor: null })
    expect(edit({ op: 'identidad', campo: 'fecha_nacimiento', valor: '2030-01-01' }).ok).toBe(false)
  })

  it('per-item fields: one switch per section, value saved to the profile row', () => {
    const c = stored()
    c.experiencia_laboral = c.experiencia_laboral.map(e => ({ ...e, lugar: { activo: false, valor: null } }))
    const r = ok(edit({ op: 'item', seccion: 'experiencia', id: 'e2', campo: 'lugar', valor: { ciudad: 'Madrid', pais: 'España' } }, c))
    expect(r.writes.experiencia).toEqual({ id: 'e2', patch: { ciudad: 'Madrid', pais: 'España' } })
    expect(r.content.experiencia_laboral.map(e => e.lugar)).toEqual([
      { activo: true, valor: null }, { activo: true, valor: 'Madrid, España' }, { activo: true, valor: null },
    ])
    // Clearing the only value switches the whole section off.
    const back = ok(edit({ op: 'item', seccion: 'experiencia', id: 'e2', campo: 'lugar', valor: { ciudad: '', pais: '' } }, r.content))
    expect(back.content.experiencia_laboral.every(e => !e.lugar.activo)).toBe(true)
  })

  it('ISCED only as an integer 0–8, never on certification items', () => {
    const r = ok(edit({ op: 'item', seccion: 'educacion', id: 'd2', campo: 'nivel_isced', valor: 6 }))
    expect(r.writes.educacion).toEqual({ id: 'd2', patch: { nivel_isced: 6 } })
    const c = stored()
    c.educacion_formacion.push({ ...c.educacion_formacion[0], _id: 'c1', origen: 'certificacion' })
    expect(edit({ op: 'item', seccion: 'educacion', id: 'c1', campo: 'nivel_isced', valor: 6 }, c).ok).toBe(false)
  })

  it('language certification goes to the language row', () => {
    const r = ok(edit({ op: 'item', seccion: 'idioma', id: 'i2', campo: 'certificacion', valor: 'CILS B1' }))
    expect(r.writes.idioma).toEqual({ id: 'i2', patch: { certificacion: 'CILS B1' } })
    expect(r.content.competencias_linguisticas.otras_lenguas[2].certificacion).toEqual({ activo: true, valor: 'CILS B1' })
  })

  it('licence categories are kept in the canonical order; DigComp shows only when complete', () => {
    const p = ok(edit({ op: 'permiso', valor: ['C', 'B', 'B'] }))
    expect(p.writes.profile).toEqual({ permiso_conducir: ['B', 'C'] })
    const c = stored()
    c.competencias_digitales.digcomp = { activo: false, informacion_datos: null, comunicacion_colaboracion: null, creacion_contenido: null, seguridad: null, resolucion_problemas: null }
    const partial = ok(edit({ op: 'digcomp', valor: { seguridad: 'Básico' } }, c))
    expect(partial.content.competencias_digitales.digcomp.activo).toBe(false)
    const full = ok(edit({ op: 'digcomp', valor: { informacion_datos: 'Avanzado', comunicacion_colaboracion: 'Básico', creacion_contenido: 'Intermedio', resolucion_problemas: 'Básico' } }, partial.content))
    expect(full.content.competencias_digitales.digcomp.activo).toBe(true)
  })

  it('lists: cleaned, saved to the profile, sub-group switches follow their data', () => {
    const r = ok(edit({ op: 'lista', campo: 'publicaciones', valor: ['  Artículo 2024 ', '', 'Libro'] }))
    expect(r.writes.profile).toEqual({ publicaciones: ['Artículo 2024', 'Libro'] })
    expect(r.content.informacion_adicional.publicaciones).toEqual({ activo: true, items: ['Artículo 2024', 'Libro'] })
    const c = stored()
    c.informacion_adicional = { ...c.informacion_adicional, ponencias: { activo: true, items: [] }, premios_becas: { activo: false, items: [] }, afiliaciones: { activo: false, items: [] } }
    const empty = ok(edit({ op: 'lista', campo: 'ponencias', valor: [] }, c))
    expect(empty.content.informacion_adicional.activo).toBe(false)
  })

  it('profile links: only the right site, normalised to https, fixed order', () => {
    const r = ok(edit({ op: 'perfil_url', tipo: 'orcid', valor: 'orcid.org/0000-0002-1825-0097' }))
    expect(r.writes.profile).toEqual({ orcid_url: 'https://orcid.org/0000-0002-1825-0097' })
    expect(r.content.informacion_personal.perfiles.map(p => p.tipo)).toEqual(['linkedin', 'orcid'])
    expect(ok(edit({ op: 'perfil_url', tipo: 'linkedin', valor: '' })).content.informacion_personal.perfiles.map(p => p.tipo)).toEqual([])
  })

  it('text edits go through the same rules as the preview (decision A)', () => {
    const r = ok(edit({ op: 'texto', ruta: 'experiencia_laboral.0.bullets.0.texto', valor: 'Coordinación del equipo.' }))
    expect(r.content.experiencia_laboral[0].bullets[0]).toMatchObject({ texto: 'Coordinación del equipo.', _origen: 'usuario' })
    expect(r.writes).toEqual({})
  })

  it('visual presets are validated and never touch the content', () => {
    const c = stored()
    const r = ok(edit({ op: 'visual', densidad: 'compacto', foto_tam: 'grande' }, c))
    expect(r.writes.visual).toEqual({ densidad: 'compacto', foto_tam: 'grande' })
    expect(r.content).toBe(c)
  })
})

describe('professionalView (what the vacancy AI may see)', () => {
  it('Europass: no name, contact, photo or identity data', () => {
    const shown = withIdentity(stored(), { fecha_nacimiento: '1994-03-14', direccion: 'Calle Alcalá 142', nacionalidad: 'Española' })
    const out = JSON.stringify(professionalView(shown))
    for (const pii of ['Laura', 'laura.fernandez@email.com', '611', 'Alcalá', '14/03/1994', 'Española', 'linkedin.com']) expect(out).not.toContain(pii)
    expect(out).toContain('Coordinadora de Comunicación Institucional')
    expect(out).toContain('Canva')
  })

  it('legacy CVs: allowlist keeps professional fields and drops everything else', () => {
    const out = professionalView({
      nombre: 'Ana Ruiz', titulo: 'Analista', contacto: { email: 'ana@x.com', telefono: '+58 412' },
      resumen: 'Analista de datos.', experiencias: [{ cargo: 'Analista', empresa: 'Acme' }], campo_desconocido: 'secreto',
    })
    expect(out).toEqual({ titulo: 'Analista', resumen: 'Analista de datos.', experiencias: [{ cargo: 'Analista', empresa: 'Acme' }] })
  })
})

describe('CEFR operations (5c)', () => {
  const withLangs = () => {
    const c = stored()
    c.competencias_linguisticas.otras_lenguas[1] = { ...c.competencias_linguisticas.otras_lenguas[1], niveles_confirmados: false }
    c.competencias_linguisticas.otras_lenguas[2] = { ...c.competencias_linguisticas.otras_lenguas[2], niveles: null, niveles_confirmados: false }
    return c
  }
  const B = { comprension_auditiva: 'C1', comprension_lectora: 'C1', interaccion_oral: 'B2', expresion_oral: 'B2', expresion_escrita: 'B1' }

  it('confirms a breakdown and saves it to the language row', () => {
    const r = ok(edit({ op: 'cefr', id: 'i1', niveles: B }, withLangs()))
    expect(r.writes.idioma).toEqual({ id: 'i1', patch: { niveles_cefr: B } })
    expect(r.content.competencias_linguisticas.otras_lenguas[1]).toMatchObject({ niveles: B, niveles_confirmados: true })
  })

  it('rejects non-CEFR values and languages without a general level', () => {
    expect(edit({ op: 'cefr', id: 'i1', niveles: { ...B, expresion_escrita: 'Avanzado' } }, withLangs()).ok).toBe(false)
    expect(edit({ op: 'cefr', id: 'i1', niveles: { ...B, expresion_escrita: 'Nativo' } }, withLangs()).ok).toBe(false)
    expect(edit({ op: 'cefr', id: 'i2', niveles: B }, withLangs()).ok).toBe(false)
    expect(edit({ op: 'cefr', id: 'nope', niveles: B }, withLangs()).ok).toBe(false)
  })

  it('a general level pre-fills the 5 cells unconfirmed; "Nativo" moves it to mother tongues', () => {
    const r = ok(edit({ op: 'nivel_idioma', id: 'i2', nivel: 'B1' }, withLangs()))
    expect(r.writes.idioma).toEqual({ id: 'i2', patch: { nivel_cefr: 'B1', niveles_cefr: null } })
    expect(r.content.competencias_linguisticas.otras_lenguas[2]).toMatchObject({ niveles_confirmados: false, niveles: { comprension_auditiva: 'B1', expresion_escrita: 'B1' } })
    const n = ok(edit({ op: 'nivel_idioma', id: 'i2', nivel: 'Nativo' }, withLangs()))
    expect(n.content.competencias_linguisticas.lenguas_maternas).toEqual(['Español', 'Italiano'])
    expect(n.content.competencias_linguisticas.otras_lenguas.map(l => l.idioma)).toEqual(['Francés', 'Inglés'])
    expect(edit({ op: 'nivel_idioma', id: 'i2', nivel: 'Intermedio' }, withLangs()).ok).toBe(false)
  })
})
