import { createAnthropicClient } from '@/lib/anthropic';
import { NextRequest, NextResponse } from 'next/server';

const P9_REVIEW_CV = `Revisa el CV editado por el usuario.
Corrige ortografía y gramática.
Sugiere mejoras de redacción si es necesario.
Devuelve JSON con:
- cv_mejorado: objeto con el CV corregido
- cambios: string[] (lista de cambios realizados)
- recomendaciones: string[] (sugerencias adicionales)`;

export async function POST(request: NextRequest) {
  try {
    const { cv } = await request.json();

    if (!cv) {
      return NextResponse.json(
        { error: 'No hay CV para revisar' },
        { status: 400 }
      );
    }

    const anthropic = createAnthropicClient();

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      system: P9_REVIEW_CV,
      messages: [
        {
          role: 'user',
          content: `Revisa y mejora este CV: ${JSON.stringify(cv)}`,
        },
      ],
    });

    const content =
      response.content[0].type === 'text' ? response.content[0].text : '';

    let reviewData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        reviewData = JSON.parse(jsonMatch[0]);
      } else {
        reviewData = { cv_mejorado: cv, cambios: [] };
      }
    } catch (e) {
      reviewData = { cv_mejorado: cv, cambios: [] };
    }

    return NextResponse.json({
      success: true,
      review: reviewData,
    });
  } catch (error: any) {
    console.error('Review CV error:', error);

    return NextResponse.json(
      { error: 'Error al revisar CV' },
      { status: 500 }
    );
  }
}
