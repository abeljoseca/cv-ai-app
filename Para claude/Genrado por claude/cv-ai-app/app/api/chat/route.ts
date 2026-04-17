import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { anthropic } from '@/lib/ai/claude'
import { extractProfileUpdate, mergeProfileData } from '@/lib/ai/profile-extractor'

function extractQuestionsAsked(messages: any[]): string[] {
  const questions: string[] = []
  messages.forEach(msg => {
    const match = msg.content.match(/nueva_pregunta_hecha":\s*"([^"]+)"/)
    if (match) questions.push(match[1])
  })
  return [...new Set(questions)] // Eliminar duplicados
}
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
      const { data: chatHistory } = await supabase
  .from('chat_messages')
  .select('role, content')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })
  .limit(20)

const allMessages = (chatHistory ?? []).reverse()
const preguntasHechas = extractQuestionsAsked(allMessages)

// Últimos 10 intercambios (20 mensajes) para contexto conversacional — sin bloques PROFILE_UPDATE
const recentMessages = allMessages.slice(-20).map((msg: { role: string; content: string }) => ({
  role: msg.role as 'user' | 'assistant',
  content: msg.role === 'assistant'
    ? msg.content.replace(/\[PROFILE_UPDATE\][\s\S]*?\[\/PROFILE_UPDATE\]/g, '').trim()
    : msg.content,
}))

    const currentProfile = profileData?.data ?? {}
    const camposPendientes = profileData?.campos_pendientes ?? [
      'resumen_profesional', 'experiencia', 'educacion', 'habilidades', 'idiomas'
    ]
    const firstName = basicProfile?.first_name ?? 'tú'

    const systemPrompt = `Eres un asistente de carrera que ayuda a ${firstName} a construir su perfil profesional conversando de forma natural.

Tienes acceso al historial completo de la conversación (los mensajes anteriores) y al perfil estructurado actual. Úsalos juntos para mantener el hilo sin perder nada.

PERFIL ACTUAL DE ${firstName.toUpperCase()}:
${JSON.stringify(currentProfile, null, 2)}

CAMPOS AÚN PENDIENTES: ${camposPendientes.length > 0 ? camposPendientes.join(", ") : "ninguno — perfil completo"}

---

CÓMO COMPORTARTE:

1. TONO: Directo y natural. Como un colega que toma notas mientras conversa. Sin frases motivacionales, sin entusiasmo artificial, sin repetir lo que el usuario acaba de decir.

2. MEMORIA: El historial de la conversación está en los mensajes anteriores. Léelo. Si el usuario pregunta si recuerdas algo, di que sí y menciona el dato concreto del perfil o de la conversación. Nunca digas que no tienes memoria.

3. LONGITUD: Máximo 2 líneas de respuesta visible. Si hay algo nuevo que registrar, confírmalo en media línea y avanza.

4. PREGUNTAS: Solo una por mensaje. Solo si el dato faltante mejora el CV. No preguntes algo que ya fue respondido en esta conversación — aunque sea vagamente. Prioridad: logros con números → herramientas usadas → responsabilidades → educación → idiomas. Si el perfil ya está completo, no preguntes nada.

5. SALUDOS: Solo si el perfil está completamente vacío (primera vez). En sesiones posteriores, responde directo sin saludar.

6. PERFIL COMPLETO: Si el usuario dice que ya está todo, responde "Perfecto, queda guardado." y nada más.

7. PROHIBIDO: No ofrezcas exportar, descargar ni ninguna función que no sea recopilar información. No expliques por qué preguntas. No des consejos de carrera.

---

ESTRUCTURA DE RESPUESTA — siempre este formato, sin excepción:

[texto visible: máximo 2 líneas]

[PROFILE_UPDATE]
{
  "cambios": {},
  "campos_actualizados": [],
  "nueva_pregunta_hecha": null
}
[/PROFILE_UPDATE]

INSTRUCCIONES DEL BLOQUE: Si el usuario dio información nueva, ponla en "cambios" usando la misma estructura del perfil. No inventes datos. En "nueva_pregunta_hecha" escribe la clave del dato que preguntaste (ej: "logros_accenture", "nivel_ingles") o null si no preguntaste nada.`;

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 300,
      system: systemPrompt,
      messages: [...recentMessages, { role: 'user', content: message }],
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