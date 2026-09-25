import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createAnthropicClient } from '@/lib/anthropic';
import { rateLimit } from '@/lib/rate-limit';
import { normalizeProfileDate } from '@/lib/profile-date';
import { isPresentMarker, PROFILE_DATE_RULES } from '@/lib/profile-import';
import { NextRequest, NextResponse } from 'next/server';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface RequestBody {
  messages: ChatMessage[];
  mode: 'onboarding' | 'perfil';
}

const MAX_MESSAGE_LENGTH = 2000

function buildProfileContext(profile: any, exp: any[], edu: any[], hab: any[], logros: any[], idiomas: any[]) {
  const lines: string[] = [];

  if (profile) {
    lines.push(`PERFIL ACTUAL DEL USUARIO:`);
    lines.push(`Nombre: ${profile.nombre} ${profile.apellido}`);
    if (profile.profesion_perfil) lines.push(`Profesión: ${profile.profesion_perfil}`);
    if (profile.ciudad) lines.push(`Ciudad: ${profile.ciudad}${profile.pais ? `, ${profile.pais}` : ''}`);
    if (profile.resumen_profesional) lines.push(`Resumen profesional: ${profile.resumen_profesional}`);
    lines.push(`Puntaje de completitud actual: ${profile.puntaje_completitud || 0}/100`);
    lines.push('');
  }

  if (exp.length > 0) {
    lines.push(`EXPERIENCIA LABORAL (${exp.length} entrada${exp.length > 1 ? 's' : ''}):`);
    exp.forEach(e => {
      lines.push(`  - ${e.cargo} en ${e.empresa}${e.fecha_inicio ? ` (${e.fecha_inicio} – ${e.activo ? 'Actualidad' : e.fecha_fin || '?'})` : ''}${e.descripcion ? `: ${e.descripcion}` : ''}`);
    });
    lines.push('');
  } else {
    lines.push(`EXPERIENCIA LABORAL: Sin datos aún.`);
    lines.push('');
  }

  if (edu.length > 0) {
    lines.push(`EDUCACIÓN (${edu.length} entrada${edu.length > 1 ? 's' : ''}):`);
    edu.forEach(e => {
      lines.push(`  - ${e.titulo} en ${e.institucion}${e.fecha_fin ? ` (${e.fecha_fin})` : ''}`);
    });
    lines.push('');
  } else {
    lines.push(`EDUCACIÓN: Sin datos aún.`);
    lines.push('');
  }

  if (hab.length > 0) {
    lines.push(`HABILIDADES: ${hab.map(h => h.nombre).join(', ')}`);
    lines.push('');
  } else {
    lines.push(`HABILIDADES: Sin datos aún.`);
    lines.push('');
  }

  if (logros.length > 0) {
    lines.push(`LOGROS (${logros.length}):`);
    logros.forEach(l => lines.push(`  - ${l.descripcion}`));
    lines.push('');
  } else {
    lines.push(`LOGROS: Sin datos aún.`);
    lines.push('');
  }

  if (idiomas.length > 0) {
    lines.push(`IDIOMAS: ${idiomas.map(i => `${i.nombre} (${i.nivel || 'sin nivel'})`).join(', ')}`);
  } else {
    lines.push(`IDIOMAS: Sin datos aún.`);
  }

  return lines.join('\n');
}

function buildSystemPrompt(profileContext: string) {
  return `Eres un reclutador senior y experto en desarrollo profesional. Tu rol es ayudar al usuario a construir un perfil profesional sólido que le permita conseguir el trabajo que quiere.

Tu trabajo es SIEMPRE dos cosas en paralelo:
1. Mantener una conversación fluida y natural con el usuario para obtener información sobre su trayectoria.
2. Extraer, curar y guardar esa información en su perfil.

${profileContext}

---

CÓMO DEBES COMPORTARTE:

Eres inteligente sobre lo que ya sabes del usuario. No preguntes por información que ya está en su perfil.
Detecta brechas importantes: si le falta experiencia laboral, educación, habilidades clave, logros o idiomas, guía la conversación hacia ahí.
Cura la información: si el usuario menciona un logro de forma vaga ("mejoré el proceso de ventas"), transfórmalo internamente a la fórmula Verbo + Resultado + Métrica + Cómo (ej: "Incrementé las ventas en un 35% implementando un CRM personalizado").
Cuando el usuario comparte algo nuevo, muéstrale que lo recibiste con naturalidad, no como confirmación mecánica.
Una sola pregunta de seguimiento por mensaje. Nunca dos preguntas a la vez.
Tono: directo, cálido, profesional. Sin relleno, sin halagos innecesarios.
Sin markdown, bullets ni asteriscos en el mensaje visible.
Sin saludos después del primer mensaje.

---

FORMATO DE RESPUESTA OBLIGATORIO (siempre JSON exacto):

{
  "message": "Tu respuesta visible. Máximo 2 líneas. Una sola pregunta.",
  "extracted": {
    "experiencias": [],
    "educacion": [],
    "habilidades": [],
    "idiomas": [],
    "logros": [],
    "resumen": null
  }
}

REGLAS PARA "extracted":
- Solo extrae lo que el usuario mencionó explícitamente en este mensaje.
- experiencias: [{empresa, cargo, fecha_inicio, fecha_fin, activo, descripcion}]
- educacion: [{institucion, titulo, area, fecha_inicio, fecha_fin}]

${PROFILE_DATE_RULES}

- habilidades: [{nombre, tipo}] — tipo DEBE ser exactamente "tecnica" o "blanda". Técnicas: herramientas, software, lenguajes, metodologías, plataformas, habilidades medibles de un campo (Python, Excel, SCRUM, AutoCAD, SQL, Photoshop). Blandas: interpersonales, actitud, comportamiento (Liderazgo, Comunicación, Trabajo en equipo, Adaptabilidad, Empatía). Nunca dejes tipo vacío ni null.
- idiomas: [{nombre, nivel}] — nivel puede ser "Básico", "Intermedio", "Avanzado" o "Nativo"
- logros: [{descripcion}] — CURA el logro con la fórmula Verbo + Resultado + Métrica + Cómo antes de guardar. Si no hay suficiente información para completar la fórmula, guarda lo que dijo pero mejorado gramaticalmente.
- resumen: string con resumen profesional si el usuario lo mencionó o si ya tienes suficiente info para inferir uno de 2-3 oraciones, null si no.
- Si no hay nada nuevo que extraer, deja todo vacío y null.
- Nunca inventes datos.`;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // 20 messages per minute per user
    if (!(await rateLimit(user.id, 20, 60_000))) {
      return NextResponse.json({ error: 'Demasiadas solicitudes. Espera un momento.' }, { status: 429 });
    }

    const { messages, mode } = (await request.json()) as RequestBody;

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'No hay mensajes' }, { status: 400 });
    }

    const lastMessage = messages[messages.length - 1]
    if (lastMessage?.role === 'user' && lastMessage.content.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json({ error: 'Mensaje demasiado largo. Máximo 2000 caracteres.' }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'API key no configurada' }, { status: 500 });
    }

    // Fetch full user context before calling Claude
    const admin = createAdminClient();
    const [
      { data: profileData },
      { data: expData },
      { data: eduData },
      { data: habData },
      { data: logroData },
      { data: idiomaData },
    ] = await Promise.all([
      admin.from('profiles').select('*').eq('id', user.id).single(),
      admin.from('experiencia').select('*').eq('user_id', user.id),
      admin.from('educacion').select('*').eq('user_id', user.id),
      admin.from('habilidades').select('*').eq('user_id', user.id),
      admin.from('logros').select('*').eq('user_id', user.id),
      admin.from('idiomas').select('*').eq('user_id', user.id),
    ]);

    const profileContext = buildProfileContext(
      profileData,
      expData || [],
      eduData || [],
      habData || [],
      logroData || [],
      idiomaData || [],
    );

    const systemPrompt = buildSystemPrompt(profileContext);
    const anthropic = createAnthropicClient();

    // For the first message in perfil mode, prepend the greeting as assistant turn
    let messageHistory = [...messages];
    if (messageHistory.length === 1 && mode === 'perfil') {
      const nombre = profileData?.nombre?.split(' ')[0] || 'tú';
      const hasData = (expData?.length || 0) + (eduData?.length || 0) + (habData?.length || 0) > 0;
      const greetingText = hasData
        ? `Ya tengo algo de información tuya. ¿Qué más quieres agregar o mejorar en tu perfil?`
        : `Cuéntame sobre tu trayectoria profesional. ¿Dónde has trabajado o estudiado?`;
      messageHistory = [
        {
          role: 'assistant' as const,
          content: JSON.stringify({
            message: greetingText,
            extracted: { experiencias: [], educacion: [], habilidades: [], idiomas: [], logros: [], resumen: null },
          }),
        },
        ...messageHistory,
      ];
    } else if (messageHistory.length === 1 && mode === 'onboarding') {
      messageHistory = [
        {
          role: 'assistant' as const,
          content: JSON.stringify({
            message: 'Vamos a generar tu CV. Puedes contarme sobre tu experiencia o subir un documento (CV antiguo, LinkedIn en PDF, carta de presentación).',
            extracted: { experiencias: [], educacion: [], habilidades: [], idiomas: [], logros: [], resumen: null },
          }),
        },
        ...messageHistory,
      ];
    }

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      system: systemPrompt,
      messages: messageHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    });

    if (!response.content || response.content.length === 0) {
      return NextResponse.json({ error: 'Respuesta vacía de la IA' }, { status: 500 });
    }

    const rawText = response.content[0].type === 'text' ? response.content[0].text : '';

    let parsed: { message: string; extracted?: any };
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { message: rawText };
    } catch {
      parsed = { message: rawText };
    }

    const visibleMessage = parsed.message || rawText;
    const extracted = parsed.extracted;

    // Save extracted data with deduplication
    if (extracted) {
      const existingExpKeys = new Set((expData || []).map((e: any) => `${e.empresa?.toLowerCase()}|${e.cargo?.toLowerCase()}`));
      const existingHabNames = new Set((habData || []).map((h: any) => h.nombre?.toLowerCase()));
      const existingEduKeys = new Set((eduData || []).map((e: any) => `${e.institucion?.toLowerCase()}|${e.titulo?.toLowerCase()}`));
      const existingIdiomaNames = new Set((idiomaData || []).map((i: any) => i.nombre?.toLowerCase()));
      const existingLogroTexts = new Set((logroData || []).map((l: any) => l.descripcion?.toLowerCase().substring(0, 40)));

      if (extracted.experiencias?.length > 0) {
        for (const exp of extracted.experiencias) {
          if (!exp.empresa || !exp.cargo) continue;
          const key = `${exp.empresa.toLowerCase()}|${exp.cargo.toLowerCase()}`;
          if (existingExpKeys.has(key)) continue;
          existingExpKeys.add(key);
          await admin.from('experiencia').insert({
            user_id: user.id,
            empresa: exp.empresa,
            cargo: exp.cargo,
            fecha_inicio: normalizeProfileDate(exp.fecha_inicio),
            fecha_fin: isPresentMarker(exp.fecha_fin) ? null : normalizeProfileDate(exp.fecha_fin),
            activo: exp.activo || isPresentMarker(exp.fecha_fin),
            descripcion: exp.descripcion || null,
          });
        }
      }

      if (extracted.educacion?.length > 0) {
        for (const edu of extracted.educacion) {
          if (!edu.institucion || !edu.titulo) continue;
          const key = `${edu.institucion.toLowerCase()}|${edu.titulo.toLowerCase()}`;
          if (existingEduKeys.has(key)) continue;
          existingEduKeys.add(key);
          await admin.from('educacion').insert({
            user_id: user.id,
            institucion: edu.institucion,
            titulo: edu.titulo,
            area: edu.area || null,
            fecha_inicio: normalizeProfileDate(edu.fecha_inicio),
            fecha_fin: normalizeProfileDate(edu.fecha_fin),
          });
        }
      }

      if (extracted.habilidades?.length > 0) {
        for (const hab of extracted.habilidades) {
          if (!hab.nombre) continue;
          const name = hab.nombre.toLowerCase();
          if (existingHabNames.has(name)) continue;
          existingHabNames.add(name);
          const tipo = hab.tipo === 'tecnica' || hab.tipo === 'blanda' ? hab.tipo : null
          await admin.from('habilidades').insert({ user_id: user.id, nombre: hab.nombre, tipo });
        }
      }

      if (extracted.idiomas?.length > 0) {
        for (const idioma of extracted.idiomas) {
          if (!idioma.nombre) continue;
          const name = idioma.nombre.toLowerCase();
          if (existingIdiomaNames.has(name)) continue;
          existingIdiomaNames.add(name);
          await admin.from('idiomas').insert({
            user_id: user.id,
            nombre: idioma.nombre,
            nivel: idioma.nivel || null,
          });
        }
      }

      if (extracted.logros?.length > 0) {
        for (const logro of extracted.logros) {
          if (!logro.descripcion) continue;
          const prefix = logro.descripcion.toLowerCase().substring(0, 40);
          if (existingLogroTexts.has(prefix)) continue;
          existingLogroTexts.add(prefix);
          await admin.from('logros').insert({ user_id: user.id, descripcion: logro.descripcion });
        }
      }

      if (extracted.resumen) {
        await admin.from('profiles').update({ resumen_profesional: extracted.resumen }).eq('id', user.id);
      }
    }

    return NextResponse.json({
      message: visibleMessage,
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
      },
    });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Error en el chat. Intenta de nuevo.' }, { status: 500 });
  }
}
