import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { anthropic } from '@/lib/ai/claude'

export async function POST(request: NextRequest) {
  try {
    const { jobDescription, template } = await request.json()

    if (!jobDescription) {
      return NextResponse.json({ error: 'Falta la descripción del trabajo' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { data: profileData } = await supabase
      .from('professional_profiles')
      .select('data')
      .eq('id', user.id)
      .single()

    const { data: basicProfile } = await supabase
      .from('profiles')
      .select('first_name, last_name, phone, location, linkedin_url')
      .eq('id', user.id)
      .single()

    const professionalData = profileData?.data ?? {}

    const hasExperience = professionalData.experiencia && professionalData.experiencia.length > 0
    const hasName = basicProfile?.first_name

    if (!hasExperience && !hasName) {
      return NextResponse.json({
        error: 'perfil_incompleto',
        message: 'Primero cuéntame más sobre ti en el chat antes de generar un CV.'
      }, { status: 400 })
    }

    const prompt = `Eres un experto en recursos humanos y optimización de CVs para sistemas ATS.

Tu tarea es generar un CV profesional en formato JSON, usando ÚNICAMENTE la información real del usuario que te proporciono. NUNCA inventes datos, experiencias, habilidades o logros que no estén en el perfil.

PERFIL DEL USUARIO:
Nombre: ${basicProfile?.first_name ?? ''} ${basicProfile?.last_name ?? ''}
Email: ${user.email}
Teléfono: ${basicProfile?.phone ?? ''}
Ubicación: ${basicProfile?.location ?? ''}
LinkedIn: ${basicProfile?.linkedin_url ?? ''}

DATOS PROFESIONALES:
${JSON.stringify(professionalData, null, 2)}

OFERTA LABORAL:
${jobDescription}

INSTRUCCIONES:
1. Analiza las palabras clave de la oferta (tecnologías, habilidades, verbos, títulos)
2. Incorpora esas palabras clave naturalmente usando SOLO datos reales del usuario
3. Prioriza las experiencias más relevantes para esta vacante
4. Usa verbos de acción fuertes: lideré, desarrollé, implementé, optimicé, diseñé
5. Incluye métricas y resultados cuando el usuario los haya mencionado
6. Si un campo no tiene datos, ponlo como null — NUNCA inventes contenido
7. El resumen profesional debe estar optimizado para esta vacante específica
8. Extrae el nombre del puesto y empresa de la oferta laboral

Devuelve ÚNICAMENTE el siguiente JSON sin ningún texto adicional, sin markdown, sin explicaciones:

{
  "nombre_completo": "",
  "email": "",
  "telefono": "",
  "ubicacion": "",
  "linkedin": "",
  "resumen_profesional": "",
  "job_title_applied": "",
  "company_name": "",
  "experiencia": [
    {
      "empresa": "",
      "cargo": "",
      "periodo": "",
      "logros": [],
      "habilidades_usadas": []
    }
  ],
  "educacion": [
    {
      "institucion": "",
      "titulo": "",
      "periodo": ""
    }
  ],
  "habilidades": [],
  "idiomas": [],
  "certificaciones": []
}`

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })

    const rawText = response.content[0].type === 'text' ? response.content[0].text : ''
    const cleanText = rawText.replace(/```json|```/g, '').trim()
    const cvData = JSON.parse(cleanText)

    // Guardar registro en tabla cvs
    const { data: cvRecord } = await supabase
      .from('cvs')
      .insert({
        user_id: user.id,
        title: `${cvData.job_title_applied || 'CV'} — ${cvData.company_name || 'Sin empresa'}`,
        job_title_applied: cvData.job_title_applied,
        company_name: cvData.company_name,
        job_description_raw: jobDescription,
        template_used: template ?? 'harvard',
      })
      .select()
      .single()

    return NextResponse.json({
      cvData,
      cvId: cvRecord?.id,
      template: template ?? 'harvard'
    })

  } catch (error) {
    console.error('Error en /api/generate-cv:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}