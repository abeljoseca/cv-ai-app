'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { EditorContainer } from '@/src/features/cv-inspiracion/components/editor/EditorContainer'
import { getCVInspiración } from '@/src/features/cv-inspiracion/lib/supabase-cv-service'
import type { CVInspirationRecord } from '@/src/features/cv-inspiracion/types/editor.types'
import type { TemplateDataMarkers } from '@/src/features/cv-inspiracion/types/template.types'

interface Props {
  params: Promise<{ id: string }>
}

export default function InspiracioEditorPage({ params }: Props) {
  const { id } = use(params)
  const router = useRouter()
  const [record, setRecord] = useState<CVInspirationRecord | null>(null)
  const [userData, setUserData] = useState<TemplateDataMarkers>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const [cv, { data: profile }, { data: experiencias }, { data: educacion }, { data: habilidades }, { data: idiomas }, { data: logros }] = await Promise.all([
        getCVInspiración(id),
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('experiencia').select('*').eq('user_id', user.id).order('fecha_inicio', { ascending: false }),
        supabase.from('educacion').select('*').eq('user_id', user.id).order('fecha_inicio', { ascending: false }),
        supabase.from('habilidades').select('nombre, tipo').eq('user_id', user.id),
        supabase.from('idiomas').select('nombre, nivel').eq('user_id', user.id),
        supabase.from('logros').select('descripcion').eq('user_id', user.id),
      ])

      if (!cv) { setError('CV no encontrado.'); setLoading(false); return }
      setRecord(cv)

      if (profile) {
        setUserData(buildUserData(profile, experiencias ?? [], educacion ?? [], habilidades ?? [], idiomas ?? [], logros ?? []))
      }
      setLoading(false)
    }
    load()
  }, [id, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !record) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[var(--color-muted)]">{error ?? 'Ocurrió un error.'}</p>
      </div>
    )
  }

  const sourceTemplateId = typeof window !== 'undefined'
    ? (sessionStorage.getItem('editor_template_source_id') ?? undefined)
    : undefined

  return (
    <EditorContainer
      cvId={id}
      initialState={record.canvas_state}
      userData={userData}
      sourceTemplateId={sourceTemplateId}
    />
  )
}

function fmtDate(date: string | null): string {
  if (!date) return ''
  try {
    return new Date(date).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })
  } catch { return date }
}

function fmtRange(start: string | null, end: string | null): string {
  const s = fmtDate(start)
  const e = end ? fmtDate(end) : 'Presente'
  return s ? `${s} - ${e}` : ''
}

function descLine(descripcion: string | null, index: number): string {
  if (!descripcion) return ''
  const lines = descripcion.split('\n').map(l => l.trim()).filter(Boolean)
  return lines[index] ?? ''
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildUserData(profile: Record<string, any>, experiencias: any[], educacion: any[], habilidades: any[], idiomas: any[], logros: any[]): TemplateDataMarkers {
  const skillsAll      = habilidades
  const skillsTecnica  = habilidades.filter((h: any) => h.tipo === 'tecnica')
  const skillsBlanda   = habilidades.filter((h: any) => h.tipo === 'blanda')
  return {
    USUARIO_NOMBRE:    profile.nombre    ?? '',
    USUARIO_APELLIDO:  profile.apellido  ?? '',
    USUARIO_PROFESION: profile.profesion_perfil ?? '',
    USUARIO_EMAIL:     profile.email_cv  ?? '',
    USUARIO_TELEFONO:  profile.telefono  ?? '',
    USUARIO_CIUDAD:    profile.ciudad    ?? '',
    USUARIO_PAIS:      profile.pais      ?? '',
    USUARIO_FOTO:      profile.foto_url  ?? '',
    USUARIO_RESUMEN:   profile.resumen_profesional ?? '',
    // Education
    USUARIO_EDU1_INSTITUCION: educacion[0]?.institucion ?? '',
    USUARIO_EDU1_TITULO:      educacion[0]?.titulo      ?? '',
    USUARIO_EDU1_FECHAS:      fmtRange(educacion[0]?.fecha_inicio, educacion[0]?.fecha_fin),
    USUARIO_EDU2_INSTITUCION: educacion[1]?.institucion ?? '',
    USUARIO_EDU2_TITULO:      educacion[1]?.titulo      ?? '',
    USUARIO_EDU2_FECHAS:      fmtRange(educacion[1]?.fecha_inicio, educacion[1]?.fecha_fin),
    // Experience 1
    USUARIO_EXP1_EMPRESA:   experiencias[0]?.empresa  ?? '',
    USUARIO_EXP1_CARGO:     experiencias[0]?.cargo    ?? '',
    USUARIO_EXP1_FECHAS:    fmtRange(experiencias[0]?.fecha_inicio, experiencias[0]?.fecha_fin),
    USUARIO_EXP1_FECHA_FIN: experiencias[0]?.fecha_fin ? fmtDate(experiencias[0].fecha_fin) : 'Presente',
    USUARIO_EXP1_DESC1:     descLine(experiencias[0]?.descripcion, 0),
    USUARIO_EXP1_DESC2:     descLine(experiencias[0]?.descripcion, 1),
    USUARIO_EXP1_DESC3:     descLine(experiencias[0]?.descripcion, 2),
    USUARIO_EXP1_DESC4:     descLine(experiencias[0]?.descripcion, 3),
    USUARIO_EXP1_DESC5:     descLine(experiencias[0]?.descripcion, 4),
    // Experience 2
    USUARIO_EXP2_EMPRESA:   experiencias[1]?.empresa  ?? '',
    USUARIO_EXP2_CARGO:     experiencias[1]?.cargo    ?? '',
    USUARIO_EXP2_FECHAS:    fmtRange(experiencias[1]?.fecha_inicio, experiencias[1]?.fecha_fin),
    USUARIO_EXP2_FECHA_FIN: experiencias[1]?.fecha_fin ? fmtDate(experiencias[1].fecha_fin) : 'Presente',
    USUARIO_EXP2_DESC1:     descLine(experiencias[1]?.descripcion, 0),
    USUARIO_EXP2_DESC2:     descLine(experiencias[1]?.descripcion, 1),
    USUARIO_EXP2_DESC3:     descLine(experiencias[1]?.descripcion, 2),
    USUARIO_EXP2_DESC4:     descLine(experiencias[1]?.descripcion, 3),
    USUARIO_EXP2_DESC5:     descLine(experiencias[1]?.descripcion, 4),
    // Experience 3
    USUARIO_EXP3_EMPRESA:   experiencias[2]?.empresa  ?? '',
    USUARIO_EXP3_CARGO:     experiencias[2]?.cargo    ?? '',
    USUARIO_EXP3_FECHAS:    fmtRange(experiencias[2]?.fecha_inicio, experiencias[2]?.fecha_fin),
    USUARIO_EXP3_FECHA_FIN: experiencias[2]?.fecha_fin ? fmtDate(experiencias[2].fecha_fin) : 'Presente',
    USUARIO_EXP3_DESC1:     descLine(experiencias[2]?.descripcion, 0),
    USUARIO_EXP3_DESC2:     descLine(experiencias[2]?.descripcion, 1),
    USUARIO_EXP3_DESC3:     descLine(experiencias[2]?.descripcion, 2),
    USUARIO_EXP3_DESC4:     descLine(experiencias[2]?.descripcion, 3),
    USUARIO_EXP3_DESC5:     descLine(experiencias[2]?.descripcion, 4),
    // Experience 4 & 5
    USUARIO_EXP4_EMPRESA:   experiencias[3]?.empresa  ?? '',
    USUARIO_EXP4_CARGO:     experiencias[3]?.cargo    ?? '',
    USUARIO_EXP4_FECHAS:    fmtRange(experiencias[3]?.fecha_inicio, experiencias[3]?.fecha_fin),
    USUARIO_EXP4_FECHA_FIN: experiencias[3]?.fecha_fin ? fmtDate(experiencias[3].fecha_fin) : 'Presente',
    USUARIO_EXP4_DESC1:     descLine(experiencias[3]?.descripcion, 0),
    USUARIO_EXP4_DESC2:     descLine(experiencias[3]?.descripcion, 1),
    USUARIO_EXP4_DESC3:     descLine(experiencias[3]?.descripcion, 2),
    USUARIO_EXP5_EMPRESA:   experiencias[4]?.empresa  ?? '',
    USUARIO_EXP5_CARGO:     experiencias[4]?.cargo    ?? '',
    USUARIO_EXP5_FECHAS:    fmtRange(experiencias[4]?.fecha_inicio, experiencias[4]?.fecha_fin),
    USUARIO_EXP5_FECHA_FIN: experiencias[4]?.fecha_fin ? fmtDate(experiencias[4].fecha_fin) : 'Presente',
    USUARIO_EXP5_DESC1:     descLine(experiencias[4]?.descripcion, 0),
    USUARIO_EXP5_DESC2:     descLine(experiencias[4]?.descripcion, 1),
    USUARIO_EXP5_DESC3:     descLine(experiencias[4]?.descripcion, 2),
    // Skills (all)
    USUARIO_HABILIDAD_1: skillsAll[0]?.nombre ?? '',
    USUARIO_HABILIDAD_2: skillsAll[1]?.nombre ?? '',
    USUARIO_HABILIDAD_3: skillsAll[2]?.nombre ?? '',
    USUARIO_HABILIDAD_4: skillsAll[3]?.nombre ?? '',
    USUARIO_HABILIDAD_5: skillsAll[4]?.nombre ?? '',
    USUARIO_HABILIDAD_6: skillsAll[5]?.nombre ?? '',
    // Skills technical
    USUARIO_HABILIDAD_TECNICA_1: skillsTecnica[0]?.nombre ?? '',
    USUARIO_HABILIDAD_TECNICA_2: skillsTecnica[1]?.nombre ?? '',
    USUARIO_HABILIDAD_TECNICA_3: skillsTecnica[2]?.nombre ?? '',
    USUARIO_HABILIDAD_TECNICA_4: skillsTecnica[3]?.nombre ?? '',
    USUARIO_HABILIDAD_TECNICA_5: skillsTecnica[4]?.nombre ?? '',
    USUARIO_HABILIDAD_TECNICA_6: skillsTecnica[5]?.nombre ?? '',
    // Skills soft
    USUARIO_HABILIDAD_BLANDA_1: skillsBlanda[0]?.nombre ?? '',
    USUARIO_HABILIDAD_BLANDA_2: skillsBlanda[1]?.nombre ?? '',
    USUARIO_HABILIDAD_BLANDA_3: skillsBlanda[2]?.nombre ?? '',
    USUARIO_HABILIDAD_BLANDA_4: skillsBlanda[3]?.nombre ?? '',
    USUARIO_HABILIDAD_BLANDA_5: skillsBlanda[4]?.nombre ?? '',
    USUARIO_HABILIDAD_BLANDA_6: skillsBlanda[5]?.nombre ?? '',
    // Languages
    USUARIO_IDIOMA_1: idiomas[0]?.nombre ?? '',
    USUARIO_IDIOMA_2: idiomas[1]?.nombre ?? '',
    USUARIO_IDIOMA_3: idiomas[2]?.nombre ?? '',
    USUARIO_IDIOMA_4: idiomas[3]?.nombre ?? '',
    USUARIO_IDIOMA_5: idiomas[4]?.nombre ?? '',
    USUARIO_IDIOMA_6: idiomas[5]?.nombre ?? '',
    // Logros
    USUARIO_LOGRO_1: logros[0]?.descripcion ?? '',
    USUARIO_LOGRO_2: logros[1]?.descripcion ?? '',
    USUARIO_LOGRO_3: logros[2]?.descripcion ?? '',
    USUARIO_LOGRO_4: logros[3]?.descripcion ?? '',
    USUARIO_LOGRO_5: logros[4]?.descripcion ?? '',
    USUARIO_LOGRO_6: logros[5]?.descripcion ?? '',
    // References
    USUARIO_REF1_NOMBRE:   '',
    USUARIO_REF1_CARGO:    '',
    USUARIO_REF1_CONTACTO: '',
  }
}