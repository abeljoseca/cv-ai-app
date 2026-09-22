-- Sistema de Embajadores y Referidos
-- Ejecutar en Supabase SQL Editor

-- ─── 1. Agregar columna is_embajador a profiles ───────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_embajador boolean NOT NULL DEFAULT false;

-- ─── 2. Perfil del embajador ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.embajador_perfil (
  id                         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                    uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  codigo_referido            text NOT NULL UNIQUE,
  porcentaje_comision        decimal(5,2) NOT NULL DEFAULT 25.00,
  max_porcentaje_descuento   decimal(5,2) NOT NULL DEFAULT 20.00,
  meses_recurrencia_mensual  integer NOT NULL DEFAULT 6,
  umbral_minimo_pago         decimal(10,2) NOT NULL DEFAULT 50.00,
  saldo_negativo_arrastrable decimal(10,2) NOT NULL DEFAULT 0.00,
  estado                     text NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'suspendido')),
  acuerdo_aceptado           boolean NOT NULL DEFAULT false,
  acuerdo_aceptado_at        timestamptz,
  created_at                 timestamptz DEFAULT now()
);

-- ─── 3. Códigos de descuento ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.codigos_descuento (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  embajador_id         uuid NOT NULL REFERENCES public.embajador_perfil(id) ON DELETE CASCADE,
  codigo               text NOT NULL UNIQUE,
  porcentaje_descuento decimal(5,2) NOT NULL,
  usos_maximos         integer,
  usos_actuales        integer NOT NULL DEFAULT 0,
  activo               boolean NOT NULL DEFAULT true,
  fecha_expiracion     timestamptz,
  created_at           timestamptz DEFAULT now()
);

-- ─── 4. Referidos ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.referidos (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  embajador_id              uuid NOT NULL REFERENCES public.embajador_perfil(id),
  usuario_referido_id       uuid UNIQUE REFERENCES public.profiles(id),
  codigo_referido_usado     text NOT NULL,
  codigo_descuento_usado    text,
  origen                    text NOT NULL CHECK (origen IN ('enlace', 'codigo')),
  fecha_clic_atribucion     timestamptz NOT NULL DEFAULT now(),
  fecha_registro            timestamptz,
  fecha_primera_suscripcion timestamptz,
  created_at                timestamptz DEFAULT now()
);

-- ─── 5. Comisiones ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.comisiones (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  embajador_id        uuid NOT NULL REFERENCES public.embajador_perfil(id),
  referido_id         uuid NOT NULL REFERENCES public.referidos(id),
  pago_origen_id      uuid NOT NULL UNIQUE REFERENCES public.pagos(id),
  tipo                text NOT NULL CHECK (tipo IN ('unica', 'recurrente')),
  monto_base          decimal(10,2) NOT NULL,
  porcentaje_aplicado decimal(5,2) NOT NULL,
  monto_comision      decimal(10,4) NOT NULL,
  estado              text NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'disponible', 'solicitada', 'pagada', 'anulada', 'rechazada')),
  fecha_generacion    timestamptz NOT NULL DEFAULT now(),
  fecha_disponible    timestamptz NOT NULL,
  created_at          timestamptz DEFAULT now()
);

-- ─── 6. Solicitudes de pago ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.solicitudes_pago (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  embajador_id         uuid NOT NULL REFERENCES public.embajador_perfil(id),
  monto_total          decimal(10,2) NOT NULL,
  comisiones_incluidas uuid[] NOT NULL,
  red_blockchain       text NOT NULL CHECK (red_blockchain IN ('TRON', 'POLYGON')),
  direccion_wallet     text NOT NULL,
  estado               text NOT NULL DEFAULT 'solicitada'
    CHECK (estado IN ('solicitada', 'en_proceso', 'pagada', 'rechazada')),
  fecha_solicitud      timestamptz NOT NULL DEFAULT now(),
  fecha_pago           timestamptz,
  hash_transaccion     text,
  nota_admin           text,
  created_at           timestamptz DEFAULT now()
);

-- ─── Índices ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_embajador_perfil_user_id    ON public.embajador_perfil(user_id);
CREATE INDEX IF NOT EXISTS idx_embajador_perfil_codigo     ON public.embajador_perfil(codigo_referido);
CREATE INDEX IF NOT EXISTS idx_codigos_descuento_emb       ON public.codigos_descuento(embajador_id);
CREATE INDEX IF NOT EXISTS idx_codigos_descuento_codigo    ON public.codigos_descuento(codigo);
CREATE INDEX IF NOT EXISTS idx_referidos_embajador         ON public.referidos(embajador_id);
CREATE INDEX IF NOT EXISTS idx_referidos_usuario           ON public.referidos(usuario_referido_id);
CREATE INDEX IF NOT EXISTS idx_comisiones_embajador        ON public.comisiones(embajador_id);
CREATE INDEX IF NOT EXISTS idx_comisiones_estado           ON public.comisiones(estado);
CREATE INDEX IF NOT EXISTS idx_comisiones_disponible       ON public.comisiones(fecha_disponible);
CREATE INDEX IF NOT EXISTS idx_solicitudes_embajador       ON public.solicitudes_pago(embajador_id);

-- ─── RLS ──────────────────────────────────────────────────────────────────
ALTER TABLE public.embajador_perfil  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.codigos_descuento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referidos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comisiones        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitudes_pago  ENABLE ROW LEVEL SECURITY;

-- embajador_perfil: each ambassador sees only their own row; admins see all
CREATE POLICY "Embajador lee su perfil" ON public.embajador_perfil
  FOR SELECT USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Admin escribe embajador_perfil" ON public.embajador_perfil
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- codigos_descuento: ambassador manages their own; anyone can read active codes (for validation at checkout)
CREATE POLICY "Embajador gestiona sus codigos" ON public.codigos_descuento
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.embajador_perfil WHERE id = embajador_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Lectura publica codigos activos" ON public.codigos_descuento
  FOR SELECT USING (activo = true);

-- referidos: ambassador sees their own; admin sees all
CREATE POLICY "Embajador lee sus referidos" ON public.referidos
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.embajador_perfil WHERE id = embajador_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- comisiones: ambassador sees their own; admin sees all and can update
CREATE POLICY "Embajador lee sus comisiones" ON public.comisiones
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.embajador_perfil WHERE id = embajador_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Admin escribe comisiones" ON public.comisiones
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- solicitudes_pago: ambassador manages their own; admin manages all
CREATE POLICY "Embajador gestiona sus solicitudes" ON public.solicitudes_pago
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.embajador_perfil WHERE id = embajador_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- ─── Helper RPC ──────────────────────────────────────────────────────────────
-- Safely increments usage counter for a discount code (called server-side only)
CREATE OR REPLACE FUNCTION public.increment_codigo_descuento_uso(codigo_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE public.codigos_descuento
     SET usos_actuales = usos_actuales + 1
   WHERE id = codigo_id;
$$;

-- ─── Auto-release commissions after holdback ──────────────────────────────────
-- Run as a cron job or call manually to move pendiente → disponible
CREATE OR REPLACE FUNCTION public.liberar_comisiones_disponibles()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE updated_count integer;
BEGIN
  UPDATE public.comisiones
     SET estado = 'disponible'
   WHERE estado = 'pendiente'
     AND fecha_disponible <= now();
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- ─── Grants ──────────────────────────────────────────────────────────────────
-- authenticated: respects RLS policies defined above
GRANT SELECT, INSERT, UPDATE, DELETE ON public.embajador_perfil  TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.codigos_descuento TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.referidos         TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comisiones        TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.solicitudes_pago  TO authenticated;

-- service_role: used by admin server client, bypasses RLS
GRANT ALL ON public.embajador_perfil  TO service_role;
GRANT ALL ON public.codigos_descuento TO service_role;
GRANT ALL ON public.referidos         TO service_role;
GRANT ALL ON public.comisiones        TO service_role;
GRANT ALL ON public.solicitudes_pago  TO service_role;