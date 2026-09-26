// Europass editor operations (step 5a). Pure: given the stored CV content and one edit,
// returns the new content plus the profile writes to run — or a user-facing error. The API
// route (app/api/cv/[id]/europass) only authenticates, loads, runs the writes and saves.
//
// Rules enforced here (spec §3, §5.1, changes 24–27):
// - closed enums are validated (ISCED 0–8, licence categories, DigComp levels, presets);
// - a slot is only switched on when it has data — an empty section can never be "on";
// - per-item fields (city of each job, ISCED of each study…) have ONE switch per section;
// - identity values are never written into the CV (only the switch) — they go encrypted;
// - whatever is entered is also saved to the profile so the next CVs bring it.

import type { IdentityData, IdentityField } from '@/lib/identity'
import { validateIdentityValue, IDENTITY_FIELDS } from '@/lib/identity'
import { EUROPASS_DENSITIES, EUROPASS_PHOTO_SIZES, type EuropassDensity, type EuropassPhotoSize } from './contract'
import { DIGCOMP_LEVELS, DRIVING_LICENCE_CATEGORIES } from './format'
import { isValidHexColor } from '@/lib/cv/visual-config'
import { CEFR_LEVELS, CEFR_SKILLS, isCefrBreakdown, type CefrBreakdown } from '@/lib/cefr'
import { applyEuropassTextEdit, isEuropassEditablePath } from './edit'
import { DIGCOMP_AREAS, type DigCompArea, type DigCompNivel, type EuropassContent, type PerfilTipo } from './schema'

const ADICIONAL_LISTS = ['publicaciones', 'ponencias', 'voluntariado', 'premios_becas', 'afiliaciones'] as const
type AdicionalList = typeof ADICIONAL_LISTS[number]
const ADICIONAL_ALL = ['logros_destacados', ...ADICIONAL_LISTS] as const

export const EUROPASS_SLOTS = [
  'foto', ...IDENTITY_FIELDS, 'linkedin', 'orcid', 'researchgate',
  'experiencia.lugar', 'experiencia.sector_nace',
  'educacion.nivel_isced', 'educacion.lugar', 'educacion.materias',
  'idiomas', 'idiomas.certificacion',
  'digcomp', 'permiso_conducir', 'informacion_adicional',
  ...ADICIONAL_ALL.map(k => `adicional.${k}` as const),
  'anexos',
] as const
export type EuropassSlot = typeof EUROPASS_SLOTS[number]

export type EuropassEditOp =
  | { op: 'activar'; slot: EuropassSlot; activo: boolean }
  | { op: 'identidad'; campo: IdentityField; valor: string }
  | { op: 'perfil_url'; tipo: PerfilTipo; valor: string }
  | { op: 'lista'; campo: AdicionalList | 'anexos'; valor: string[] }
  | { op: 'permiso'; valor: string[] }
  | { op: 'digcomp'; valor: Partial<Record<DigCompArea, DigCompNivel | null>> }
  | { op: 'item'; seccion: 'experiencia'; id: string; campo: 'lugar'; valor: { ciudad: string; pais: string } }
  | { op: 'item'; seccion: 'experiencia'; id: string; campo: 'sector_nace'; valor: string }
  | { op: 'item'; seccion: 'educacion'; id: string; campo: 'lugar'; valor: { ciudad: string; pais: string } }
  | { op: 'item'; seccion: 'educacion'; id: string; campo: 'nivel_isced'; valor: number | null }
  | { op: 'item'; seccion: 'educacion'; id: string; campo: 'materias'; valor: string }
  | { op: 'item'; seccion: 'idioma'; id: string; campo: 'certificacion'; valor: string }
  | { op: 'texto'; ruta: string; valor: string }
  // CEFR capsule (spec §7.3, change 29): adjusting any cell or "Confirmar" confirms the breakdown.
  | { op: 'cefr'; id: string; niveles: CefrBreakdown }
  // A language with no level yet gets its general level (pre-fills the 5 cells, unconfirmed).
  | { op: 'nivel_idioma'; id: string; nivel: string }
  | { op: 'visual'; densidad?: EuropassDensity; foto_tam?: EuropassPhotoSize; accent_color?: string | null }

export interface EuropassWrites {
  profile?: Record<string, unknown>
  experiencia?: { id: string; patch: Record<string, unknown> }
  educacion?: { id: string; patch: Record<string, unknown> }
  idioma?: { id: string; patch: Record<string, unknown> }
  identidad?: { campo: IdentityField; valor: string } // '' clears
  // accent_color null = back to the style's default color.
  visual?: { densidad?: EuropassDensity; foto_tam?: EuropassPhotoSize; accent_color?: string | null }
}

export type EditResult =
  | { ok: true; content: EuropassContent; writes: EuropassWrites; vacio?: boolean }
  | { ok: false; error: string }

export interface EditContext {
  identity: IdentityData
  // Current profile photo (may have been uploaded after the CV was generated).
  fotoUrl: string | null
}

const fail = (error: string): EditResult => ({ ok: false, error })
const text = (v: unknown, max: number): string | null => {
  if (typeof v !== 'string') return null
  const t = v.replace(/\s+/g, ' ').trim()
  return t.length <= max ? t : null
}
const place = (ciudad: string, pais: string) => [ciudad, pais].filter(Boolean).join(', ') || null
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)

const URL_HOSTS: Record<PerfilTipo, RegExp> = {
  linkedin: /^(www\.)?([a-z]{2}\.)?linkedin\.com$/i,
  orcid: /^(www\.)?orcid\.org$/i,
  researchgate: /^(www\.)?researchgate\.net$/i,
}
const PROFILE_URL_COLUMN: Record<PerfilTipo, string> = { linkedin: 'linkedin_url', orcid: 'orcid_url', researchgate: 'researchgate_url' }

function validateProfileUrl(tipo: PerfilTipo, raw: unknown): { ok: true; value: string } | { ok: false; error: string } {
  const t = text(raw, 300)
  if (t === null) return { ok: false, error: 'Enlace inválido.' }
  if (!t) return { ok: true, value: '' }
  let url: URL
  try { url = new URL(/^https?:\/\//i.test(t) ? t : `https://${t}`) } catch { return { ok: false, error: 'Enlace inválido.' } }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return { ok: false, error: 'Enlace inválido.' }
  if (!URL_HOSTS[tipo].test(url.hostname) || url.pathname.length < 2) {
    return { ok: false, error: `El enlace debe ser de ${tipo === 'linkedin' ? 'linkedin.com' : tipo === 'orcid' ? 'orcid.org' : 'researchgate.net'}.` }
  }
  url.protocol = 'https:'
  return { ok: true, value: url.toString() }
}

function cleanList(raw: unknown, maxItems: number, maxLen: number): string[] | null {
  if (!Array.isArray(raw) || raw.length > maxItems) return null
  const out: string[] = []
  for (const v of raw) {
    const t = text(v, maxLen)
    if (t === null) return null
    if (t) out.push(t)
  }
  return out
}

// Does the slot have anything to show? (Rule: a slot is only "on" with data.)
function hasData(c: EuropassContent, slot: EuropassSlot, ctx: EditContext): boolean {
  const ip = c.informacion_personal
  switch (slot) {
    case 'foto': return !!ctx.fotoUrl
    case 'fecha_nacimiento': case 'nacionalidad': case 'direccion': return !!ctx.identity[slot]
    case 'linkedin': case 'orcid': case 'researchgate': return ip.perfiles.some(p => p.tipo === slot && p.url)
    case 'experiencia.lugar': return c.experiencia_laboral.some(e => e.lugar.valor)
    case 'experiencia.sector_nace': return c.experiencia_laboral.some(e => e.sector_nace.valor)
    case 'educacion.nivel_isced': return c.educacion_formacion.some(e => e.nivel_isced.valor !== null)
    case 'educacion.lugar': return c.educacion_formacion.some(e => e.lugar.valor)
    case 'educacion.materias': return c.educacion_formacion.some(e => e.materias.valor)
    case 'idiomas': return c.competencias_linguisticas.lenguas_maternas.length + c.competencias_linguisticas.otras_lenguas.length > 0
    case 'idiomas.certificacion': return c.competencias_linguisticas.otras_lenguas.some(l => l.certificacion.valor)
    case 'digcomp': return DIGCOMP_AREAS.every(a => c.competencias_digitales.digcomp[a] !== null)
    case 'permiso_conducir': return c.permiso_conducir.categorias.length > 0
    case 'informacion_adicional': return ADICIONAL_ALL.some(k => c.informacion_adicional[k].items.length > 0)
    case 'anexos': return c.anexos.items.length > 0
    default: return c.informacion_adicional[slot.slice('adicional.'.length) as typeof ADICIONAL_ALL[number]].items.length > 0
  }
}

function setSlot(c: EuropassContent, slot: EuropassSlot, activo: boolean, ctx: EditContext): EuropassContent {
  const ip = c.informacion_personal
  const each = <T,>(xs: T[], f: (x: T) => T) => xs.map(f)
  switch (slot) {
    case 'foto': return { ...c, informacion_personal: { ...ip, foto: { activo, url: ctx.fotoUrl } } }
    case 'fecha_nacimiento': case 'nacionalidad': case 'direccion':
      return { ...c, informacion_personal: { ...ip, [slot]: { activo, valor: null } } }
    case 'linkedin': case 'orcid': case 'researchgate':
      return { ...c, informacion_personal: { ...ip, perfiles: ip.perfiles.map(p => p.tipo === slot ? { ...p, activo } : p) } }
    case 'experiencia.lugar': return { ...c, experiencia_laboral: each(c.experiencia_laboral, e => ({ ...e, lugar: { ...e.lugar, activo } })) }
    case 'experiencia.sector_nace': return { ...c, experiencia_laboral: each(c.experiencia_laboral, e => ({ ...e, sector_nace: { ...e.sector_nace, activo } })) }
    case 'educacion.nivel_isced': return { ...c, educacion_formacion: each(c.educacion_formacion, e => ({ ...e, nivel_isced: { ...e.nivel_isced, activo } })) }
    case 'educacion.lugar': return { ...c, educacion_formacion: each(c.educacion_formacion, e => ({ ...e, lugar: { ...e.lugar, activo } })) }
    case 'educacion.materias': return { ...c, educacion_formacion: each(c.educacion_formacion, e => ({ ...e, materias: { ...e.materias, activo } })) }
    case 'idiomas': return { ...c, competencias_linguisticas: { ...c.competencias_linguisticas, activo } }
    case 'idiomas.certificacion':
      return { ...c, competencias_linguisticas: { ...c.competencias_linguisticas, otras_lenguas: each(c.competencias_linguisticas.otras_lenguas, l => ({ ...l, certificacion: { ...l.certificacion, activo } })) } }
    case 'digcomp': return { ...c, competencias_digitales: { ...c.competencias_digitales, digcomp: { ...c.competencias_digitales.digcomp, activo } } }
    case 'permiso_conducir': return { ...c, permiso_conducir: { ...c.permiso_conducir, activo } }
    case 'informacion_adicional': return { ...c, informacion_adicional: { ...c.informacion_adicional, activo } }
    case 'anexos': return { ...c, anexos: { ...c.anexos, activo } }
    default: {
      const k = slot.slice('adicional.'.length) as typeof ADICIONAL_ALL[number]
      return { ...c, informacion_adicional: { ...c.informacion_adicional, [k]: { ...c.informacion_adicional[k], activo } } }
    }
  }
}

// After a value changes: the slot is on exactly when it has data.
function sync(c: EuropassContent, slot: EuropassSlot, ctx: EditContext): EuropassContent {
  const next = setSlot(c, slot, hasData(c, slot, ctx), ctx)
  // The "Información adicional" section follows its sub-groups.
  if (slot.startsWith('adicional.')) return setSlot(next, 'informacion_adicional', hasData(next, 'informacion_adicional', ctx), ctx)
  return next
}

export function applyEuropassEdit(content: EuropassContent, raw: unknown, ctx: EditContext): EditResult {
  if (!isObj(raw) || typeof raw.op !== 'string') return fail('Operación inválida.')
  const op = raw as Record<string, unknown>

  switch (op.op) {
    case 'activar': {
      if (!(EUROPASS_SLOTS as readonly unknown[]).includes(op.slot) || typeof op.activo !== 'boolean') return fail('Operación inválida.')
      const slot = op.slot as EuropassSlot
      if (!op.activo) return { ok: true, content: setSlot(content, slot, false, ctx), writes: {} }
      // Switching on an empty slot changes nothing: the panel shows its input and the slot
      // turns on when a value is saved (an empty section is never "on").
      if (!hasData(content, slot, ctx)) return { ok: true, content, writes: {}, vacio: true }
      const next = setSlot(content, slot, true, ctx)
      return { ok: true, content: slot.startsWith('adicional.') ? setSlot(next, 'informacion_adicional', true, ctx) : next, writes: {} }
    }

    case 'identidad': {
      if (!(IDENTITY_FIELDS as readonly unknown[]).includes(op.campo)) return fail('Operación inválida.')
      const campo = op.campo as IdentityField
      const v = validateIdentityValue(campo, op.valor)
      if (!v.ok) return fail(v.error)
      const identity = { ...ctx.identity, [campo]: v.value || undefined }
      return { ok: true, content: sync(content, campo, { ...ctx, identity }), writes: { identidad: { campo, valor: v.value } } }
    }

    case 'perfil_url': {
      if (op.tipo !== 'linkedin' && op.tipo !== 'orcid' && op.tipo !== 'researchgate') return fail('Operación inválida.')
      const tipo = op.tipo as PerfilTipo
      const v = validateProfileUrl(tipo, op.valor)
      if (!v.ok) return fail(v.error)
      const ip = content.informacion_personal
      const others = ip.perfiles.filter(p => p.tipo !== tipo)
      // Keep the fixed order linkedin · orcid · researchgate.
      const perfiles = (['linkedin', 'orcid', 'researchgate'] as const).flatMap(t =>
        t === tipo ? (v.value ? [{ tipo, url: v.value, activo: true }] : []) : others.filter(p => p.tipo === t))
      return {
        ok: true,
        content: { ...content, informacion_personal: { ...ip, perfiles } },
        writes: { profile: { [PROFILE_URL_COLUMN[tipo]]: v.value || null } },
      }
    }

    case 'lista': {
      const campo = op.campo
      const isAnexos = campo === 'anexos'
      if (!isAnexos && !(ADICIONAL_LISTS as readonly unknown[]).includes(campo)) return fail('Operación inválida.')
      const items = cleanList(op.valor, 20, 300)
      if (!items) return fail('Revisa la lista: máximo 20 elementos de hasta 300 caracteres.')
      const writes = { profile: { [campo as string]: items } }
      if (isAnexos) return { ok: true, content: sync({ ...content, anexos: { ...content.anexos, items } }, 'anexos', ctx), writes }
      const k = campo as AdicionalList
      const next = { ...content, informacion_adicional: { ...content.informacion_adicional, [k]: { ...content.informacion_adicional[k], items } } }
      return { ok: true, content: sync(next, `adicional.${k}`, ctx), writes }
    }

    case 'permiso': {
      if (!Array.isArray(op.valor) || !op.valor.every(c => (DRIVING_LICENCE_CATEGORIES as readonly unknown[]).includes(c))) return fail('Categoría de permiso inválida.')
      const categorias = DRIVING_LICENCE_CATEGORIES.filter(c => (op.valor as unknown[]).includes(c))
      const next = { ...content, permiso_conducir: { ...content.permiso_conducir, categorias } }
      return { ok: true, content: sync(next, 'permiso_conducir', ctx), writes: { profile: { permiso_conducir: categorias } } }
    }

    case 'digcomp': {
      if (!isObj(op.valor)) return fail('Operación inválida.')
      const src = op.valor
      const levels: Record<string, DigCompNivel | null> = {}
      for (const a of DIGCOMP_AREAS) {
        const v = src[a] ?? content.competencias_digitales.digcomp[a]
        if (v !== null && !(DIGCOMP_LEVELS as unknown[]).includes(v)) return fail('Nivel DigComp inválido.')
        levels[a] = v as DigCompNivel | null
      }
      const next = { ...content, competencias_digitales: { ...content.competencias_digitales, digcomp: { ...content.competencias_digitales.digcomp, ...levels } } }
      // Shown only when all five areas have a level the user chose (never partially).
      return { ok: true, content: sync(next, 'digcomp', ctx), writes: { profile: { digcomp: levels } } }
    }

    case 'item': return applyItemEdit(content, op, ctx)

    case 'cefr': {
      const lenguas = content.competencias_linguisticas.otras_lenguas
      const idx = typeof op.id === 'string' ? lenguas.findIndex(l => l._id === op.id) : -1
      if (idx < 0) return fail('Ese idioma no está en este CV.')
      if (!lenguas[idx].niveles) return fail('Primero indica el nivel general de este idioma.')
      if (!isCefrBreakdown(op.niveles)) return fail('Nivel MCER inválido.')
      const niveles = Object.fromEntries(CEFR_SKILLS.map(s => [s, (op.niveles as CefrBreakdown)[s]])) as CefrBreakdown
      const next = {
        ...content,
        competencias_linguisticas: {
          ...content.competencias_linguisticas,
          otras_lenguas: lenguas.map((l, i) => i === idx ? { ...l, niveles, niveles_confirmados: true } : l),
        },
      }
      return { ok: true, content: next, writes: { idioma: { id: op.id as string, patch: { niveles_cefr: niveles } } } }
    }

    case 'nivel_idioma': {
      const cl = content.competencias_linguisticas
      const idx = typeof op.id === 'string' ? cl.otras_lenguas.findIndex(l => l._id === op.id) : -1
      if (idx < 0) return fail('Ese idioma no está en este CV.')
      if (!(CEFR_LEVELS as readonly unknown[]).includes(op.nivel)) return fail('Nivel MCER inválido.')
      const nivel = op.nivel as typeof CEFR_LEVELS[number]
      const lengua = cl.otras_lenguas[idx]
      const writes = { idioma: { id: op.id as string, patch: { nivel_cefr: nivel, niveles_cefr: null } } }
      if (nivel === 'Nativo') {
        return { ok: true, writes, content: { ...content, competencias_linguisticas: {
          lenguas_maternas: [...cl.lenguas_maternas, lengua.idioma],
          otras_lenguas: cl.otras_lenguas.filter((_, i) => i !== idx),
        } } }
      }
      const niveles = Object.fromEntries(CEFR_SKILLS.map(s => [s, nivel])) as CefrBreakdown
      return { ok: true, writes, content: { ...content, competencias_linguisticas: {
        ...cl,
        otras_lenguas: cl.otras_lenguas.map((l, i) => i === idx ? { ...l, niveles, niveles_confirmados: false } : l),
      } } }
    }

    case 'texto': {
      if (typeof op.ruta !== 'string' || !isEuropassEditablePath(op.ruta) || typeof op.valor !== 'string' || op.valor.length > 2000) return fail('Operación inválida.')
      return { ok: true, content: applyEuropassTextEdit(content, op.ruta, op.valor), writes: {} }
    }

    case 'visual': {
      const visual: EuropassWrites['visual'] = {}
      if (op.densidad !== undefined) {
        if (typeof op.densidad !== 'string' || !Object.prototype.hasOwnProperty.call(EUROPASS_DENSITIES, op.densidad)) return fail('Densidad inválida.')
        visual.densidad = op.densidad as EuropassDensity
      }
      if (op.foto_tam !== undefined) {
        if (typeof op.foto_tam !== 'string' || !Object.prototype.hasOwnProperty.call(EUROPASS_PHOTO_SIZES, op.foto_tam)) return fail('Tamaño de foto inválido.')
        visual.foto_tam = op.foto_tam as EuropassPhotoSize
      }
      if (op.accent_color !== undefined) {
        if (op.accent_color !== null && !isValidHexColor(op.accent_color)) return fail('Color inválido.')
        visual.accent_color = op.accent_color === null ? null : (op.accent_color as string).toUpperCase()
      }
      if (Object.keys(visual).length === 0) return fail('Operación inválida.')
      return { ok: true, content, writes: { visual } }
    }

    default: return fail('Operación inválida.')
  }
}

function lugarValue(v: unknown): { ciudad: string; pais: string } | null {
  if (!isObj(v)) return null
  const ciudad = text(v.ciudad ?? '', 80), pais = text(v.pais ?? '', 80)
  return ciudad === null || pais === null ? null : { ciudad, pais }
}

function applyItemEdit(content: EuropassContent, op: Record<string, unknown>, ctx: EditContext): EditResult {
  if (typeof op.id !== 'string' || !op.id) return fail('Operación inválida.')
  const id = op.id

  if (op.seccion === 'experiencia') {
    const idx = content.experiencia_laboral.findIndex(e => e._id === id)
    if (idx < 0) return fail('Ese puesto no está en este CV.')
    let patch: Record<string, unknown>, slot: EuropassSlot, update: (e: EuropassContent['experiencia_laboral'][number]) => typeof e
    if (op.campo === 'lugar') {
      const v = lugarValue(op.valor); if (!v) return fail('Revisa la ciudad y el país.')
      patch = { ciudad: v.ciudad || null, pais: v.pais || null }; slot = 'experiencia.lugar'
      update = e => ({ ...e, lugar: { ...e.lugar, valor: place(v.ciudad, v.pais) } })
    } else if (op.campo === 'sector_nace') {
      const v = text(op.valor, 120); if (v === null) return fail('El texto es demasiado largo.')
      patch = { sector_nace: v || null }; slot = 'experiencia.sector_nace'
      update = e => ({ ...e, sector_nace: { ...e.sector_nace, valor: v || null } })
    } else return fail('Operación inválida.')
    const next = { ...content, experiencia_laboral: content.experiencia_laboral.map((e, i) => i === idx ? update(e) : e) }
    return { ok: true, content: sync(next, slot, ctx), writes: { experiencia: { id, patch } } }
  }

  if (op.seccion === 'educacion') {
    const idx = content.educacion_formacion.findIndex(e => e._id === id && e.origen === 'educacion')
    if (idx < 0) return fail('Ese estudio no está en este CV.')
    let patch: Record<string, unknown>, slot: EuropassSlot, update: (e: EuropassContent['educacion_formacion'][number]) => typeof e
    if (op.campo === 'lugar') {
      const v = lugarValue(op.valor); if (!v) return fail('Revisa la ciudad y el país.')
      patch = { ciudad: v.ciudad || null, pais: v.pais || null }; slot = 'educacion.lugar'
      update = e => ({ ...e, lugar: { ...e.lugar, valor: place(v.ciudad, v.pais) } })
    } else if (op.campo === 'nivel_isced') {
      const v = op.valor
      if (v !== null && !(Number.isInteger(v) && (v as number) >= 0 && (v as number) <= 8)) return fail('Nivel CINE/ISCED inválido.')
      patch = { nivel_isced: v }; slot = 'educacion.nivel_isced'
      update = e => ({ ...e, nivel_isced: { ...e.nivel_isced, valor: v as number | null } })
    } else if (op.campo === 'materias') {
      const v = text(op.valor, 300); if (v === null) return fail('El texto es demasiado largo.')
      patch = { materias: v || null }; slot = 'educacion.materias'
      update = e => ({ ...e, materias: { ...e.materias, valor: v || null } })
    } else return fail('Operación inválida.')
    const next = { ...content, educacion_formacion: content.educacion_formacion.map((e, i) => i === idx ? update(e) : e) }
    return { ok: true, content: sync(next, slot, ctx), writes: { educacion: { id, patch } } }
  }

  if (op.seccion === 'idioma' && op.campo === 'certificacion') {
    const lenguas = content.competencias_linguisticas.otras_lenguas
    const idx = lenguas.findIndex(l => l._id === id)
    if (idx < 0) return fail('Ese idioma no está en este CV.')
    const v = text(op.valor, 120); if (v === null) return fail('El texto es demasiado largo.')
    const next = {
      ...content,
      competencias_linguisticas: {
        ...content.competencias_linguisticas,
        otras_lenguas: lenguas.map((l, i) => i === idx ? { ...l, certificacion: { ...l.certificacion, valor: v || null } } : l),
      },
    }
    return { ok: true, content: sync(next, 'idiomas.certificacion', ctx), writes: { idioma: { id, patch: { certificacion: v || null } } } }
  }

  return fail('Operación inválida.')
}
