import {
  Document,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
  Packer,
} from 'docx'

interface ExperienciaItem {
  empresa: string
  cargo: string
  periodo: string
  logros: string[]
  habilidades_usadas: string[]
}

interface EducacionItem {
  institucion: string
  titulo: string
  periodo: string
}

interface CVData {
  nombre_completo: string
  email: string
  telefono?: string
  ubicacion?: string
  linkedin?: string
  resumen_profesional: string
  experiencia: ExperienciaItem[]
  educacion: EducacionItem[]
  habilidades: string[]
  idiomas?: string[]
  certificaciones?: string[]
}

function sectionTitle(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: text.toUpperCase(),
        bold: true,
        size: 22,
        font: 'Georgia',
      }),
    ],
    spacing: { before: 300, after: 100 },
    border: {
      bottom: {
        color: '000000',
        space: 1,
        style: BorderStyle.SINGLE,
        size: 6,
      },
    },
  })
}

function bulletPoint(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: `• ${text}`,
        size: 20,
        font: 'Georgia',
      }),
    ],
    spacing: { before: 40, after: 40 },
    indent: { left: 360 },
  })
}

export async function generateHarvardCV(cvData: CVData): Promise<Buffer> {
  const sections: Paragraph[] = []

  // Nombre
  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: cvData.nombre_completo || 'Sin nombre',
          bold: true,
          size: 36,
          font: 'Georgia',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    })
  )

  // Contacto
  const contactParts = [cvData.email || '']
  if (cvData.telefono) contactParts.push(cvData.telefono)
  if (cvData.ubicacion) contactParts.push(cvData.ubicacion)
  if (cvData.linkedin) contactParts.push(cvData.linkedin)

  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: contactParts.filter(Boolean).join(' | '),
          size: 18,
          font: 'Georgia',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    })
  )

  // Resumen
  if (cvData.resumen_profesional) {
    sections.push(sectionTitle('Resumen Profesional'))
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: cvData.resumen_profesional,
            size: 20,
            font: 'Georgia',
          }),
        ],
        spacing: { before: 100, after: 100 },
      })
    )
  }

  // Experiencia
  if (cvData.experiencia && cvData.experiencia.length > 0) {
    sections.push(sectionTitle('Experiencia Profesional'))

    for (const exp of cvData.experiencia) {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: exp.cargo || '',
              bold: true,
              size: 22,
              font: 'Georgia',
            }),
            new TextRun({
              text: exp.empresa ? `  —  ${exp.empresa}` : '',
              size: 22,
              font: 'Georgia',
            }),
          ],
          spacing: { before: 200, after: 40 },
        })
      )

      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: exp.periodo || '',
              size: 18,
              italics: true,
              font: 'Georgia',
              color: '666666',
            }),
          ],
          spacing: { after: 80 },
        })
      )

      if (exp.logros && exp.logros.length > 0) {
        for (const logro of exp.logros) {
          if (logro) sections.push(bulletPoint(logro))
        }
      }
    }
  }

  // Educación
  if (cvData.educacion && cvData.educacion.length > 0) {
    sections.push(sectionTitle('Educación'))

    for (const edu of cvData.educacion) {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: edu.titulo || '',
              bold: true,
              size: 22,
              font: 'Georgia',
            }),
          ],
          spacing: { before: 200, after: 40 },
        })
      )

      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${edu.institucion || ''}  |  ${edu.periodo || ''}`,
              size: 18,
              italics: true,
              font: 'Georgia',
              color: '666666',
            }),
          ],
          spacing: { after: 80 },
        })
      )
    }
  }

  // Habilidades
  if (cvData.habilidades && cvData.habilidades.length > 0) {
    sections.push(sectionTitle('Habilidades'))
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: cvData.habilidades.filter(Boolean).join(' · '),
            size: 20,
            font: 'Georgia',
          }),
        ],
        spacing: { before: 100, after: 100 },
      })
    )
  }

  // Idiomas
  if (cvData.idiomas && cvData.idiomas.length > 0) {
    sections.push(sectionTitle('Idiomas'))
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: cvData.idiomas.filter(Boolean).join(' · '),
            size: 20,
            font: 'Georgia',
          }),
        ],
        spacing: { before: 100, after: 100 },
      })
    )
  }

  // Certificaciones
  if (cvData.certificaciones && cvData.certificaciones.length > 0) {
    sections.push(sectionTitle('Certificaciones'))
    for (const cert of cvData.certificaciones) {
      if (cert) sections.push(bulletPoint(cert))
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1080,
              right: 1080,
              bottom: 1080,
              left: 1080,
            },
          },
        },
        children: sections,
      },
    ],
  })

  const buffer = await Packer.toBuffer(doc)
  return buffer
}