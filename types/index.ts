export type UserPlan = 'gratuito' | 'pro';
export type CryptoNetwork = 'TRON' | 'BSC' | 'MATIC';
export type PagoEstado = 'pendiente' | 'confirmado' | 'expirado' | 'fallido';
export type PagoTipo = 'cv_unico' | 'suscripcion_mensual' | 'suscripcion_anual' | 'inspiracion_descarga';

export interface Profile {
  id: string;
  nombre: string;
  apellido: string;
  email_cv: string;
  foto_url: string | null;
  linkedin_url: string | null;
  telefono: string | null;
  ciudad: string | null;
  pais: string | null;
  profesion_perfil: string | null;
  profesiones_inferidas: string[];
  resumen_profesional: string | null;
  puntaje_completitud: number;
  onboarding_completado: boolean;
  is_admin?: boolean;
  is_editor?: boolean;
  is_embajador?: boolean;
  plan: UserPlan;
  cvs_mirror_este_mes: number;
  cv_pendiente_pago_id: string | null;
  descarga_gratis_inspiracion_usada: boolean;
  created_at: string;
  updated_at: string;
}

export interface Pago {
  id: string;
  user_id: string;
  cv_id: string | null;
  cv_inspiracion_id: string | null;
  tipo: PagoTipo;
  monto: number;
  moneda: string;
  red: CryptoNetwork | null;
  estado: PagoEstado;
  nowpayments_payment_id: string | null;
  nowpayments_payment_status: string | null;
  direccion_wallet: string | null;
  monto_cripto: number | null;
  created_at: string;
  confirmed_at: string | null;
}

export interface Suscripcion {
  id: string;
  user_id: string;
  tipo: 'mensual' | 'anual';
  estado: 'activa' | 'cancelada' | 'expirada';
  pago_id: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  created_at: string;
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
  tipo?: 'tecnica' | 'blanda' | null;
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
  intencion: 'general' | 'job' | 'mirror';
  estilo: 'harvard' | 'stanford' | 'silicon-valley' | 'tech' | 'minimalist' | 'europass' | 'executive' | 'mirror';
  contenido_json: Record<string, any>;
  descripcion_vacante: string | null;
  match_porcentaje: number | null;
  modo: string | null;
  imagen_referencia_url: string | null;
  diseno_mirror_json: Record<string, any> | null;
  foto_cv_url: string | null;
  created_at: string;
}

export interface Certificacion {
  id: string;
  user_id: string;
  titulo: string;
  institucion: string;
  anio_egreso: string | null;
  created_at: string;
}

export interface Aplicacion {
  id: string;
  user_id: string;
  cv_id: string | null;
  empresa: string | null;
  cargo: string | null;
  fecha: string | null;
  estado: 'pending' | 'interviewing' | 'hired' | 'rejected' | 'no_response';
  nota: string | null;
  created_at: string;
}
