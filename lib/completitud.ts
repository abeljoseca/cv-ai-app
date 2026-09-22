import { Profile, Experiencia, Educacion, Habilidad, Logro, Idioma } from '@/types';

function esEmailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

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
  if (profile.nombre?.trim() && profile.apellido?.trim()) puntaje += 10;
  if (profile.email_cv?.trim() && esEmailValido(profile.email_cv)) puntaje += 5;
  if (profile.foto_url) puntaje += 5;
  if (profile.profesion_perfil?.trim()) puntaje += 5;
  if (profile.telefono?.trim() && (profile.ciudad?.trim() || profile.pais?.trim())) puntaje += 5;

  // Capa 2: Perfil profesional (máx. 70 pts)

  // Experiencia: 15 pts por entrada válida, máx. 2
  const expValidas = experiencias.filter(e =>
    e.cargo?.trim() && e.empresa?.trim() && e.fecha_inicio
  );
  puntaje += Math.min(expValidas.length, 2) * 15;

  // Educación: 10 pts por entrada válida, máx. 2
  const eduValidas = educaciones.filter(e =>
    e.titulo?.trim() && e.institucion?.trim() && e.fecha_inicio
  );
  puntaje += Math.min(eduValidas.length, 2) * 10;

  // Habilidades: escalonado 0-2→0, 3-5→5, 6+→7
  const habCount = habilidades.filter(h => h.nombre?.trim()).length;
  if (habCount >= 6) puntaje += 7;
  else if (habCount >= 3) puntaje += 5;

  // Logros: escalonado 0→0, 1-2→5, 3+→8
  const logrosCount = logros.filter(l => l.descripcion?.trim()).length;
  if (logrosCount >= 3) puntaje += 8;
  else if (logrosCount >= 1) puntaje += 5;

  // Idiomas: 5 pts si hay al menos 1 válido
  if (idiomas.filter(i => i.nombre?.trim()).length >= 1) puntaje += 5;

  // resumen_profesional NO se usa para el puntaje de completitud

  return Math.min(puntaje, 100);
}

export function getMensajeCompletitud(puntaje: number): string | null {
  if (puntaje < 30)
    return 'Tu perfil aún no tiene suficiente información para generar un CV. Completa al menos los datos básicos para continuar.';
  if (puntaje <= 35)
    return 'Tu perfil tiene muy poca información, por lo que tu CV será bastante básico. Puedes continuar, pero te recomendamos completar más datos para obtener mejores resultados.';
  if (puntaje <= 50)
    return 'Agregar más información mejorará notablemente la calidad de tu CV. Aun así, ya puedes continuar con la generación.';
  if (puntaje <= 75)
    return 'Ya puedes generar un buen CV. Aun así, agregar más detalles puede hacerlo más completo y profesional.';
  if (puntaje <= 85)
    return 'Tu perfil está muy completo. Ya puedes generar un CV de alta calidad.';
  return 'Tu perfil está listo para generar tu CV.';
}

export function canGenerateCV(puntaje: number): boolean {
  return puntaje >= 30;
}
