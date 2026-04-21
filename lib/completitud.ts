import { Profile, Experiencia, Educacion, Habilidad, Logro, Idioma } from '@/types';

export function calcularPuntajeCompletitud(
  profile: Profile,
  experiencias: Experiencia[],
  educaciones: Educacion[],
  habilidades: Habilidad[],
  logros: Logro[],
  idiomas: Idioma[]
): number {
  let puntaje = 0;

  // Capa 1: Datos básicos (máx. 30 pts)
  if (profile.nombre && profile.apellido) puntaje += 10;
  if (profile.email_cv) puntaje += 5;
  if (profile.foto_url) puntaje += 5;
  if (profile.profesion_perfil) puntaje += 5;
  if ((profile.telefono || profile.ciudad || profile.pais)) puntaje += 5;

  // Capa 2: Perfil profesional (máx. 70 pts)
  // Experiencia: 15 pts por entrada, máx 2 (30 pts)
  const exp_count = Math.min(experiencias.length, 2);
  puntaje += exp_count * 15;

  // Educación: 10 pts por entrada, máx 2 (20 pts)
  const edu_count = Math.min(educaciones.length, 2);
  puntaje += edu_count * 10;

  // Habilidades: 5 pts si hay al menos 3
  if (habilidades.length >= 3) puntaje += 5;

  // Logros: 5 pts si hay al menos 1
  if (logros.length >= 1) puntaje += 5;

  // Idiomas: 5 pts si hay al menos 1
  if (idiomas.length >= 1) puntaje += 5;

  // Resumen profesional: 5 pts si tiene ≥30 palabras útiles
  if (profile.resumen_profesional) {
    const words = profile.resumen_profesional.trim().split(/\s+/).length;
    if (words >= 30) puntaje += 5;
  }

  return Math.min(puntaje, 100);
}

export function getMensajeCompletitud(puntaje: number): string | null {
  if (puntaje < 30)
    return 'Tu perfil está muy incompleto. Complétalo para generar CVs de calidad.';
  if (puntaje < 35)
    return 'Tu CV será muy básico. Considera completar más información.';
  if (puntaje < 50)
    return 'Sería ideal completar más información para un mejor CV.';
  if (puntaje < 75)
    return 'Buen perfil, pero puedes mejorarlo añadiendo más detalles.';
  if (puntaje < 85)
    return 'Tu perfil es muy bueno.';
  return null;
}

export function canGenerateCV(puntaje: number): boolean {
  return puntaje >= 30;
}
