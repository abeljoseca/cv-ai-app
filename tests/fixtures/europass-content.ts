// The approved visual reference (estilos-de-cv/specs/europass-cv-ejemplo-v2.html) as
// europass@2 content, so the template can be checked against it field by field.

import type { EuropassContent } from '@/lib/cv/styles/europass/schema'

const off = { activo: false, valor: null }
const on = <T,>(valor: T) => ({ activo: true, valor })
const list = (items: string[]) => ({ activo: items.length > 0, items })
const b = (texto: string, id: string) => ({ texto, _fuentes: [`exp:${id}:descripcion`], _origen: 'ia' as const })

export function europassReferenceContent(): EuropassContent {
  return {
    schema: 'europass@2',
    informacion_personal: {
      nombre_completo: 'Laura Fernández Ibáñez',
      titulo_profesional: 'Coordinadora de Comunicación Institucional',
      telefono: '+34 611 223 344',
      email: 'laura.fernandez@email.com',
      ciudad_pais: 'Madrid, España',
      foto: { activo: false, url: null },
      fecha_nacimiento: on('14/03/1994'),
      nacionalidad: on('Española'),
      direccion: on('Calle Alcalá 142, 28009 Madrid, España'),
      perfiles: [{ tipo: 'linkedin', url: 'https://www.linkedin.com/in/laurafernandezib/', activo: true }],
    },
    sobre_mi: {
      texto: 'Profesional de la comunicación institucional con cinco años de experiencia en el sector público y en organismos europeos. Especialización en coordinación de equipos de comunicación, gestión de proyectos con financiación europea y comunicación multilingüe en español, francés e inglés.',
      _fuentes: ['perfil:resumen'], _origen: 'ia',
    },
    experiencia_laboral: [
      {
        _id: 'e1', cargo: 'Coordinadora de Comunicación Institucional', empleador: 'Representación Permanente de España ante la Unión Europea',
        fecha_inicio: '09/2022', fecha_fin: 'actualidad',
        bullets: [
          b('Coordinación del equipo de comunicación (12 personas) y de la estrategia de difusión multilingüe de la Representación.', 'e1'),
          b('Enlace con la Comisión Europea y el Parlamento Europeo en materia de comunicación institucional.', 'e1'),
          b('Gestión del presupuesto anual de comunicación (1.250.000€).', 'e1'),
          b('Supervisión de tres campañas informativas de alcance paneuropeo.', 'e1'),
        ],
        lugar: on('Bruselas, Bélgica'), sector_nace: on('O84 — Administración pública y defensa'),
      },
      {
        _id: 'e2', cargo: 'Técnica de Proyectos Europeos', empleador: 'Ayuntamiento de Madrid, Área de Relaciones Internacionales',
        fecha_inicio: '02/2020', fecha_fin: '08/2022',
        bullets: [
          b('Gestión de proyectos financiados por fondos europeos (Horizonte Europa, Interreg).', 'e2'),
          b('Redacción y presentación de propuestas de financiación ante la Comisión Europea.', 'e2'),
          b('Seguimiento presupuestario y justificación técnica de los proyectos adjudicados.', 'e2'),
          b('Coordinación con socios institucionales en Francia, Italia y Portugal.', 'e2'),
        ],
        lugar: on('Madrid, España'), sector_nace: on('O84 — Administración pública y defensa'),
      },
      {
        _id: 'e3', cargo: 'Becaria de Comunicación', empleador: 'Comité Económico y Social Europeo',
        fecha_inicio: '07/2019', fecha_fin: '01/2020',
        bullets: [
          b('Producción de contenidos para las redes sociales institucionales.', 'e3'),
          b('Apoyo en la organización logística de sesiones plenarias.', 'e3'),
          b('Traducción y revisión de documentos internos en español, francés e inglés.', 'e3'),
        ],
        lugar: on('Bruselas, Bélgica'), sector_nace: off,
      },
    ],
    educacion_formacion: [
      {
        _id: 'd1', origen: 'educacion', titulo: 'Máster en Administración Pública Europea', institucion: 'Université Libre de Bruxelles', area: null,
        fecha_inicio: '09/2017', fecha_fin: '06/2019', nivel_isced: on(7), lugar: on('Bruselas, Bélgica'),
        materias: on('Derecho institucional de la UE, Comunicación pública, Políticas comparadas'),
      },
      {
        _id: 'd2', origen: 'educacion', titulo: 'Grado en Periodismo', institucion: 'Universidad Complutense de Madrid', area: null,
        fecha_inicio: '09/2012', fecha_fin: '06/2016', nivel_isced: on(6), lugar: on('Madrid, España'),
        materias: on('Comunicación institucional, Redacción periodística, Relaciones internacionales'),
      },
    ],
    competencias_linguisticas: {
      lenguas_maternas: ['Español'],
      otras_lenguas: [
        { idioma: 'Francés', niveles: { comprension_auditiva: 'C1', comprension_lectora: 'C1', interaccion_oral: 'C1', expresion_oral: 'C1', expresion_escrita: 'B2' }, niveles_confirmados: true, certificacion: on('DELF C1, 2018') },
        { idioma: 'Inglés', niveles: { comprension_auditiva: 'C1', comprension_lectora: 'C1', interaccion_oral: 'B2', expresion_oral: 'B2', expresion_escrita: 'B2' }, niveles_confirmados: true, certificacion: on('Cambridge C1 Advanced, 2019') },
        { idioma: 'Italiano', niveles: { comprension_auditiva: 'B1', comprension_lectora: 'B2', interaccion_oral: 'B1', expresion_oral: 'B1', expresion_escrita: 'A2' }, niveles_confirmados: true, certificacion: off },
      ],
    },
    competencias_digitales: {
      herramientas: ['Microsoft Office', 'Canva', 'Hootsuite', 'WordPress', 'Google Analytics'],
      digcomp: {
        activo: true, informacion_datos: 'Avanzado', comunicacion_colaboracion: 'Avanzado', creacion_contenido: 'Intermedio',
        seguridad: 'Intermedio', resolucion_problemas: 'Intermedio',
      },
    },
    otras_competencias: ['Coordinación de equipos', 'Oratoria institucional', 'Negociación', 'Trabajo en entornos multiculturales'],
    permiso_conducir: { activo: true, categorias: ['B'] },
    informacion_adicional: {
      activo: true,
      logros_destacados: list([]),
      publicaciones: list([]),
      ponencias: list(['Jornada de Comunicación Pública Europea, Bruselas, 2023 — "Comunicar la UE a públicos jóvenes".']),
      voluntariado: list([]),
      premios_becas: list(['Beca de excelencia académica, Universidad Complutense de Madrid, 2015.']),
      afiliaciones: list(['Miembro de la Asociación Española de Comunicación Institucional (AECI) desde 2021.']),
    },
    anexos: list([
      'Título oficial del Máster en Administración Pública Europea (ULB)',
      'Certificado DELF C1',
      'Certificado Cambridge C1 Advanced',
    ]),
  }
}
