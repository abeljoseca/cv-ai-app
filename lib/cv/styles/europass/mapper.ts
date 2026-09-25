// Profile → Europass objective content, with NO AI involved (spec §4: everything except
// "Sobre mí" and the experience bullets is placed by code). Also returns the source texts
// the AI step may write from, each with a stable reference for source tracing.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Certificacion, Educacion, Experiencia, Habilidad, Idioma, Logro, Profile } from '@/types'
import { formatPhone } from '@/lib/format-phone'
import { normalizeProfileDate } from '@/lib/profile-date'
import { isCefrBreakdown, CEFR_SKILLS, type CefrBreakdown } from '@/lib/cefr'
import { splitSkills, type SkillTipo } from '@/lib/skill-classification'
import { DIGCOMP_AREAS, EUROPASS_SCHEMA, type DigCompNivel, type EuropassAISources, type EuropassContent, type EuropassIdioma, type ToggleList } from './schema'
import { DIGCOMP_LEVELS, DRIVING_LICENCE_CATEGORIES, formatBirthDate, formatEuropassDate } from './format'

export interface EuropassProfileSource {
  profile: Profile
  experiencias: Experiencia[]
  educaciones: Educacion[]
  idiomas: Idioma[]
  logros: Logro[]
  habilidades: Habilidad[]
  // Listed as items of "Educación y formación" (CEO decision 2026-09-25).
  certificaciones: Certificacion[]
}

export async function loadEuropassSource(supabase: SupabaseClient, userId: string): Promise<EuropassProfileSource> {
  const [p, exp, edu, idi, log, hab, cert] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('experiencia').select('*').eq('user_id', userId),
    supabase.from('educacion').select('*').eq('user_id', userId),
    supabase.from('idiomas').select('*').eq('user_id', userId),
    supabase.from('logros').select('*').eq('user_id', userId),
    supabase.from('habilidades').select('*').eq('user_id', userId),
    supabase.from('certificaciones').select('*').eq('user_id', userId),
  ])
  if (!p.data) throw new Error('Profile not found for user: ' + userId)
  return {
    profile: p.data as Profile,
    experiencias: (exp.data ?? []) as Experiencia[],
    educaciones: (edu.data ?? []) as Educacion[],
    idiomas: (idi.data ?? []) as Idioma[],
    logros: (log.data ?? []) as Logro[],
    habilidades: (hab.data ?? []) as Habilidad[],
    certificaciones: (cert.data ?? []) as Certificacion[],
  }
}

const clean = (v: string | null | undefined): string | null => (v && v.trim() ? v.trim() : null)
const toggle = <T,>(valor: T | null) => ({ activo: valor !== null, valor })
const list = (items: string[] | null | undefined): ToggleList => {
  const xs = (items ?? []).map(s => s.trim()).filter(Boolean)
  return { activo: xs.length > 0, items: xs }
}
const place = (...parts: Array<string | null | undefined>) => clean(parts.map(clean).filter(Boolean).join(', '))

// Reverse chronological ('AAAA' / 'AAAA-MM' sort as strings); undated last.
function dateDesc(a: string | null, b: string | null): number {
  if (!a) return b ? 1 : 0
  if (!b) return -1
  return b.localeCompare(a)
}
const byStartDesc = <T extends { fecha_inicio: string | null }>(a: T, b: T) => dateDesc(a.fecha_inicio, b.fecha_inicio)

// Placeholder the LinkedIn import stores when the issuer is unknown — never printed.
const PLACEHOLDER_INSTITUCION = 'sin institución'

function mapIdioma(i: Idioma): EuropassIdioma {
  const level = i.nivel_cefr
  let niveles: CefrBreakdown | null = null
  let confirmados = false
  if (level && level !== 'Nativo') {
    if (isCefrBreakdown(i.niveles_cefr)) {
      niveles = i.niveles_cefr
      confirmados = true
    } else {
      // Pre-filled from the level the user declared (spec §7.3); marked unconfirmed.
      niveles = Object.fromEntries(CEFR_SKILLS.map(s => [s, level])) as CefrBreakdown
    }
  }
  return { idioma: i.nombre, niveles, niveles_confirmados: confirmados, certificacion: toggle(clean(i.certificacion)) }
}

function mapDigComp(raw: unknown): EuropassContent['competencias_digitales']['digcomp'] {
  const src = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw as Record<string, unknown> : {}
  const valid = (v: unknown): DigCompNivel | null => (DIGCOMP_LEVELS as unknown[]).includes(v) ? v as DigCompNivel : null
  const areas = Object.fromEntries(DIGCOMP_AREAS.map(a => [a, valid(src[a])])) as Record<(typeof DIGCOMP_AREAS)[number], DigCompNivel | null>
  // Shown only when every area has a level the user chose — never partially invented.
  return { activo: DIGCOMP_AREAS.every(a => areas[a] !== null), ...areas }
}

// "03/2021 – actualidad" (or null when the profile has no dates for the job).
function jobPeriod(e: Experiencia): string | null {
  const start = formatEuropassDate(e.fecha_inicio)
  const end = e.activo ? 'actualidad' : formatEuropassDate(e.fecha_fin)
  return start || end ? `${start ?? '—'} – ${end ?? '—'}` : null
}

// Whole years between the earliest start and the latest end (today for current jobs).
// Computed by code so the AI quotes a number instead of calculating one.
function yearsOfExperienceFact(exps: Experiencia[], now = new Date()): EuropassAISources['hechos'] {
  const toMonths = (v: string | null) => {
    const m = v?.match(/^(\d{4})(?:-(\d{2}))?$/)
    return m ? +m[1] * 12 + (m[2] ? +m[2] - 1 : 0) : null
  }
  const starts = exps.map(e => toMonths(e.fecha_inicio)).filter((x): x is number => x !== null)
  const nowMonths = now.getFullYear() * 12 + now.getMonth()
  const ends = exps.map(e => (e.activo ? nowMonths : toMonths(e.fecha_fin))).filter((x): x is number => x !== null)
  if (starts.length === 0 || ends.length === 0) return []
  const years = Math.floor((Math.max(...ends) - Math.min(...starts)) / 12)
  return years >= 1
    ? [{ ref: 'calc:anios_experiencia', texto: `Años de experiencia profesional (calculado de las fechas del perfil): ${years}` }]
    : []
}

export function mapEuropassObjective(
  src: EuropassProfileSource,
  opts: { tituloProfesional?: string | null } = {},
): { content: EuropassContent; aiSources: EuropassAISources } {
  const { profile } = src
  const experiencias = [...src.experiencias].sort(byStartDesc)
  // Studies and certifications share the section, ordered by start date (end date for
  // certifications, which only have a year).
  const formacion = [
    ...src.educaciones.map(e => ({ kind: 'educacion' as const, key: e.fecha_inicio ?? e.fecha_fin, e })),
    ...src.certificaciones.map(c => ({ kind: 'certificacion' as const, key: normalizeProfileDate(c.anio_egreso), c })),
  ].sort((a, b) => dateDesc(a.key, b.key))

  const expIds = new Set(experiencias.map(e => e.id))
  const linkedLogros = (expId: string) => src.logros.filter(l => l.experiencia_id === expId && clean(l.descripcion))
  const unlinkedLogros = src.logros.filter(l => (!l.experiencia_id || !expIds.has(l.experiencia_id)) && clean(l.descripcion))

  const tipos: Record<string, SkillTipo> = {}
  for (const h of src.habilidades) if (h.tipo === 'tecnica' || h.tipo === 'blanda') tipos[h.nombre.toLowerCase().trim()] = h.tipo
  const { tecnicas, blandas } = splitSkills(src.habilidades.map(h => h.nombre), tipos)

  const perfiles: EuropassContent['informacion_personal']['perfiles'] = []
  for (const [tipo, url] of [['linkedin', profile.linkedin_url], ['orcid', profile.orcid_url], ['researchgate', profile.researchgate_url]] as const) {
    const u = clean(url)
    if (u) perfiles.push({ tipo, url: u, activo: true })
  }

  const extra = {
    logros_destacados: list(unlinkedLogros.map(l => l.descripcion)),
    publicaciones: list(profile.publicaciones),
    ponencias: list(profile.ponencias),
    voluntariado: list(profile.voluntariado),
    premios_becas: list(profile.premios_becas),
    afiliaciones: list(profile.afiliaciones),
  }

  const categorias = (profile.permiso_conducir ?? []).filter(c => (DRIVING_LICENCE_CATEGORIES as readonly string[]).includes(c))
  const idiomasConNombre = src.idiomas.filter(i => clean(i.nombre))

  const content: EuropassContent = {
    schema: EUROPASS_SCHEMA,
    informacion_personal: {
      nombre_completo: [profile.nombre, profile.apellido].map(clean).filter(Boolean).join(' '),
      titulo_profesional: clean(opts.tituloProfesional) ?? clean(profile.profesion_perfil),
      telefono: clean(profile.telefono) ? formatPhone(profile.telefono) : null,
      email: clean(profile.email_cv),
      ciudad_pais: place(profile.ciudad, profile.pais),
      foto: { activo: !!clean(profile.foto_url), url: clean(profile.foto_url) },
      fecha_nacimiento: toggle(formatBirthDate(profile.fecha_nacimiento)),
      nacionalidad: toggle(clean(profile.nacionalidad)),
      direccion: toggle(clean(profile.direccion)),
      perfiles,
    },
    // Written by the AI step (4b) from aiSources; null until then.
    sobre_mi: { texto: null, _fuentes: [] },
    experiencia_laboral: experiencias.map(e => ({
      _id: e.id,
      cargo: e.cargo,
      empleador: e.empresa,
      fecha_inicio: formatEuropassDate(e.fecha_inicio),
      fecha_fin: e.activo ? 'actualidad' : formatEuropassDate(e.fecha_fin),
      bullets: [],
      lugar: toggle(place(e.ciudad, e.pais)),
      sector_nace: toggle(clean(e.sector_nace)),
    })),
    educacion_formacion: formacion.map(item => item.kind === 'educacion'
      ? {
          _id: item.e.id,
          origen: 'educacion' as const,
          titulo: item.e.titulo,
          institucion: item.e.institucion,
          area: clean(item.e.area),
          fecha_inicio: formatEuropassDate(item.e.fecha_inicio),
          fecha_fin: formatEuropassDate(item.e.fecha_fin),
          nivel_isced: toggle(item.e.nivel_isced != null && item.e.nivel_isced >= 0 && item.e.nivel_isced <= 8 ? item.e.nivel_isced : null),
          lugar: toggle(place(item.e.ciudad, item.e.pais)),
          materias: toggle(clean(item.e.materias)),
        }
      : {
          _id: item.c.id,
          origen: 'certificacion' as const,
          titulo: item.c.titulo,
          institucion: item.c.institucion?.trim().toLowerCase() === PLACEHOLDER_INSTITUCION ? '' : item.c.institucion,
          area: null,
          fecha_inicio: null,
          fecha_fin: formatEuropassDate(item.key),
          nivel_isced: toggle<number>(null),
          lugar: toggle<string>(null),
          materias: toggle<string>(null),
        }),
    competencias_linguisticas: {
      lenguas_maternas: idiomasConNombre.filter(i => i.nivel_cefr === 'Nativo').map(i => i.nombre),
      otras_lenguas: idiomasConNombre.filter(i => i.nivel_cefr !== 'Nativo').map(mapIdioma),
    },
    competencias_digitales: { herramientas: tecnicas, digcomp: mapDigComp(profile.digcomp) },
    otras_competencias: blandas,
    permiso_conducir: { activo: categorias.length > 0, categorias },
    informacion_adicional: { activo: Object.values(extra).some(x => x.activo), ...extra },
    anexos: list(profile.anexos),
  }

  const aiSources: EuropassAISources = {
    hechos: yearsOfExperienceFact(experiencias),
    resumen: clean(profile.resumen_profesional) ? { ref: 'perfil:resumen', texto: profile.resumen_profesional!.trim() } : null,
    experiencias: experiencias.map(e => ({
      ref: `exp:${e.id}`,
      cargo: e.cargo,
      empleador: e.empresa,
      periodo: jobPeriod(e),
      descripcion: clean(e.descripcion) ? { ref: `exp:${e.id}:descripcion`, texto: e.descripcion!.trim() } : null,
      logros: linkedLogros(e.id).map(l => ({ ref: `logro:${l.id}`, texto: l.descripcion.trim() })),
    })),
  }

  return { content, aiSources }
}
