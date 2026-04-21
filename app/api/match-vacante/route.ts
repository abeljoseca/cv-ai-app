import { createAnthropicClient } from '@/lib/anthropic';
import { NextRequest, NextResponse } from 'next/server';

const P8_MATCH_VACANTE = `Analiza el CV generado vs la descripción de la vacante.
Devuelve JSON con:
- match_porcentaje: número de 0-100
- competencias_aplican: string[]
- recomendaciones: string[]
- explicacion: string`;

export async function POST(request: NextRequest) {
  try {
    const { cv, vacante } = await request.json();

    if (!cv || !vacante) {
      return NextResponse.json(
        { error: 'Falta CV o descripción de vacante' },
        { status: 400 }
      );
    }

    const anthropic = createAnthropicClient();

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      system: P8_MATCH_VACANTE,
      messages: [
        {
          role: 'user',
          content: `CV: ${JSON.stringify(cv)}\n\nVacante: ${vacante}`,
        },
      ],
    });

    const content =
      response.content[0].type === 'text' ? response.content[0].text : '';

    let matchData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        matchData = JSON.parse(jsonMatch[0]);
      } else {
        matchData = { match_porcentaje: 0 };
      }
    } catch (e) {
      matchData = { match_porcentaje: 0 };
    }

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
