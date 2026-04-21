import { createClient } from '@/lib/supabase/server';
import { createAnthropicClient } from '@/lib/anthropic';
import { NextRequest, NextResponse } from 'next/server';

const P3_PARSE_DOCUMENT = `Extrae información profesional de un documento (CV, LinkedIn en PDF, carta de presentación, etc).
Devuelve JSON con:
- experiencia[]: {empresa, cargo, fecha_inicio, fecha_fin, descripcion}
- educacion[]: {institucion, titulo, area, fecha_inicio, fecha_fin}
- habilidades[]: {nombre}
- idiomas[]: {nombre, nivel}
- logros[]: {descripcion}
- resumen: string

IMPORTANTE: Nunca inventar datos. Solo extraer lo que existe en el documento.`;

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

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No hay archivo' },
        { status: 400 }
      );
    }

    // Convertir archivo a base64 o texto
    const buffer = await file.arrayBuffer();
    const text = Buffer.from(buffer).toString('utf-8');

    const anthropic = createAnthropicClient();

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      system: P3_PARSE_DOCUMENT,
      messages: [
        {
          role: 'user',
          content: `Extrae la información profesional de este documento:\n\n${text}`,
        },
      ],
    });

    const content =
      response.content[0].type === 'text' ? response.content[0].text : '';

    // Parsear JSON
    let parsedData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        parsedData = { error: 'No se pudo extraer información' };
      }
    } catch (e) {
      parsedData = { error: 'Error al procesar documento' };
    }

    // Guardar información extraída en la base de datos
    if (parsedData.experiencia && Array.isArray(parsedData.experiencia)) {
      for (const exp of parsedData.experiencia) {
        await supabase.from('experiencia').insert({
          user_id: user.id,
          empresa: exp.empresa,
          cargo: exp.cargo,
          fecha_inicio: exp.fecha_inicio,
          fecha_fin: exp.fecha_fin,
          descripcion: exp.descripcion,
        });
      }
    }

    if (parsedData.educacion && Array.isArray(parsedData.educacion)) {
      for (const edu of parsedData.educacion) {
        await supabase.from('educacion').insert({
          user_id: user.id,
          institucion: edu.institucion,
          titulo: edu.titulo,
          area: edu.area,
          fecha_inicio: edu.fecha_inicio,
          fecha_fin: edu.fecha_fin,
        });
      }
    }

    if (parsedData.habilidades && Array.isArray(parsedData.habilidades)) {
      for (const hab of parsedData.habilidades) {
        await supabase.from('habilidades').insert({
          user_id: user.id,
          nombre: hab.nombre,
        });
      }
    }

    if (parsedData.idiomas && Array.isArray(parsedData.idiomas)) {
      for (const idioma of parsedData.idiomas) {
        await supabase.from('idiomas').insert({
          user_id: user.id,
          nombre: idioma.nombre,
          nivel: idioma.nivel,
        });
      }
    }

    if (parsedData.logros && Array.isArray(parsedData.logros)) {
      for (const logro of parsedData.logros) {
        await supabase.from('logros').insert({
          user_id: user.id,
          descripcion: logro.descripcion,
        });
      }
    }

    // Actualizar resumen si existe
    if (parsedData.resumen) {
      await supabase
        .from('profiles')
        .update({ resumen_profesional: parsedData.resumen })
        .eq('id', user.id);
    }

    return NextResponse.json({
      success: true,
      extracted: parsedData,
    });
  } catch (error: any) {
    console.error('Parse document error:', error);

    return NextResponse.json(
      { error: 'Error al procesar documento' },
      { status: 500 }
    );
  }
}
