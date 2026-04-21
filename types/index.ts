export type UserPlan = 'gratuito' | 'pro';

export interface Profile {
  id: string;
  nombre: string;
  apellido: string;
  email_cv: string;
  foto_url: string | null;
  telefono: string | null;
  ciudad: string | null;
  pais: string | null;
  profesion_perfil: string | null;
  profesiones_inferidas: string[];
  resumen_profesional: string | null;
  puntaje_completitud: number;
  onboarding_completado: boolean;
  plan: UserPlan;
  created_at: string;
  updated_at: string;
}

export interface Experiencia {
  id: string;
  user_id: string;
  empresa: string;
  cargo: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  descripcion: string | null;
  activo: boolean;
  created_at: string;
}

export interface Educacion {
  id: string;
  user_id: string;
  institucion: string;
  titulo: string;
  area: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  created_at: string;
}

export interface Habilidad {
  id: string;
  user_id: string;
  nombre: string;
  created_at: string;
}

export interface Logro {
  id: string;
  user_id: string;
  descripcion: string;
  created_at: string;
}

export interface Idioma {
  id: string;
  user_id: string;
  nombre: string;
  nivel: 'Básico' | 'Intermedio' | 'Avanzado' | 'Nativo' | null;
  created_at: string;
}

export interface CV {
  id: string;
  user_id: string;
  titulo: string | null;
  intencion: 'general' | 'vacante';
  estilo: 'classic' | 'modern' | 'minimal' | 'bold' | 'executive';
  contenido_json: Record<string, any>;
  descripcion_vacante: string | null;
  match_porcentaje: number | null;
  created_at: string;
}

export interface Aplicacion {
  id: string;
  user_id: string;
  cv_id: string | null;
  empresa: string | null;
  cargo: string | null;
  fecha: string | null;
  estado: 'En espera' | 'Entrevistando' | 'Contratado' | 'Rechazado' | 'Sin respuesta';
  nota: string | null;
  created_at: string;
}
