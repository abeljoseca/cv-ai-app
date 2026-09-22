import { createClient } from '@/lib/supabase/server';
import { createAnthropicClient } from '@/lib/anthropic';
import { rateLimit } from '@/lib/rate-limit';
import { NextRequest, NextResponse } from 'next/server';

const P9_REVIEW_CV = `Eres un corrector de texto profesional. Revisa el JSON del CV del usuario.
Corrige solo errores obvios de ortografía y gramática en los valores de texto.
No altera hechos, nombres, fechas ni números.
No inventa contenido ni cambia el sentido.
Devuelve JSON con exactamente los mismos campos pero con el texto corregido.
Si no hay errores, devuelve el JSON sin cambios.`;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    if (!rateLimit(user.id, 10, 60_000)) {
      return NextResponse.json({ error: 'Demasiadas solicitudes. Espera un momento.' }, { status: 429 });
    }

    const { content } = await request.json();

    if (!content) {
      return NextResponse.json({ error: 'No hay contenido para revisar' }, { status: 400 });
    }

    let cvObj: any;
    try {
      cvObj = typeof content === 'string' ? JSON.parse(content) : content;
    } catch {
      return NextResponse.json({ error: 'Contenido inválido' }, { status: 400 });
    }

    const anthropic = createAnthropicClient();

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      system: P9_REVIEW_CV,
      messages: [
        {
          role: 'user',
          content: `Corrige este CV:\n${JSON.stringify(cvObj, null, 2)}`,
        },
      ],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    let corrected: string;
    let corrections_made = false;

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const correctedObj = JSON.parse(jsonMatch[0]);
        // Defensive re-attachment: this prompt was never told these fields exist, and a
        // "return the same JSON with corrected text" instruction to an LLM is not a
        // structural guarantee — it can silently drop fields it doesn't recognize,
        // especially under max_tokens pressure on a large CV. These are computed data,
        // never prose, so they must never depend on the model choosing to echo them back.
        if (cvObj.habilidades_tecnicas !== undefined) correctedObj.habilidades_tecnicas = cvObj.habilidades_tecnicas;
        if (cvObj.habilidades_blandas !== undefined) correctedObj.habilidades_blandas = cvObj.habilidades_blandas;
        corrected = JSON.stringify(correctedObj);
        corrections_made = JSON.stringify(correctedObj) !== JSON.stringify(cvObj);
      } else {
        corrected = JSON.stringify(cvObj);
      }
    } catch {
      corrected = JSON.stringify(cvObj);
    }

    return NextResponse.json({ success: true, corrected, corrections_made });
  } catch (error: any) {
    console.error('Review CV error:', error);
    return NextResponse.json({ error: 'Error al revisar CV' }, { status: 500 });
  }
}
