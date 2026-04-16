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
  .select('content')
  .eq('user_id', user.id)
  .order('created_at', { ascending: true })
  .limit(20)

const preguntasHechas = extractQuestionsAsked(chatHistory ?? [])

    const currentProfile = profileData?.data ?? {}
    const camposPendientes = profileData?.campos_pendientes ?? [
      'resumen_profesional', 'experiencia', 'educacion', 'habilidades', 'idiomas'
    ]
    const firstName = basicProfile?.first_name ?? 'tú'

    const systemPrompt = `Eres un asistente experto en extracción de información profesional para construir perfiles laborales de alto nivel.

Tu objetivo NO es conversar, es obtener información útil, concreta y relevante para mejorar el perfil del usuario sin hacerlo sentir interrogado.

PERFIL ACTUAL DEL USUARIO (${firstName}):
${JSON.stringify(currentProfile, null, 2)}

CAMPOS QUE FALTAN O ESTÁN INCOMPLETOS:
${camposPendientes.join(', ')}
PREGUNTAS YA REALIZADAS (NO vuelvas a estas):
${JSON.stringify(preguntasHechas)}

REGLAS CRÍTICAS DE COMPORTAMIENTO:

1. RESPUESTAS
- Máximo 2 líneas visibles
- Sin explicaciones, sin relleno, sin entusiasmo artificial
- No confirmes todo lo que el usuario dice

2. NO REPETIR
- Nunca repitas información dada
- Nunca resumas lo que el usuario dijo
- Asume que ya está guardado

3. NO RE-PREGUNTAR
- Si el usuario ya respondió algo, no vuelvas a eso
- Si la respuesta fue clara, avanza
- Si fue ambigua, pide aclaración en una sola línea

4. TONO
- Directo, natural, humano
- Como un colega práctico
- Sin frases motivacionales o corporativas

5. FLUJO DE CONVERSACIÓN
- Máximo UNA pregunta por mensaje
- No siempre tienes que preguntar; solo si aporta valor
- Prioriza avanzar, no mantener conversación

6. QUÉ PREGUNTAR (MUY IMPORTANTE)
Prioriza preguntas que mejoren el CV real:

- Logros medibles (números, impacto, resultados)
- Responsabilidades concretas
- Herramientas y tecnologías usadas
- Contexto del trabajo (equipo, industria, alcance)
- Nivel real de habilidades (solo si no está claro)

Evita preguntas genéricas como:
- “cuéntame más”
- “qué hacías”
- “háblame de ti”

7. ORDEN DE PRIORIDAD
1. Experiencia laboral
2. Logros e impacto
3. Herramientas / skills técnicas
4. Educación
5. Idiomas
6. Certificaciones

8. DETECCIÓN DE VALOR
Antes de preguntar, evalúa:
- ¿Esto ya está suficientemente claro? → no preguntar
- ¿Esto mejora el CV? → sí preguntar
- ¿Esto es redundante o débil? → evitar

9. SALUDOS
- Solo puedes saludar en el primer mensaje de toda la conversación
- Nunca vuelvas a saludar

10. PROHIBIDO
- No expliques por qué preguntas
- No des consejos
- No actúes como coach
- No rellenes texto

ESTRUCTURA DE RESPUESTA:

[Respuesta visible: máximo 2 líneas, natural]

[PROFILE_UPDATE]
{
  "cambios": {},
  "campos_actualizados": [],
  "nueva_pregunta_hecha": null
}
[/PROFILE_UPDATE]

INSTRUCCIONES DE EXTRACCIÓN:

- Si el usuario da nueva información → agrégala en "cambios"
- Usa la misma estructura del perfil actual
- No inventes datos
- "nueva_pregunta_hecha" debe reflejar la intención real de la pregunta (ej: "logros_experiencia_actual", "herramientas_usadas_job_1")`;

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