import { describe, it, expect } from 'vitest';
import { calcularPuntajeCompletitud, getMensajeCompletitud, canGenerateCV } from '@/lib/completitud';
import { Profile } from '@/types';

describe('Completitud', () => {
  const baseProfile: Profile = {
    id: 'test-id',
    nombre: 'Juan',
    apellido: 'Pérez',
    email_cv: 'juan@example.com',
    foto_url: null,
    linkedin_url: null,
    telefono: null,
    ciudad: null,
    pais: null,
    profesion_perfil: null,
    profesiones_inferidas: [],
    resumen_profesional: null,
    puntaje_completitud: 0,
    onboarding_completado: false,
    plan: 'gratuito',
    cvs_mirror_este_mes: 0,
    cv_pendiente_pago_id: null,
    descarga_gratis_inspiracion_usada: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  it('debe calcular puntaje mínimo sin datos adicionales', () => {
    const puntaje = calcularPuntajeCompletitud(baseProfile, [], [], [], [], []);
    expect(puntaje).toBe(15); // nombre + apellido (10) + email (5)
  });

  it('debe requerir telefono Y ciudad/pais para los 5 pts de contacto', () => {
    const soloTelefono = { ...baseProfile, telefono: '123456789' };
    expect(calcularPuntajeCompletitud(soloTelefono, [], [], [], [], [])).toBe(15);

    const soloUbicacion = { ...baseProfile, ciudad: 'Madrid' };
    expect(calcularPuntajeCompletitud(soloUbicacion, [], [], [], [], [])).toBe(15);

    const telefonoYCiudad = { ...baseProfile, telefono: '123456789', ciudad: 'Madrid' };
    expect(calcularPuntajeCompletitud(telefonoYCiudad, [], [], [], [], [])).toBe(20);
  });

  it('debe contar solo experiencias con fecha_inicio válida', () => {
    const sinFecha = [{
      id: '1', user_id: 'test-id', empresa: 'Empresa', cargo: 'Cargo',
      fecha_inicio: null, fecha_fin: null, descripcion: null, activo: false,
      created_at: new Date().toISOString(),
    }];
    expect(calcularPuntajeCompletitud(baseProfile, sinFecha, [], [], [], [])).toBe(15);

    const conFecha = [{ ...sinFecha[0], fecha_inicio: '2020' }];
    expect(calcularPuntajeCompletitud(baseProfile, conFecha, [], [], [], [])).toBe(30);
  });

  it('habilidades: escalonado 0-2→0, 3-5→5, 6+→7', () => {
    const mkHab = (n: number) =>
      Array.from({ length: n }, (_, i) => ({ id: String(i), user_id: 'test-id', nombre: `Hab${i}`, created_at: '' }));

    expect(calcularPuntajeCompletitud(baseProfile, [], [], mkHab(2), [], [])).toBe(15);
    expect(calcularPuntajeCompletitud(baseProfile, [], [], mkHab(3), [], [])).toBe(20);
    expect(calcularPuntajeCompletitud(baseProfile, [], [], mkHab(5), [], [])).toBe(20);
    expect(calcularPuntajeCompletitud(baseProfile, [], [], mkHab(6), [], [])).toBe(22);
  });

  it('logros: escalonado 0→0, 1-2→5, 3+→8', () => {
    const mkLogro = (n: number) =>
      Array.from({ length: n }, (_, i) => ({ id: String(i), user_id: 'test-id', descripcion: `Logro ${i}`, created_at: '' }));

    expect(calcularPuntajeCompletitud(baseProfile, [], [], [], mkLogro(0), [])).toBe(15);
    expect(calcularPuntajeCompletitud(baseProfile, [], [], [], mkLogro(1), [])).toBe(20);
    expect(calcularPuntajeCompletitud(baseProfile, [], [], [], mkLogro(2), [])).toBe(20);
    expect(calcularPuntajeCompletitud(baseProfile, [], [], [], mkLogro(3), [])).toBe(23);
  });

  it('resumen_profesional NO cuenta para el puntaje', () => {
    const conResumen = { ...baseProfile, resumen_profesional: 'Un resumen muy largo con más de treinta palabras para verificar que no cuenta en el puntaje de completitud del perfil' };
    expect(calcularPuntajeCompletitud(conResumen, [], [], [], [], [])).toBe(15);
  });

  it('debe calcular puntaje completo con todos los datos', () => {
    const profile: Profile = {
      ...baseProfile,
      foto_url: 'http://example.com/photo.jpg',
      telefono: '123456789',
      ciudad: 'Madrid',
      pais: 'España',
      profesion_perfil: 'Ingeniero',
      resumen_profesional: 'Un resumen profesional con más de 30 palabras para que sea válido y completo',
    };

    const experiencias = [
      { id: '1', user_id: 'test-id', empresa: 'Empresa1', cargo: 'Cargo1', fecha_inicio: '2020', fecha_fin: '2022', descripcion: 'Desc', activo: false, created_at: '' },
      { id: '2', user_id: 'test-id', empresa: 'Empresa2', cargo: 'Cargo2', fecha_inicio: '2022', fecha_fin: null, descripcion: 'Desc', activo: false, created_at: '' },
    ];
    const educaciones = [
      { id: '1', user_id: 'test-id', institucion: 'Universidad', titulo: 'Licenciatura', area: 'Informática', fecha_inicio: '2015', fecha_fin: '2019', created_at: '' },
    ];
    const habilidades = [
      { id: '1', user_id: 'test-id', nombre: 'JavaScript', created_at: '' },
      { id: '2', user_id: 'test-id', nombre: 'TypeScript', created_at: '' },
      { id: '3', user_id: 'test-id', nombre: 'React', created_at: '' },
    ];
    const logros = [
      { id: '1', user_id: 'test-id', descripcion: 'Logro 1', created_at: '' },
    ];
    const idiomas = [
      { id: '1', user_id: 'test-id', nombre: 'Español', nivel: 'Nativo' as const, created_at: '' },
    ];

    const puntaje = calcularPuntajeCompletitud(profile, experiencias, educaciones, habilidades, logros, idiomas);
    // Capa1(30) + 2exp(30) + 1edu(10) + 3hab(5) + 1logro(5) + 1idioma(5) = 85
    expect(puntaje).toBe(85);
  });

  it('canGenerateCV debe retornar false si puntaje es menor a 30', () => {
    expect(canGenerateCV(29)).toBe(false);
    expect(canGenerateCV(30)).toBe(true);
  });

  it('getMensajeCompletitud debe retornar mensajes apropiados', () => {
    expect(getMensajeCompletitud(20)).toContain('suficiente información');
    expect(getMensajeCompletitud(32)).toContain('muy poca información');
    expect(getMensajeCompletitud(35)).toContain('muy poca información');
    expect(getMensajeCompletitud(50)).toContain('Agregar más información');
    expect(getMensajeCompletitud(75)).toContain('buen CV');
    expect(getMensajeCompletitud(85)).toContain('muy completo');
    expect(getMensajeCompletitud(86)).toContain('listo para generar');
  });
});
