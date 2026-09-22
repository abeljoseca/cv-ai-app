import { SupabaseClient } from '@supabase/supabase-js'
import { CVUserData, CVExperiencia, CVEducacion, CVIdioma } from '../types/user-data'

function normalizeDateEnd(fechaFin: string | null, activo: boolean): string {
  if (activo || !fechaFin || fechaFin.trim() === '') return 'Presente'
  return fechaFin
}

export async function prepareUserData(
  userId: string,
  supabase: SupabaseClient
): Promise<CVUserData> {
  const [
    { data: profile },
    { data: rawExperiencias },
    { data: rawEducaciones },
    { data: rawHabilidades },
    { data: rawIdiomas },
    { data: rawLogros },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase
      .from('experiencia')
      .select('empresa, cargo, fecha_inicio, fecha_fin, descripcion, activo')
      .eq('user_id', userId)
      .order('fecha_inicio', { ascending: false }),
    supabase
      .from('educacion')
      .select('institucion, titulo, area, fecha_inicio, fecha_fin')
      .eq('user_id', userId)
      .order('fecha_inicio', { ascending: false }),
    supabase.from('habilidades').select('nombre, tipo').eq('user_id', userId),
    supabase.from('idiomas').select('nombre, nivel').eq('user_id', userId),
    supabase.from('logros').select('descripcion').eq('user_id', userId),
  ])

  if (!profile) throw new Error('Profile not found for user: ' + userId)

  const ubicacion = [profile.ciudad, profile.pais]
    .filter(Boolean)
    .join(', ') || null

  const experiencias: CVExperiencia[] = (rawExperiencias || []).map(e => ({
    empresa: e.empresa,
    cargo: e.cargo,
    fecha_inicio: e.fecha_inicio || '',
    fecha_fin: normalizeDateEnd(e.fecha_fin, e.activo),
    descripcion: e.descripcion || null,
  }))

  const educaciones: CVEducacion[] = (rawEducaciones || []).map(e => ({
    institucion: e.institucion,
    titulo: e.titulo,
    area: e.area || null,
    fecha_inicio: e.fecha_inicio || null,
    fecha_fin: e.fecha_fin || null,
  }))

  const idiomas: CVIdioma[] = (rawIdiomas || []).map(i => ({
    nombre: i.nombre,
    nivel: i.nivel || null,
  }))

  const habilidades: string[] = (rawHabilidades || []).map(h => h.nombre)
  const habilidadesTipos: Record<string, 'tecnica' | 'blanda'> = {}
  for (const h of rawHabilidades || []) {
    if (h.tipo === 'tecnica' || h.tipo === 'blanda') {
      habilidadesTipos[h.nombre.toLowerCase().trim()] = h.tipo
    }
  }
  const logros: string[] = (rawLogros || []).map(l => l.descripcion)

  const resumen = profile.resumen_profesional || null
  const hasResumen = !!resumen && resumen.trim().split(/\s+/).length >= 15

  return {
    nombre: `${profile.nombre || ''} ${profile.apellido || ''}`.trim(),
    profesion_perfil: profile.profesion_perfil || null,
    email: profile.email_cv || '',
    telefono: profile.telefono || null,
    ubicacion,
    foto_url: profile.foto_url || null,
    resumen_profesional: resumen,
    experiencias,
    educaciones,
    habilidades,
    habilidadesTipos,
    idiomas,
    logros,
    hasExperience: experiencias.length > 0,
    hasEducation: educaciones.length > 0,
    hasHabilidades: habilidades.length > 0,
    hasIdiomas: idiomas.length > 0,
    hasLogros: logros.length > 0,
    hasResumen,
    hasFoto: !!profile.foto_url,
  }
}
