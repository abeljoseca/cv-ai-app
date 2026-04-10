import { NextRequest, NextResponse } from 'next/server'
import { generateHarvardCV } from '@/lib/docx/templates/harvard'

export async function POST(request: NextRequest) {
  try {
    const { cvData, template } = await request.json()

    if (!cvData) {
      return NextResponse.json({ error: 'Faltan datos del CV' }, { status: 400 })
    }

    let buffer: Buffer

    // Por ahora solo Harvard — agregaremos más templates después
    buffer = await generateHarvardCV(cvData)

    const filename = `CV_${cvData.nombre_completo?.replace(/\s+/g, '_') ?? 'CV'}_${Date.now()}.docx`

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })

  } catch (error) {
    console.error('Error en /api/generate-docx:', error)
    return NextResponse.json({ error: 'Error generando el documento' }, { status: 500 })
  }
}