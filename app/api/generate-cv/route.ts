import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createAnthropicClient } from '@/lib/anthropic'
import { rateLimit } from '@/lib/rate-limit'
import { NextRequest, NextResponse } from 'next/server'
import { runGeneralPipeline } from '@/lib/cv/pipelines/general'
import { runVacancyPipeline } from '@/lib/cv/pipelines/vacancy'

const MAX_VACANCY_LENGTH = 5000

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!(await rateLimit(user.id, 5, 60_000))) {
      return NextResponse.json({ error: 'Demasiadas solicitudes. Espera un momento.' }, { status: 429 })
    }

    // Plan Inicio: no se puede crear un CV nuevo mientras haya uno sin pagar.
    // Generar el texto ya cuenta como "crear" — este chequeo va antes de
    // gastar ningún token de IA. Ver handoff.md sección 15.
    const { data: blocked } = await supabase.rpc('user_has_unpaid_cv', { p_user_id: user.id })
    if (blocked) {
      return NextResponse.json(
        { error: 'Ya tienes un CV sin pagar. Complétalo para poder crear uno nuevo.' },
        { status: 403 }
      )
    }

    const { mode, estilo, descripcion_vacante } = await request.json()

    if (!mode || !estilo) {
      return NextResponse.json({ error: 'Faltan parámetros requeridos' }, { status: 400 })
    }

    if (mode === 'job' && (!descripcion_vacante || descripcion_vacante.trim().length < 50)) {
      return NextResponse.json({ error: 'La descripción de la vacante es obligatoria.' }, { status: 400 })
    }

    if (mode === 'job' && descripcion_vacante && descripcion_vacante.length > MAX_VACANCY_LENGTH) {
      return NextResponse.json({ error: 'La descripción de la vacante es demasiado larga.' }, { status: 400 })
    }

    const admin = createAdminClient()
    const anthropic = createAnthropicClient()

    if (mode === 'job') {
      const result = await runVacancyPipeline(user.id, estilo, descripcion_vacante, admin, anthropic)
      return NextResponse.json({ success: true, cv: result.cv, content: result.content, match: result.matchPorcentaje })
    }

    const result = await runGeneralPipeline(user.id, estilo, admin, anthropic)
    return NextResponse.json({ success: true, cv: result.cv, content: result.content })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Generate CV error:', message)
    return NextResponse.json({ error: 'Error al generar CV. Intenta de nuevo.' }, { status: 500 })
  }
}
