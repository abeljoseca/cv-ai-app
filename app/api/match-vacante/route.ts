import { createClient } from '@/lib/supabase/server';
import { createAnthropicClient } from '@/lib/anthropic';
import { rateLimit } from '@/lib/rate-limit';
import { NextRequest, NextResponse } from 'next/server';
import { professionalView } from '@/lib/cv/content';

const P8_MATCH_VACANTE = `Analiza el CV generado vs la descripción de la vacante.
El porcentaje de compatibilidad YA fue calculado de forma determinística por el sistema (se te
da como dato). Tu única tarea es explicar ESE porcentaje y dar recomendaciones — NUNCA calcules
ni devuelvas tu propio porcentaje, y nunca lo contradigas.

Devuelve JSON con:
- competencias_aplican: string[]
- recomendaciones: string[]
- explicacion: string (breve, coherente con el porcentaje dado)`;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!(await rateLimit(user.id, 10, 60_000))) {
      return NextResponse.json({ error: 'Demasiadas solicitudes. Espera un momento.' }, { status: 429 })
    }

    const { cv, vacante, match_porcentaje } = await request.json();

    if (!cv || !vacante || typeof match_porcentaje !== 'number') {
      return NextResponse.json(
        { error: 'Falta CV, descripción de vacante o match_porcentaje' },
        { status: 400 }
      );
    }

    // Only the professional content reaches the AI — never name, contact or identity data
    // (Europass spec change 28, all styles).
    const anthropic = createAnthropicClient();

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      system: P8_MATCH_VACANTE,
      messages: [
        {
          role: 'user',
          content: `Porcentaje de compatibilidad ya calculado: ${match_porcentaje}%\n\nCV: ${JSON.stringify(professionalView(cv))}\n\nVacante: ${vacante}`,
        },
      ],
    });

    const content =
      response.content[0].type === 'text' ? response.content[0].text : '';

    let matchData: Record<string, unknown>;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      matchData = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch {
      matchData = {};
    }

    // Defensive: the number is only ever the deterministic one computed at
    // generation time — never trust the model's own count even if it emits one.
    delete matchData.match_porcentaje;
    matchData.match_porcentaje = match_porcentaje;

    return NextResponse.json({
      success: true,
      match: matchData,
    });
  } catch (error: any) {
    console.error('Match vacante error:', error);

    return NextResponse.json(
      { error: 'Error al calcular match' },
      { status: 500 }
    );
  }
}
