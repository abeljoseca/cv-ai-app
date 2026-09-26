// Style-selector sample for the styles still on the shared CVContent schema (Harvard,
// Stanford, Silicon Valley, Tech, Minimalist, Executive). Same FICTIONAL persona as the
// Europass sample; every optional field some template shows is filled, so no sample has
// holes. Regenerated with `npm run samples` (a test fails if it goes stale); each style
// gets its own sample data when it is standardized.

import type { CVContent } from '@/lib/cv/types/cv-content'

export const LEGACY_SAMPLE: CVContent = {
  nombre: 'Laura Fernández Ibáñez',
  titulo: 'Coordinadora de Comunicación Institucional',
  contacto: {
    email: 'laura.fernandez@email.com',
    telefono: '+34 611 223 344',
    ubicacion: 'Madrid, España',
    linkedin: 'linkedin.com/in/laurafernandez',
    github: null,
    web: null,
  },
  resumen: 'Profesional de la comunicación institucional con cinco años de experiencia en el sector público y en organismos europeos, especializada en comunicación multilingüe y proyectos con financiación europea.',
  resumen_ejecutivo: 'Cinco años liderando la comunicación institucional en el sector público y en organismos europeos: equipos multilingües, presupuestos de más de un millón de euros y campañas de alcance paneuropeo.',
  experiencias: [
    {
      empresa: 'Representación Permanente de España ante la Unión Europea',
      cargo: 'Coordinadora de Comunicación Institucional',
      fecha_inicio: '09/2022',
      fecha_fin: 'Presente',
      bullets: [
        'Coordino un equipo de comunicación de 12 personas y la estrategia de difusión multilingüe.',
        'Gestiono el presupuesto anual de comunicación (1.250.000€).',
        'Superviso tres campañas informativas de alcance paneuropeo.',
      ],
    },
    {
      empresa: 'Ayuntamiento de Madrid',
      cargo: 'Técnica de Proyectos Europeos',
      fecha_inicio: '02/2020',
      fecha_fin: '08/2022',
      bullets: [
        'Gestioné proyectos financiados por fondos europeos (Horizonte Europa, Interreg).',
        'Redacté propuestas de financiación ante la Comisión Europea.',
        'Coordiné socios institucionales en Francia, Italia y Portugal.',
      ],
    },
  ],
  educacion: [
    { institucion: 'Université Libre de Bruxelles', titulo: 'Máster en Administración Pública Europea', area: null, fecha_inicio: '2017', fecha_fin: '2019' },
    { institucion: 'Universidad Complutense de Madrid', titulo: 'Grado en Periodismo', area: null, fecha_inicio: '2012', fecha_fin: '2016' },
  ],
  habilidades: ['Comunicación institucional', 'Gestión de proyectos', 'Canva', 'Hootsuite', 'Google Analytics', 'Negociación'],
  habilidades_tecnicas: ['Canva', 'Hootsuite', 'Google Analytics', 'WordPress'],
  habilidades_blandas: ['Coordinación de equipos', 'Oratoria', 'Negociación'],
  idiomas: [
    { nombre: 'Español', nivel: 'Nativo' },
    { nombre: 'Francés', nivel: 'C1' },
    { nombre: 'Inglés', nivel: 'C1' },
  ],
  logros: ['Campaña "Europa en tu barrio" con 2 millones de impactos en 2023.'],
  proyectos: [
    { nombre: 'Portal de transparencia de fondos europeos', descripcion: 'Diseño y lanzamiento del portal público de seguimiento de proyectos financiados.', tecnologias: ['WordPress', 'Google Analytics'], url: null },
  ],
  tech_stack: { 'Comunicación': ['Canva', 'Hootsuite'], 'Análisis': ['Google Analytics'], 'Web': ['WordPress'] },
  areas_expertise: ['Comunicación institucional', 'Fondos europeos', 'Relaciones públicas', 'Comunicación multilingüe'],
  certificaciones: ['DELF C1 (francés)', 'Cambridge C1 Advanced (inglés)'],
  permiso_conduccion: 'B',
}
