import { describe, expect, it } from 'vitest'
import { mapEuropassObjective, type EuropassProfileSource } from '@/lib/cv/styles/europass/mapper'
import { drivingLicenceLabel, formatBirthDate, iscedLabel } from '@/lib/cv/styles/europass/format'
import type { Profile } from '@/types'

const base = { user_id: 'u', created_at: '' }

function source(overrides: Partial<EuropassProfileSource> = {}): EuropassProfileSource {
  return {
    profile: {
      id: 'u', nombre: 'Laura', apellido: 'Fernández', email_cv: 'laura@example.com', foto_url: null,
      linkedin_url: 'https://www.linkedin.com/in/laura/', telefono: '+34611223344', ciudad: 'Madrid', pais: 'España',
      profesion_perfil: 'Coordinadora de Operaciones', resumen_profesional: 'Diez años en operaciones.',
      fecha_nacimiento: '1994-03-14', nacionalidad: 'Española', direccion: null,
      permiso_conducir: ['B', 'ZZ'], digcomp: { informacion_datos: 'Avanzado' },
      publicaciones: [], ponencias: ['Ponencia 2023'], voluntariado: [], premios_becas: [], afiliaciones: [], anexos: [],
    } as unknown as Profile,
    experiencias: [
      { ...base, id: 'e1', empresa: 'Acme', cargo: 'Analista', fecha_inicio: '2018', fecha_fin: '2020-06', activo: false, descripcion: 'Gestión de reportes.', ciudad: 'Madrid', pais: 'España', sector_nace: null },
      { ...base, id: 'e2', empresa: 'Globex', cargo: 'Coordinadora', fecha_inicio: '2021-03', fecha_fin: null, activo: true, descripcion: null },
      { ...base, id: 'e3', empresa: 'Sin fecha', cargo: 'Becaria', fecha_inicio: null, fecha_fin: null, activo: false, descripcion: null },
    ],
    educaciones: [
      { ...base, id: 'd1', institucion: 'UCM', titulo: 'Grado en ADE', area: 'Administración', fecha_inicio: null, fecha_fin: '2016', nivel_isced: 6, materias: null },
    ],
    idiomas: [
      { ...base, id: 'i1', nombre: 'Español', nivel: 'Nativo', nivel_cefr: 'Nativo' },
      { ...base, id: 'i2', nombre: 'Inglés', nivel: 'C1', nivel_cefr: 'C1' },
      { ...base, id: 'i3', nombre: 'Francés', nivel: 'B2', nivel_cefr: 'B2', niveles_cefr: { comprension_auditiva: 'C1', comprension_lectora: 'C1', interaccion_oral: 'B2', expresion_oral: 'B2', expresion_escrita: 'B1' }, certificacion: 'DELF B2' },
      { ...base, id: 'i4', nombre: 'Alemán', nivel: 'Intermedio', nivel_cefr: null },
    ],
    logros: [
      { ...base, id: 'l1', descripcion: 'Reduje el cierre de 18 a 11 días.', experiencia_id: 'e1' },
      { ...base, id: 'l2', descripcion: 'Premio a la excelencia 2021.', experiencia_id: null },
    ],
    habilidades: [
      { ...base, id: 'h1', nombre: 'Excel', tipo: 'tecnica' },
      { ...base, id: 'h2', nombre: 'Liderazgo', tipo: 'blanda' },
    ],
    certificaciones: [
      { ...base, id: 'c1', titulo: 'Lean Six Sigma Green Belt', institucion: 'ASQ', anio_egreso: '2019' },
      { ...base, id: 'c2', titulo: 'Curso de Power BI', institucion: 'Sin institución', anio_egreso: null },
    ],
    ...overrides,
  }
}

describe('mapEuropassObjective', () => {
  const { content, aiSources } = mapEuropassObjective(source())

  it('fills the header from the profile, with code-made formats', () => {
    const ip = content.informacion_personal
    expect(ip.nombre_completo).toBe('Laura Fernández')
    expect(ip.titulo_profesional).toBe('Coordinadora de Operaciones')
    expect(ip.telefono).toBe('+34 611 22 33 44')
    expect(ip.ciudad_pais).toBe('Madrid, España')
    // Identity data never comes from the profile row and never lands in the CV.
    expect(ip.fecha_nacimiento).toEqual({ activo: false, valor: null })
    expect(ip.nacionalidad).toEqual({ activo: false, valor: null })
    expect(ip.direccion).toEqual({ activo: false, valor: null })
    expect(ip.foto.activo).toBe(false)
    expect(ip.perfiles).toEqual([{ tipo: 'linkedin', url: 'https://www.linkedin.com/in/laura/', activo: true }])
  })

  it('switches identity fields on when the (decrypted) data exists, without storing the values', () => {
    const ip = mapEuropassObjective(source(), { identity: { fecha_nacimiento: '1994-03-14', nacionalidad: 'Española' } }).content.informacion_personal
    expect(ip.fecha_nacimiento).toEqual({ activo: true, valor: null })
    expect(ip.nacionalidad).toEqual({ activo: true, valor: null })
    expect(ip.direccion).toEqual({ activo: false, valor: null })
  })

  it('uses the vacancy title when given', () => {
    const r = mapEuropassObjective(source(), { tituloProfesional: 'Jefa de Operaciones' })
    expect(r.content.informacion_personal.titulo_profesional).toBe('Jefa de Operaciones')
  })

  it('orders experience reverse-chronologically and formats dates without inventing months', () => {
    const exp = content.experiencia_laboral
    expect(exp.map(e => e._id)).toEqual(['e2', 'e1', 'e3'])
    expect(exp[0].fecha_inicio).toBe('03/2021')
    expect(exp[0].fecha_fin).toBe('actualidad')
    expect(exp[1].fecha_inicio).toBe('2018')
    expect(exp[1].fecha_fin).toBe('06/2020')
    expect(exp[1].lugar).toEqual({ activo: true, valor: 'Madrid, España' })
    expect(exp[2].fecha_inicio).toBeNull()
    expect(exp.every(e => e.bullets.length === 0)).toBe(true)
  })

  it('never lets the AI touch objective data: sobre_mi and bullets start empty', () => {
    expect(content.sobre_mi).toEqual({ texto: null, _fuentes: [] })
  })

  it('maps languages: native, pre-filled, confirmed breakdown and unconfirmed', () => {
    const cl = content.competencias_linguisticas
    expect(cl.lenguas_maternas).toEqual(['Español'])
    const [ingles, frances, aleman] = cl.otras_lenguas
    expect(ingles.niveles).toEqual({ comprension_auditiva: 'C1', comprension_lectora: 'C1', interaccion_oral: 'C1', expresion_oral: 'C1', expresion_escrita: 'C1' })
    expect(ingles.niveles_confirmados).toBe(false)
    expect(frances.niveles?.expresion_escrita).toBe('B1')
    expect(frances.niveles_confirmados).toBe(true)
    expect(frances.certificacion).toEqual({ activo: true, valor: 'DELF B2' })
    expect(aleman.niveles).toBeNull()
  })

  it('splits skills into digital tools and other competences', () => {
    expect(content.competencias_digitales.herramientas).toEqual(['Excel'])
    expect(content.otras_competencias).toEqual(['Liderazgo'])
  })

  it('never shows a partial DigComp and drops invalid licence categories', () => {
    expect(content.competencias_digitales.digcomp.activo).toBe(false)
    expect(content.permiso_conducir).toEqual({ activo: true, categorias: ['B'] })
  })

  it('sends job-linked logros to the AI sources and the rest to Información adicional', () => {
    expect(content.informacion_adicional.logros_destacados).toEqual({ activo: true, items: ['Premio a la excelencia 2021.'] })
    expect(content.informacion_adicional.ponencias.activo).toBe(true)
    expect(content.informacion_adicional.activo).toBe(true)
    const e1 = aiSources.experiencias.find(e => e.ref === 'exp:e1')!
    expect(e1.logros).toEqual([{ ref: 'logro:l1', texto: 'Reduje el cierre de 18 a 11 días.' }])
    expect(e1.descripcion).toEqual({ ref: 'exp:e1:descripcion', texto: 'Gestión de reportes.' })
    expect(aiSources.resumen).toEqual({ ref: 'perfil:resumen', texto: 'Diez años en operaciones.' })
  })

  it('does not mutate its input', () => {
    const src = source()
    const before = JSON.stringify(src)
    mapEuropassObjective(src)
    expect(JSON.stringify(src)).toBe(before)
  })
})

describe('certifications inside Educación y formación', () => {
  const { content } = mapEuropassObjective(source())
  const ef = content.educacion_formacion

  it('lists studies and certifications together, reverse-chronologically', () => {
    expect(ef.map(x => x._id)).toEqual(['c1', 'd1', 'c2'])
    expect(ef[0]).toMatchObject({ origen: 'certificacion', titulo: 'Lean Six Sigma Green Belt', institucion: 'ASQ', fecha_inicio: null, fecha_fin: '2019' })
    expect(ef[1]).toMatchObject({ origen: 'educacion', area: 'Administración', nivel_isced: { activo: true, valor: 6 } })
  })

  it('never prints the import placeholder "Sin institución"', () => {
    expect(ef[2].institucion).toBe('')
  })
})

describe('europass formats', () => {
  it('formats birth date, ISCED and licence labels', () => {
    expect(formatBirthDate('1994-03-14')).toBe('14/03/1994')
    expect(formatBirthDate(null)).toBeNull()
    expect(iscedLabel(7)).toBe('7 (Máster)')
    expect(iscedLabel(null)).toBeNull()
    expect(drivingLicenceLabel('B')).toBe('Categoría B')
  })
})
