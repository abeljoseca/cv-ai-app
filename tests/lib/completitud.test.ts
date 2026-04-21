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
    telefono: null,
    ciudad: null,
    pais: null,
    profesion_perfil: null,
    profesiones_inferidas: [],
    resumen_profesional: null,
    puntaje_completitud: 0,
    onboarding_completado: false,
    plan: 'gratuito',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  it('debe calcular puntaje mínimo sin datos adicionales', () => {
    const puntaje = calcularPuntajeCompletitud(baseProfile, [], [], [], [], []);
    expect(puntaje).toBe(15); // nombre + apellido (10) + email (5)
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
      {
        id: '1',
        user_id: 'test-id',
        empresa: 'Empresa1',
        cargo: 'Cargo1',
        fecha_inicio: '2020',
        fecha_fin: '2022',
        descripcion: 'Desc',
        activo: false,
        created_at: new Date().toISOString(),
      },
      {
        id: '2',
        user_id: 'test-id',
        empresa: 'Empresa2',
        cargo: 'Cargo2',
        fecha_inicio: '2022',
        fecha_fin: null,
        descripcion: 'Desc',
        activo: false,
        created_at: new Date().toISOString(),
      },
    ];

    const educaciones = [
      {
        id: '1',
        user_id: 'test-id',
        institucion: 'Universidad',
        titulo: 'Licenciatura',
        area: 'Informática',
        fecha_inicio: '2015',
        fecha_fin: '2019',
        created_at: new Date().toISOString(),
      },
    ];

    const habilidades = [
      { id: '1', user_id: 'test-id', nombre: 'JavaScript', created_at: new Date().toISOString() },
      { id: '2', user_id: 'test-id', nombre: 'TypeScript', created_at: new Date().toISOString() },
      { id: '3', user_id: 'test-id', nombre: 'React', created_at: new Date().toISOString() },
    ];

    const logros = [
      { id: '1', user_id: 'test-id', descripcion: 'Logro 1', created_at: new Date().toISOString() },
    ];

    const idiomas = [
      {
        id: '1',
        user_id: 'test-id',
        nombre: 'Español',
        nivel: 'Nativo',
        created_at: new Date().toISOString(),
      },
    ];

    const puntaje = calcularPuntajeCompletitud(profile, experiencias, educaciones, habilidades, logros, idiomas);

    // 20 (nombre+apellido+email) + 5 (foto) + 5 (ubicación) + 5 (profesión) + 30 (2 experiencias) + 10 (1 educación) + 5 (3+ habilidades) + 5 (1 logro) + 5 (idioma) + 5 (resumen) = 95
    expect(puntaje).toBeGreaterThanOrEqual(90);
    expect(puntaje).toBeLessThanOrEqual(100);
  });

  it('canGenerateCV debe retornar false si puntaje es menor a 30', () => {
    expect(canGenerateCV(29)).toBe(false);
    expect(canGenerateCV(30)).toBe(true);
  });

  it('getMensajeCompletitud debe retornar mensajes apropiados', () => {
    expect(getMensajeCompletitud(20)).toContain('muy incompleto');
    expect(getMensajeCompletitud(32)).toContain('muy básico');
    expect(getMensajeCompletitud(85)).toBeNull();
  });
});
