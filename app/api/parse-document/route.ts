import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createAnthropicClient } from '@/lib/anthropic';
import { rateLimit } from '@/lib/rate-limit';
import { normalizeProfileDate } from '@/lib/profile-date';
import { isPresentMarker, PROFILE_DATE_RULES } from '@/lib/profile-import';
import mammoth from 'mammoth';
import { NextRequest, NextResponse } from 'next/server';

const MAX_FILE_BYTES = 20 * 1024 * 1024 // 20 MB
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

const P3_PARSE_DOCUMENT = `Extrae información profesional de este documento (CV, LinkedIn, carta de presentación, etc).
Devuelve SOLO un JSON válido con esta estructura:
{
  "experiencia": [{"empresa": "string", "cargo": "string", "fecha_inicio": "string o null", "fecha_fin": "string o null", "descripcion": "string o null"}],
  "educacion": [{"institucion": "string", "titulo": "string", "area": "string o null", "fecha_inicio": "string o null", "fecha_fin": "string o null"}],
  "habilidades": [{"nombre": "string", "tipo": "tecnica" | "blanda"}],
  "idiomas": [{"nombre": "string", "nivel": "string o null"}],
  "logros": [{"descripcion": "string"}],
  "resumen": "string o null"
}

CLASIFICACIÓN DE HABILIDADES:
- tipo "tecnica": herramientas, tecnologías, lenguajes, frameworks, software, metodologías, plataformas, habilidades medibles de un campo específico. Ejemplos: Python, Excel, AutoCAD, SQL, SCRUM, Power BI, Photoshop, Contabilidad, Programación.
- tipo "blanda": habilidades interpersonales, de comunicación, actitud y comportamiento. Ejemplos: Liderazgo, Comunicación efectiva, Trabajo en equipo, Resolución de conflictos, Adaptabilidad, Creatividad, Empatía.

${PROFILE_DATE_RULES}

IMPORTANTE: Nunca inventar datos. Solo extraer lo que existe en el documento. Si no hay información de una sección, deja el array vacío.`;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No hay archivo' }, { status: 400 });
    }

    // Rate limit: 5 uploads per minute per user
    if (!(await rateLimit(user.id, 5, 60_000))) {
      return NextResponse.json({ error: 'Demasiadas solicitudes. Espera un momento.' }, { status: 429 });
    }

    // File size limit
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: 'El archivo es demasiado grande. Máximo 20 MB.' }, { status: 413 });
    }

    // Tipo permitido — por MIME o por extensión (los navegadores a veces envían
    // octet-stream para .docx).
    const mimeType = file.type || ''
    const name = file.name.toLowerCase()
    const isPdf  = mimeType === 'application/pdf' || name.endsWith('.pdf')
    const isTxt  = mimeType === 'text/plain'      || name.endsWith('.txt')
    const isDocx = mimeType === DOCX_MIME         || name.endsWith('.docx')
    if (!isPdf && !isTxt && !isDocx) {
      return NextResponse.json({ error: 'Tipo de archivo no permitido. Solo PDF, Word (.docx) y TXT.' }, { status: 415 });
    }

    const anthropic = createAnthropicClient();
    const buffer = await file.arrayBuffer();

    // Word (.docx) y TXT se procesan como texto; el PDF va por la API de documentos.
    let textForAI: string | null = null;
    if (isTxt) {
      textForAI = Buffer.from(buffer).toString('utf-8');
    } else if (isDocx) {
      try {
        const { value } = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
        textForAI = value;
      } catch {
        return NextResponse.json({ error: 'No se pudo leer el documento de Word. Prueba con un PDF.' }, { status: 422 });
      }
    }

    let response;
    if (textForAI !== null) {
      response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        system: P3_PARSE_DOCUMENT,
        messages: [{
          role: 'user',
          content: `Extrae la información profesional de este documento:\n\n${textForAI}`,
        }],
      });
    } else {
      // PDF — API de documentos
      const base64 = Buffer.from(buffer).toString('base64');
      response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        system: P3_PARSE_DOCUMENT,
        messages: [{
          role: 'user',
          content: [
            {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any -- el SDK tipa el bloque 'document' de forma incompleta
              type: 'document' as any,
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: base64,
              },
            },
            {
              type: 'text',
              text: 'Extrae la información profesional de este documento.',
            },
          ],
        }],
      });
    }

    const content = response.content[0]?.type === 'text' ? response.content[0].text : '';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- JSON extraído por la IA, forma dinámica
    let parsedData: any;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsedData = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      parsedData = null;
    }

    if (!parsedData) {
      return NextResponse.json({ error: 'No se pudo extraer información del documento' }, { status: 422 });
    }

    // Save to database using admin client (bypasses RLS)
    const admin = createAdminClient();

    if (parsedData.experiencia?.length > 0) {
      for (const exp of parsedData.experiencia) {
        if (exp.empresa && exp.cargo) {
          await admin.from('experiencia').insert({
            user_id: user.id,
            empresa: exp.empresa,
            cargo: exp.cargo,
            fecha_inicio: normalizeProfileDate(exp.fecha_inicio),
            fecha_fin: isPresentMarker(exp.fecha_fin) ? null : normalizeProfileDate(exp.fecha_fin),
            activo: isPresentMarker(exp.fecha_fin),
            descripcion: exp.descripcion || null,
          });
        }
      }
    }

    if (parsedData.educacion?.length > 0) {
      for (const edu of parsedData.educacion) {
        if (edu.institucion && edu.titulo) {
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
    }

    if (parsedData.habilidades?.length > 0) {
      for (const hab of parsedData.habilidades) {
        if (hab.nombre) {
          const tipo = hab.tipo === 'tecnica' || hab.tipo === 'blanda' ? hab.tipo : null
          await admin.from('habilidades').insert({ user_id: user.id, nombre: hab.nombre, tipo })
        }
      }
    }

    if (parsedData.idiomas?.length > 0) {
      for (const idioma of parsedData.idiomas) {
        if (idioma.nombre) {
          await admin.from('idiomas').insert({
            user_id: user.id,
            nombre: idioma.nombre,
            nivel: idioma.nivel || null,
          });
        }
      }
    }

    if (parsedData.logros?.length > 0) {
      for (const logro of parsedData.logros) {
        if (logro.descripcion) {
          await admin.from('logros').insert({ user_id: user.id, descripcion: logro.descripcion });
        }
      }
    }

    if (parsedData.resumen) {
      await admin.from('profiles').update({ resumen_profesional: parsedData.resumen }).eq('id', user.id);
    }

    return NextResponse.json({ success: true, extracted: parsedData });
  } catch (error) {
    console.error('Parse document error:', error);
    return NextResponse.json({ error: 'Error al procesar documento' }, { status: 500 });
  }
}
