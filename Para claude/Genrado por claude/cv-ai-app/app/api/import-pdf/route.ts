import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { anthropic } from '@/lib/ai/claude'
import { mergeProfileData } from '@/lib/ai/profile-extractor'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 })
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'El archivo debe ser un PDF' }, { status: 400 })
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

    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')

    const { data: profileData } = await supabase
      .from('professional_profiles')
      .select('data, campos_pendientes')
      .eq('id', user.id)
      .single()

    const currentProfile = profileData?.data ?? {}

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: base64,
              },
            },
            {
              type: 'text',
              text: `Extrae toda la información profesional de este documento (puede ser un perfil de LinkedIn o un CV).

Devuelve ÚNICAMENTE el siguiente JSON sin texto adicional, sin markdown, sin explicaciones:

{
  "resumen_profesional": "",
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
}

Reglas:
- Solo extrae información que esté explícitamente en el documento
- Si un campo no tiene información, ponlo como null o array vacío
- No inventes ni supongas nada
- Para experiencia, incluye todos los trabajos que encuentres
- Para habilidades, incluye todas las mencionadas en el documento`,
            },
          ],
        },
      ],
    })

    const rawText = response.content[0].type === 'text' ? response.content[0].text : ''
    const cleanText = rawText.replace(/```json|```/g, '').trim()
    const extractedData = JSON.parse(cleanText)

    const updatedProfile = mergeProfileData(currentProfile, extractedData)

    const allCampos = ['resumen_profesional', 'experiencia', 'educacion', 'habilidades', 'idiomas']
    const camposPendientes = allCampos.filter(campo => {
      const value = updatedProfile[campo]
      if (!value) return true
      if (Array.isArray(value) && value.length === 0) return true
      return false
    })

    await supabase
      .from('professional_profiles')
      .upsert({
        id: user.id,
        data: updatedProfile,
        campos_pendientes: camposPendientes,
        last_updated_by_ai: new Date().toISOString(),
      })

    return NextResponse.json({
      success: true,
      message: 'Perfil importado correctamente',
      campos_encontrados: Object.keys(extractedData).filter(k => {
        const v = extractedData[k]
        return v && (Array.isArray(v) ? v.length > 0 : true)
      })
    })

  } catch (error) {
    console.error('Error en /api/import-pdf:', error)
    return NextResponse.json({ error: 'Error procesando el PDF' }, { status: 500 })
  }
}