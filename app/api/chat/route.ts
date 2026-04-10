import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { anthropic } from '@/lib/ai/claude'
import { extractProfileUpdate, mergeProfileData } from '@/lib/ai/profile-extractor'

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Mensaje inválido' }, { status: 400 })
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
      .select('data, campos_pendientes')
      .eq('id', user.id)
      .single()

    const { data: basicProfile } = await supabase
      .from('profiles')
      .select('first_name')
      .eq('id', user.id)
      .single()

    const currentProfile = profileData?.data ?? {}
    const camposPendientes = profileData?.campos_pendientes ?? [
      'resumen_profesional', 'experiencia', 'educacion', 'habilidades', 'idiomas'
    ]
    const firstName = basicProfile?.first_name ?? 'tú'

    const systemPrompt = `Eres un asistente de carrera profesional. Tu misión es conocer la historia profesional del usuario de forma natural y conversacional, como una amiga inteligente que genuinamente quiere ayudarlo a presentarse bien ante oportunidades laborales.

PERFIL ACTUAL DEL USUARIO (${firstName}):
${JSON.stringify(currentProfile, null, 2)}

CAMPOS QUE FALTAN O ESTÁN INCOMPLETOS:
${camposPendientes.join(', ')}

REGLAS ESTRICTAS:
1. Tu respuesta VISIBLE debe ser corta: 1-3 oraciones máximo.
2. Sin markdown, sin bullets, sin asteriscos. Habla como persona, en español con tuteo.
3. Si el usuario comparte información profesional, confírmala brevemente en una línea.
4. Solo haz UNA pregunta si hay un campo importante vacío Y el momento es natural.
5. Si el usuario no respondió a una pregunta anterior, NO la repitas.
6. NUNCA inventes datos del usuario. Si no lo mencionó, no lo asumas.
7. Sé cálido pero eficiente. No te extiendas innecesariamente.

SIEMPRE termina tu respuesta con este bloque exacto (el backend lo procesa y el usuario nunca lo ve):

[PROFILE_UPDATE]
{
  "cambios": {},
  "campos_actualizados": [],
  "nueva_pregunta_hecha": null
}
[/PROFILE_UPDATE]

Si detectaste información nueva, pon los cambios en "cambios" con la misma estructura del perfil actual.
Ejemplo de cambios: { "habilidades": ["Python", "SQL"], "experiencia": [{ "empresa": "Accenture", "cargo": "Analista", "periodo": "2021-2023", "logros": [], "habilidades_usadas": [] }] }`

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 500,
      system: systemPrompt,
      messages: [{ role: 'user', content: message }],
    })

    const rawText = response.content[0].type === 'text' ? response.content[0].text : ''
    const { visibleText, profileUpdate } = extractProfileUpdate(rawText)

    if (profileUpdate && Object.keys(profileUpdate.cambios).length > 0) {
      const updatedData = mergeProfileData(currentProfile, profileUpdate.cambios)

      const newCamposPendientes = camposPendientes.filter(
        (campo: string) => !profileUpdate.campos_actualizados.includes(campo)
      )

      await supabase
        .from('professional_profiles')
        .upsert({
          id: user.id,
          data: updatedData,
          campos_pendientes: newCamposPendientes,
          last_updated_by_ai: new Date().toISOString(),
        })
    }

    await supabase.from('chat_messages').insert([
      { user_id: user.id, role: 'user', content: message, message_type: 'text' },
      { user_id: user.id, role: 'assistant', content: visibleText, message_type: 'text' },
    ])

    return NextResponse.json({ message: visibleText })

  } catch (error) {
    console.error('Error en /api/chat:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}