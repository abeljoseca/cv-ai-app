import { createAdminClient } from '@/lib/supabase/admin';

export interface AppConfig {
  precio_cv_unico:    number;
  precio_mensual:     number;
  precio_anual:       number;
  precio_inspiracion: number;
}

const DEFAULTS: AppConfig = {
  precio_cv_unico:    2.99,
  precio_mensual:     9.99,
  precio_anual:       79,
  precio_inspiracion: 2.99,
};

export async function getConfig(): Promise<AppConfig> {
  try {
    const admin = createAdminClient();
    const { data } = await admin.from('configuracion').select('clave, valor');
    if (!data?.length) return DEFAULTS;
    const map = Object.fromEntries(data.map(r => [r.clave, r.valor]));
    return {
      precio_cv_unico:    parseFloat(map.precio_cv_unico    ?? '2.99'),
      precio_mensual:     parseFloat(map.precio_mensual     ?? '9.99'),
      precio_anual:       parseFloat(map.precio_anual       ?? '79'),
      precio_inspiracion: parseFloat(map.precio_inspiracion ?? '2.99'),
    };
  } catch {
    return DEFAULTS;
  }
}