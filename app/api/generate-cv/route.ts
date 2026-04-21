import { createClient } from '@/lib/supabase/server';
import { createAnthropicClient } from '@/lib/anthropic';
import { NextRequest, NextResponse } from 'next/server';

interface GenerateCVRequest {
  mode: 'general' | 'vacante';
  estilo: string;
  descripcion_vacante?: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { mode, estilo, descripcion_vacante } =
      (await request.json()) as GenerateCVRequest;

    // Cargar datos del usuario
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const { data: experiencias } = await supabase
      .from('experiencia')
      .select('*')
      .eq('user_id', user.id);

    const { data: educaciones } = await supabase
      .from('educacion')
      .select('*')
      .eq('user_id', user.id);

    const { data: habilidades } = await supabase
      .from('habilidades')
      .select('*')
      .eq('user_id', user.id);

    const { data: idiomas } = await supabase
      .from('idiomas')
      .select('*')
      .eq('user_id', user.id);

    const { data: logros } = await supabase
      .from('logros')
      .select('*')
      .eq('user_id', user.id);

    if (!profile) {
      return NextResponse.json(
        { error: 'Perfil no encontrado' },
        { status: 404 }
      );
    }

    const hasExperience = (experiencias && experiencias.length > 0) ?? false;

    // Crear prompt basado en el modo
    let systemPrompt = '';
    if (mode === 'general' && hasExperience) {
      systemPrompt = `Genera un CV profesional general con experiencia laboral.
      Usa profesion_perfil como título principal del CV.
      Formato JSON con: nombre, titulo, resumen, experiencias[], educacion[], habilidades[], idiomas[], logros[]`;
    } else if (mode === 'general' && !hasExperience) {
      systemPrompt = `Genera un CV profesional general SIN experiencia laboral.
      Enfatiza educación, proyectos y habilidades.
      Puede inferir profesión desde educación si es necesario.
      Formato JSON con: nombre, titulo, resumen, educacion[], habilidades[], idiomas[], logros[]`;
    } else if (mode === 'vacante' && hasExperience) {
      systemPrompt = `Genera un CV optimizado para esta vacante específica:
      ${descripcion_vacante}
      El usuario tiene experiencia laboral.
      Usa solo datos REALES del usuario.
      Formato JSON con: nombre, titulo, resumen, experiencias[], educacion[], habilidades[], idiomas[], logros[]`;
    } else {
      systemPrompt = `Genera un CV para esta vacante específica:
      ${descripcion_vacante}
      El usuario NO tiene experiencia laboral.
      Enfatiza educación, proyectos, habilidades.
      Formato JSON con: nombre, titulo, resumen, educacion[], habilidades[], idiomas[], logros[]`;
    }

    const anthropic = createAnthropicClient();

    // Preparar datos del usuario
    const userData = {
      nombre: `${profile.nombre} ${profile.apellido}`,
      profesion: profile.profesion_perfil,
      resumen: profile.resumen_profesional,
      experiencias,
      educaciones,
      habilidades,
      idiomas,
      logros,
    };

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Genera el CV con esta información del usuario: ${JSON.stringify(
            userData
          )}`,
        },
      ],
    });

    const content =
      response.content[0].type === 'text' ? response.content[0].text : '';

    // Parsear JSON
    let cvContent;
    try {
      // Buscar JSON en la respuesta
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cvContent = JSON.parse(jsonMatch[0]);
      } else {
        cvContent = { error: 'No se pudo generar el CV' };
      }
    } catch (e) {
      cvContent = { error: 'Error al procesar CV' };
    }

    // Guardar CV en base de datos
    const { data: cvData, error: cvError } = await supabase
      .from('cvs')
      .insert({
        user_id: user.id,
        intencion: mode,
        estilo,
        contenido_json: cvContent,
        descripcion_vacante: mode === 'vacante' ? descripcion_vacante : null,
      })
      .select()
      .single();

    if (cvError) {
      throw cvError;
    }

    return NextResponse.json({
      success: true,
      cv: cvData,
      content: cvContent,
    });
  } catch (error: any) {
    console.error('Generate CV error:', error);

    return NextResponse.json(
      { error: 'Error al generar CV' },
      { status: 500 }
    );
  }
}
