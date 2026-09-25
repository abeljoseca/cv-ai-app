// DOCX export — Pro feature, not live yet (see known issue: uses edu.fecha instead of
// fecha_inicio/fecha_fin; fix before launching). The old image-based PDF exporter was
// removed: image PDFs are unreadable by ATS. PDFs are generated server-side (/api/cv/[id]/pdf).
import { Document, Packer, Paragraph, HeadingLevel, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, convertInchesToTwip } from 'docx';

export async function exportToDOCX(
  data: {
    nombre: string;
    titulo?: string;
    resumen?: string;
    contacto?: {
      email: string;
      telefono?: string;
      ubicacion?: string;
    };
    experiencias?: Array<{
      empresa: string;
      cargo: string;
      fecha_inicio: string;
      fecha_fin?: string;
      descripcion?: string;
    }>;
    educacion?: Array<{
      institucion: string;
      titulo: string;
      area?: string;
      fecha: string;
    }>;
    habilidades?: string[];
    idiomas?: Array<{
      nombre: string;
      nivel?: string;
    }>;
    logros?: string[];
  },
  filename: string
) {
  const sections = [];

  // Header
  sections.push(
    new Paragraph({
      text: data.nombre,
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 100 },
    })
  );

  if (data.titulo) {
    sections.push(
      new Paragraph({
        text: data.titulo,
        spacing: { after: 200 },
      })
    );
  }

  // Contact
  if (data.contacto) {
    const contactInfo = [
      data.contacto.email,
      data.contacto.telefono,
      data.contacto.ubicacion,
    ]
      .filter(Boolean)
      .join(' | ');

    sections.push(
      new Paragraph({
        text: contactInfo,
        spacing: { after: 300 },
      })
    );
  }

  // Resumen
  if (data.resumen) {
    sections.push(
      new Paragraph({
        text: 'Resumen Profesional',
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 100 },
      }),
      new Paragraph({
        text: data.resumen,
        spacing: { after: 200 },
      })
    );
  }

  // Experiencia
  if (data.experiencias && data.experiencias.length > 0) {
    sections.push(
      new Paragraph({
        text: 'Experiencia Profesional',
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 100 },
      })
    );

    data.experiencias.forEach((exp) => {
      sections.push(
        new Paragraph({
          children: [new TextRun({
            text: exp.cargo,
            bold: true,
          })],
        }),
        new Paragraph({
          text: `${exp.empresa} | ${exp.fecha_inicio} ${exp.fecha_fin ? `- ${exp.fecha_fin}` : '- Presente'}`,
        })
      );

      if (exp.descripcion) {
        sections.push(
          new Paragraph({
            text: exp.descripcion,
            spacing: { after: 100 },
          })
        );
      }
    });

    sections.push(
      new Paragraph({
        text: '',
        spacing: { after: 100 },
      })
    );
  }

  // Educación
  if (data.educacion && data.educacion.length > 0) {
    sections.push(
      new Paragraph({
        text: 'Educación',
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 100 },
      })
    );

    data.educacion.forEach((edu) => {
      sections.push(
        new Paragraph({
          children: [new TextRun({
            text: edu.titulo,
            bold: true,
          })],
        }),
        new Paragraph({
          text: `${edu.institucion} | ${edu.fecha}`,
        })
      );

      if (edu.area) {
        sections.push(
          new Paragraph({
            text: edu.area,
          })
        );
      }

      sections.push(
        new Paragraph({
          text: '',
          spacing: { after: 100 },
        })
      );
    });
  }

  // Habilidades
  if (data.habilidades && data.habilidades.length > 0) {
    sections.push(
      new Paragraph({
        text: 'Habilidades',
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 100 },
      }),
      new Paragraph({
        text: data.habilidades.join(', '),
        spacing: { after: 200 },
      })
    );
  }

  // Idiomas
  if (data.idiomas && data.idiomas.length > 0) {
    sections.push(
      new Paragraph({
        text: 'Idiomas',
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 100 },
      })
    );

    data.idiomas.forEach((idioma) => {
      sections.push(
        new Paragraph({
          text: `${idioma.nombre}${idioma.nivel ? ` - ${idioma.nivel}` : ''}`,
        })
      );
    });

    sections.push(
      new Paragraph({
        text: '',
        spacing: { after: 200 },
      })
    );
  }

  // Logros
  if (data.logros && data.logros.length > 0) {
    sections.push(
      new Paragraph({
        text: 'Logros',
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 100 },
      })
    );

    data.logros.forEach((logro) => {
      sections.push(
        new Paragraph({
          text: `• ${logro}`,
        })
      );
    });
  }

  const doc = new Document({
    sections: [
      {
        children: sections,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
