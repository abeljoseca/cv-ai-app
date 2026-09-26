// Europass sample shown in the style selector (spec §11). A fixed, FICTIONAL demo persona
// rendered with the real template: core sections + the 3 typical activables (photo,
// nationality, driving licence), Estándar density, default color.
// The images are produced by `npm run samples` (scripts/samples) and a test fails if this
// data or the template change without regenerating them.

import type { EuropassContent } from './schema'

const off = { activo: false, valor: null }
const b = (texto: string, id: string) => ({ texto, _fuentes: [`exp:${id}:descripcion`], _origen: 'ia' as const })
const list = () => ({ activo: false, items: [] as string[] })

// Demo photo: public/muestras/europass-foto-demo.jpg when present (AI-generated, fictional
// person), otherwise a neutral silhouette. The generator injects the URL.
export function europassSample(fotoUrl: string): EuropassContent {
  return {
    schema: 'europass@2',
    informacion_personal: {
      nombre_completo: 'Laura Fernández Ibáñez',
      titulo_profesional: 'Coordinadora de Comunicación Institucional',
      telefono: '+34 611 223 344',
      email: 'laura.fernandez@email.com',
      ciudad_pais: 'Madrid, España',
      foto: { activo: true, url: fotoUrl },
      fecha_nacimiento: off,
      nacionalidad: { activo: true, valor: 'Española' },
      direccion: off,
      perfiles: [],
    },
    sobre_mi: {
      texto: 'Profesional de la comunicación institucional con cinco años de experiencia en el sector público y en organismos europeos, especializada en comunicación multilingüe y proyectos con financiación europea.',
      _fuentes: [], _origen: 'ia',
    },
    experiencia_laboral: [
      {
        _id: 'e1', cargo: 'Coordinadora de Comunicación Institucional', empleador: 'Representación Permanente de España ante la Unión Europea',
        fecha_inicio: '09/2022', fecha_fin: 'actualidad',
        bullets: [
          b('Coordinación del equipo de comunicación (12 personas).', 'e1'),
          b('Gestión del presupuesto anual de comunicación (1.250.000€).', 'e1'),
        ],
        lugar: off, sector_nace: off,
      },
      {
        _id: 'e2', cargo: 'Técnica de Proyectos Europeos', empleador: 'Ayuntamiento de Madrid, Área de Relaciones Internacionales',
        fecha_inicio: '02/2020', fecha_fin: '08/2022',
        bullets: [
          b('Gestión de proyectos financiados por fondos europeos (Horizonte Europa, Interreg).', 'e2'),
          b('Coordinación con socios institucionales en Francia, Italia y Portugal.', 'e2'),
        ],
        lugar: off, sector_nace: off,
      },
    ],
    educacion_formacion: [
      {
        _id: 'd1', origen: 'educacion', titulo: 'Máster en Administración Pública Europea', institucion: 'Université Libre de Bruxelles', area: null,
        fecha_inicio: '09/2017', fecha_fin: '06/2019', nivel_isced: off, lugar: off, materias: off,
      },
    ],
    competencias_linguisticas: {
      activo: true,
      lenguas_maternas: ['Español'],
      otras_lenguas: [
        { idioma: 'Francés', niveles: { comprension_auditiva: 'C1', comprension_lectora: 'C1', interaccion_oral: 'C1', expresion_oral: 'C1', expresion_escrita: 'B2' }, niveles_confirmados: true, certificacion: off },
        { idioma: 'Inglés', niveles: { comprension_auditiva: 'C1', comprension_lectora: 'C1', interaccion_oral: 'B2', expresion_oral: 'B2', expresion_escrita: 'B2' }, niveles_confirmados: true, certificacion: off },
      ],
    },
    competencias_digitales: {
      herramientas: ['Microsoft Office', 'Canva', 'Hootsuite', 'WordPress', 'Google Analytics'],
      digcomp: { activo: false, informacion_datos: null, comunicacion_colaboracion: null, creacion_contenido: null, seguridad: null, resolucion_problemas: null },
    },
    otras_competencias: ['Coordinación de equipos', 'Oratoria institucional', 'Negociación'],
    permiso_conducir: { activo: true, categorias: ['B'] },
    informacion_adicional: {
      activo: false, logros_destacados: list(), publicaciones: list(), ponencias: list(),
      voluntariado: list(), premios_becas: list(), afiliaciones: list(),
    },
    anexos: list(),
  }
}
