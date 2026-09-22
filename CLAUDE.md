# CLAUDE.md — Momentum

Fuente única de verdad para el desarrollo de Momentum (repo interno: Resumint/Resumika — nombres de marca en transición, el código y la base de datos aún usan "resumint"/español en varios lugares). Léelo completo antes de escribir código.

Reescrito por completo el 2026-09-22 para reflejar el estado real del producto (Fase 7 del plan maestro). Si algo aquí contradice el código, **confía en el código** y corrige este archivo — es exactamente el tipo de desactualización que esta reescritura buscaba eliminar.

---

## Qué es Momentum

Momentum es una SaaS que usa IA para ayudar a cualquier persona a crear CVs profesionales de alta calidad sin saber diseño ni redacción, **basándose exclusivamente en su experiencia real** — la IA nunca inventa cargos, logros, habilidades ni cifras que el usuario no haya proporcionado.

El usuario construye un **perfil profesional vivo** (conversando con la IA, subiendo un documento, o importando su LinkedIn) y desde ahí genera tantos CVs como necesite: un CV general, un CV adaptado a una vacante específica, o un diseño visual premium (CV Studio). Puede además hacer seguimiento de las vacantes a las que aplica.

---

## Stack técnico

- **Framework:** Next.js 16 (App Router), TypeScript estricto
- **Base de datos / Auth / Storage:** Supabase (`@supabase/ssr`, cookies, flujo PKCE)
- **IA:** Anthropic — `claude-sonnet-4-6` para generación de CV (calidad), `claude-haiku-4-5-20251001` para todo lo demás (extracción, chat, corrección, análisis de vacante — costo/latencia)
- **Pagos:** NOWPayments (cripto — USDT en BSC y Polygon; TRON deshabilitado, ver sección Planes). PayPal para la suscripción Pro está planeado pero **no implementado todavía** — es la última fase pendiente del plan maestro.
- **Rate limiting:** Upstash Redis (`@upstash/ratelimit` + `@upstash/redis`), con fallback en memoria si no hay credenciales configuradas
- **Editor visual (CV Studio):** Konva.js (`src/features/cv-inspiracion/`) — canvas de arrastrar/soltar, capas, exportación
- **Exportación:** PDF vía `html2canvas` + `jsPDF` (paginado A4); DOCX vía el paquete `docx` (documento real generado sección por sección) — ambos en `lib/export.ts`, **ambos ya implementados y en uso**, no son stubs
- **Scraping de LinkedIn:** Apify (`harvestapi/linkedin-profile-scraper`), cacheado en `linkedin_profiles_cache`
- **Deploy:** Vercel

---

## Principios que nunca se violan

1. El sistema **nunca inventa datos** del usuario — ni la IA de generación, ni la de importación de LinkedIn, ni la de corrección.
2. La IA puede reorganizar, resumir, redactar mejor y priorizar — nunca fabricar experiencia, cargos, logros, habilidades o cifras inexistentes. Un resultado cualitativo fuerte y honesto siempre le gana a una cifra forzada.
3. `profesion_perfil` es intocable: solo el usuario la define. Ningún PDF, chat ni importación de LinkedIn la sobreescribe.
4. Nunca mostrar errores técnicos crudos al usuario.
5. El bloqueo de "un CV sin pagar a la vez" (Plan Inicio) se valida **siempre en el servidor** (`user_has_unpaid_cv()` SQL, chequeada en vivo — nunca un puntero cacheado), nunca solo en la UI.
6. Cualquier endpoint que escriba dinero real (pagos, comisiones, descuentos) recalcula todo server-side — nunca confía en un precio o porcentaje que venga del cliente.

---

## 🎨 Identidad visual y sistema de diseño

**Skill de referencia:** `ui-ux-pro-max`

### Dirección estética
Producto nativo del ecosistema Apple: limpio, deliberado, premium. Referencias: Linear, Stripe, iOS 17+. Composición generosa, tipografía con carácter, jerarquía obvia, cero ruido visual. Cada pantalla tiene un único propósito claro.

### Tokens reales (`app/globals.css`, bloque `:root` — usar estas variables, no hexadecimales sueltos)

```css
:root {
  --ink:        #0F172A;   /* texto principal */
  --deep:       #1A2B4C;   /* texto secundario oscuro */
  --blue:       #4B6BFB;   /* CTAs, links, estados activos */
  --blue-600:   #3854E4;   /* hover de --blue */
  --blue-50:    #EEF1FE;
  --blue-100:   #DDE3FE;
  --lav:        #F0F1FE;
  --mute:       #64748B;   /* labels, placeholders, microtexto */
  --line:       #E2E8F0;   /* bordes, divisores */
  --line-soft:  #EEF1F5;
  --bg:         #F7F8FB;   /* fondo de página */
  --surface:    #FFFFFF;   /* cards, modales */
  --surface-2:  #F8FAFC;
  --hover:      #F1F5F9;
  --success:    #22C55E;
  --success-50: #E8F9EF;
  --warn:       #F59E0B;
  --warn-50:    #FFF4DF;
  --danger:     #EF4444;
  --danger-50:  #FEECEC;

  --sh-1: 0 1px 2px rgba(15,23,42,.04);
  --sh-2: 0 1px 2px rgba(15,23,42,.04), 0 6px 16px -8px rgba(15,23,42,.08);
  --sh-3: 0 2px 4px rgba(15,23,42,.04), 0 16px 36px -18px rgba(15,23,42,.14);

  --ease: cubic-bezier(.2,.7,.2,1);
}
```

Fuente: `Inter` (cargada vía Google Fonts en `app/layout.tsx`, pesos 300–800). Base: `14px`/`1.5`. Solo modo claro. Sin gradientes llamativos tipo "IA genérica", sin efectos 3D, sin dark mode, sin stock fotográfico corporativo.

### Componentes
- **Cards:** `border-radius: 12–16px`, sombra `var(--sh-1)`/`var(--sh-2)`, fondo `var(--surface)`, borde opcional `1px solid var(--line)`.
- **Botones primarios:** fondo `var(--blue)`, texto blanco, `border-radius: 10–12px`, hover `var(--blue-600)`.
- **Botones secundarios:** transparente, borde `1px solid var(--line)`, hover `var(--hover)`.
- **Inputs:** padding amplio, `border-radius: 10px`, focus con borde `var(--blue)`.
- Sistema de espaciado de 8px. Transiciones `200–300ms`, easing `var(--ease)`.

---

## Base de datos (Supabase)

⚠️ **Advertencia real, no cosmética:** varias tablas/columnas en producción **no tienen migración en el repo** — se crearon directo en el dashboard de Supabase (`profiles.is_admin`, `is_editor`, `cvs_mirror_este_mes`; `cvs.modo`, `imagen_referencia_url`, `diseno_mirror_json`, `foto_cv_url`; la tabla base `certificaciones`; `linkedin_profiles_cache.curated_data`; `admin_audit_log`). El schema de abajo las incluye porque el código las usa activamente, pero si necesitas recrear la base de datos desde cero, **no vas a encontrar su `CREATE TABLE` en `scripts/`** — tendrás que reconstruirlas a mano. Esto es deuda técnica real, no un error de este documento.

### Tablas principales de perfil
```sql
profiles (
  id uuid PK references auth.users(id),
  nombre text NOT NULL, apellido text NOT NULL, email_cv text NOT NULL,
  foto_url text, linkedin_url text, telefono text, ciudad text, pais text,
  profesion_perfil text, profesiones_inferidas text[] DEFAULT '{}',
  resumen_profesional text, puntaje_completitud integer DEFAULT 0,
  onboarding_completado boolean DEFAULT false,
  is_admin boolean, is_editor boolean,                         -- sin migración en repo
  is_embajador boolean NOT NULL DEFAULT false,
  plan text DEFAULT 'gratuito',                                -- 'gratuito' | 'pro'
  cvs_mirror_este_mes integer,                                 -- sin migración en repo, vestigial de Mirror
  cv_pendiente_pago_id uuid REFERENCES cvs(id) ON DELETE SET NULL,
  descarga_gratis_inspiracion_usada boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
)

experiencia (id, user_id FK, empresa NOT NULL, cargo NOT NULL, fecha_inicio, fecha_fin, descripcion, activo boolean DEFAULT false, created_at)
educacion   (id, user_id FK, institucion NOT NULL, titulo NOT NULL, area, fecha_inicio, fecha_fin, created_at)
habilidades (id, user_id FK, nombre NOT NULL, tipo text,           -- 'tecnica' | 'blanda' | null — sin migración en repo
             created_at)
logros      (id, user_id FK, descripcion NOT NULL, created_at)
idiomas     (id, user_id FK, nombre NOT NULL, nivel text,          -- 'Básico'|'Intermedio'|'Avanzado'|'Nativo'
             created_at)
certificaciones (id, user_id FK, titulo NOT NULL, institucion NOT NULL, anio_egreso, created_at)
                 -- tabla base sin migración; RLS + GRANT sí están en scripts/migration-certificaciones-rls.sql
```

### CVs y seguimiento
```sql
cvs (
  id, user_id FK, titulo,
  intencion text NOT NULL,        -- 'general' | 'job' (el código usa 'job', NO 'vacante')
  estilo text NOT NULL,           -- ver "Estilos de CV" — 'mirror' existe como valor legacy, ya no usable desde la UI
  contenido_json jsonb NOT NULL,
  descripcion_vacante text, match_porcentaje integer,
  modo text, imagen_referencia_url text, diseno_mirror_json jsonb, foto_cv_url text,  -- vestigios de Mirror, sin migración
  created_at
)
cvs_inspiracion (id, user_id FK auth.users, template_id NOT NULL, canvas_state jsonb DEFAULT '{}',
                  thumbnail_url, created_at, updated_at)      -- estado del editor de CV Studio
cv_templates (id, name NOT NULL, description, thumbnail_url, canvas_state jsonb DEFAULT '{}',
              is_published boolean DEFAULT false, created_by FK auth.users, created_at, updated_at)
              -- galería de plantillas de CV Studio curadas por admin
aplicaciones (id, user_id FK, cv_id FK, empresa, cargo, fecha date,
              estado text,        -- 'pending'|'interviewing'|'hired'|'rejected'|'no_response' (inglés en código)
              nota, created_at)
```

### Pagos
```sql
pagos (
  id, user_id FK, cv_id FK cvs, cv_inspiracion_id FK cvs_inspiracion,
  tipo text NOT NULL CHECK IN ('cv_unico','suscripcion_mensual','suscripcion_anual','inspiracion_descarga'),
  monto decimal(10,2) NOT NULL, moneda text DEFAULT 'USDT',
  red text CHECK IN ('TRON','BSC','MATIC'),                    -- TRON deshabilitado en el frontend/API actualmente
  estado text DEFAULT 'pendiente' CHECK IN ('pendiente','confirmado','expirado','fallido'),
  nowpayments_payment_id text UNIQUE, nowpayments_payment_status,
  direccion_wallet, monto_cripto decimal(20,8),
  codigo_descuento_id uuid REFERENCES codigos_descuento(id), monto_original decimal(10,2),
  created_at, confirmed_at
)
suscripciones (id, user_id FK, tipo CHECK IN ('mensual','anual'), estado CHECK IN ('activa','cancelada','expirada'),
                pago_id FK pagos, fecha_inicio, fecha_fin NOT NULL, created_at)
                -- preparada para PayPal (Fase pendiente), no es el riel de pago principal hoy
configuracion (clave text PK, valor text NOT NULL, descripcion, updated_at)
               -- precios editables en vivo: precio_cv_unico=2.99, precio_mensual=9.99, precio_anual=79, precio_inspiracion=2.99
```

**Crítico, ya corregido:** `pagos` y `suscripciones` se crearon con RLS activado pero **sin los `GRANT`** que toda otra tabla tiene — sin eso, ni `service_role` ni `authenticated` podían tocar la tabla en absoluto (RLS/bypass ≠ permisos de tabla). Arreglado en `scripts/migration-pagos-grants.sql`. Si creas una tabla nueva, **siempre agrega el bloque `GRANT`** — cópialo de `migration-embajadores.sql`, no asumas que Supabase lo hace solo.

### Programa de embajadores
```sql
embajador_perfil (id, user_id FK UNIQUE, codigo_referido text UNIQUE NOT NULL,
                   porcentaje_comision decimal DEFAULT 25.00, max_porcentaje_descuento decimal DEFAULT 20.00,
                   meses_recurrencia_mensual int DEFAULT 6, umbral_minimo_pago decimal DEFAULT 50.00,
                   saldo_negativo_arrastrable decimal DEFAULT 0.00,
                   estado CHECK IN ('activo','suspendido'),
                   acuerdo_aceptado boolean DEFAULT false, acuerdo_aceptado_at,
                   modulo_codigos_activo boolean DEFAULT false, created_at)
codigos_descuento (id, embajador_id FK, codigo text UNIQUE, porcentaje_descuento decimal NOT NULL,
                    usos_maximos int, usos_actuales int DEFAULT 0, activo boolean DEFAULT true,
                    fecha_expiracion, eliminado boolean DEFAULT false,  -- soft-delete
                    created_at)
referidos (id, embajador_id FK, usuario_referido_id FK UNIQUE, codigo_referido_usado NOT NULL,
           codigo_descuento_usado, origen CHECK IN ('enlace','codigo'),
           fecha_clic_atribucion, fecha_registro, fecha_primera_suscripcion, created_at)
comisiones (id, embajador_id FK, referido_id FK, pago_origen_id FK pagos UNIQUE,
            tipo CHECK IN ('unica','recurrente'), monto_base, porcentaje_aplicado, monto_comision decimal(10,4),
            estado CHECK IN ('pendiente','disponible','solicitada','pagada','anulada','rechazada'),
            fecha_generacion, fecha_disponible NOT NULL,     -- holdback de 24h antes de 'disponible', informativo
            created_at)
solicitudes_pago (id, embajador_id FK, monto_total decimal NOT NULL, comisiones_incluidas uuid[] NOT NULL,
                   red_blockchain CHECK IN ('TRON','POLYGON'), direccion_wallet NOT NULL,
                   estado CHECK IN ('solicitada','en_proceso','pagada','rechazada'),
                   fecha_solicitud, fecha_pago, hash_transaccion, nota_admin, created_at)
```

### Otras
```sql
linkedin_profiles_cache (id, linkedin_url UNIQUE, raw_data jsonb, scraped_at, curated_data jsonb)
                          -- curated_data sin migración en repo; solo acceso vía admin client
admin_audit_log         -- sin CREATE TABLE en repo; política de INSERT endurecida en migration-security-fixes.sql
```

### Funciones SQL
- `user_has_unpaid_cv(p_user_id uuid) → boolean` — **la más importante del modelo de negocio.** Única fuente de verdad de la regla "sin Pro, no puedes crear un segundo CV mientras tengas uno sin pagar". Chequeada en vivo contra `cvs`/`cvs_inspiracion`/`pagos`, nunca un puntero cacheado. Usada server-side en `/api/generate-cv` y dentro de la policy RLS de INSERT en `cvs_inspiracion`.
- `increment_codigo_descuento_uso(codigo_id uuid)` — `SECURITY DEFINER`, incrementa `usos_actuales` atómicamente.
- `liberar_comisiones_disponibles() → integer` — `SECURITY DEFINER`, mueve comisiones de `pendiente` a `disponible` según `fecha_disponible`. Solo se llama desde `app/api/cron/liberar-comisiones/route.ts`, que **no tiene ningún disparador automático conectado** (no hay `vercel.json` de cron) — el CEO revisa y aprueba comisiones manualmente una por una, a propósito.
- `handle_updated_at()` / `handle_cv_templates_updated_at()` — triggers de `updated_at`.

---

## Arquitectura de rutas (Next.js App Router)

```
app/
├── page.tsx                          ← "/" — landing pública si no hay sesión, si no redirige a /profile u /onboarding
├── (auth)/
│   ├── login/page.tsx
│   └── register/page.tsx
├── (app)/                            ← layout con sidebar, protegido por middleware
│   ├── onboarding/page.tsx
│   ├── profile/page.tsx              ← "Mi Perfil"
│   ├── edit-profile/page.tsx
│   ├── create-cv/
│   │   ├── page.tsx                  ← wizard: Tipo de CV → Estilo → Vista previa (3 pasos, no páginas separadas)
│   │   ├── preview/page.tsx
│   │   ├── studio/page.tsx           ← CV Studio (antes "inspiration", renombrado 2026-09-22)
│   │   ├── studio/editor/[id]/page.tsx
│   │   └── success/page.tsx
│   ├── create-cv-v2/page.tsx         ← wizard experimental, coexiste con create-cv (ver memoria de sesión)
│   ├── cvs/page.tsx                  ← "Mis CVs"
│   ├── applications/page.tsx         ← seguimiento de vacantes
│   ├── account/page.tsx
│   ├── ambassador/page.tsx
│   └── admin/
│       ├── page.tsx
│       ├── templates/page.tsx        ← gestión de plantillas de CV Studio
│       └── ambassadors/[id]/page.tsx
├── terminos/, privacidad/, cookies/, uso-de-ia/   ← públicas, placeholder de contenido (ver sección Legal)
├── cv/[id]/imprimir/page.tsx         ← vista pública solo-impresión, usada para generar el PDF
├── auth/callback/route.ts            ← callback de Supabase Auth
├── r/[code]/route.ts                 ← atribución de embajador, planta cookie y redirige a /register
└── api/…                             ← ver siguiente sección
```

**Protección real (`middleware.ts`):**
```
PROTECTED_PREFIXES = ['/profile','/create-cv','/admin','/applications','/account','/edit-profile','/onboarding','/cvs','/ambassador']
AUTH_ROUTES = ['/login','/register']   // si ya hay sesión, redirige a /profile
```
Nota: `/create-cv-v2` queda protegida por coincidencia de prefijo con `/create-cv` (funciona, pero es frágil si algún día se agrega una ruta pública que empiece igual). Las rutas de `api/` no pasan por este middleware — cada endpoint valida su propia sesión con `supabase.auth.getUser()`.

---

## API routes

| Ruta | Qué hace |
|---|---|
| `POST /api/generate-cv` | **Generación de CV** — enruta a pipeline general o de vacante; bloquea si `user_has_unpaid_cv()` es true |
| `POST /api/chat` | Chat conversacional (onboarding y Mi Perfil) que extrae datos de perfil |
| `POST /api/parse-document` | Extrae datos de perfil de un PDF/DOCX/TXT subido |
| `POST /api/review-cv` | Corrige ortografía/gramática de un CV ya generado, sin tocar hechos |
| `POST /api/match-vacante` | Explica el % de match ya calculado (nunca calcula uno propio) |
| `POST /api/profile/hydrate` | Importación de LinkedIn v2 — scrapea (Apify, cacheado), estructura con IA, hace upsert en perfil |
| `POST /api/profile/avatar-from-url` | Sube a Storage un avatar obtenido por URL |
| `GET /api/config` · `GET/PATCH /api/admin/config` | Lectura pública / escritura admin de precios |
| `POST /api/payments/create` · `create-inspiracion` | Crea un pago NOWPayments (CV único / CV Studio) |
| `POST /api/payments/validate-codigo` | Valida un código de descuento y devuelve el precio real (también usado solo para leer el precio base) |
| `GET /api/payments/status/[id]` | Consulta estado de un pago |
| `POST /api/payments/webhook` | IPN de NOWPayments — verifica firma HMAC-SHA512, confirma pago, dispara comisión/atribución |
| `GET/PATCH /api/embajador` · `codigos` · `POST solicitudes` | Dashboard propio del embajador, códigos, solicitud de retiro |
| `GET /api/admin/embajadores` · `comisiones` · `solicitudes-pago` (+ `[id]`) | Gestión admin del programa de embajadores |
| `GET /api/admin/users` (+`[id]`) · `stats` · `capabilities` | Panel admin general |
| `GET /api/cron/liberar-comisiones` | Libera comisiones vencidas — sin disparador automático conectado a propósito |

---

## Arquitectura de prompts

**No existe un P1–P9 fijo.** El sistema real tiene 7 llamadas de IA distintas, cada una con un propósito único:

| Prompt | Modelo | Dónde vive | Dispara con |
|---|---|---|---|
| Generación de CV | Sonnet | `lib/cv/prompts/generate-cv.ts` | `POST /api/generate-cv` |
| Análisis de vacante | Haiku | `lib/cv/prompts/analyze-vacancy.ts` | Solo modo `job`, en paralelo a la carga de datos |
| Chat de perfil | Haiku | `app/api/chat/route.ts` | `POST /api/chat` (onboarding y perfil) |
| Parser de documentos | Haiku | `app/api/parse-document/route.ts` (`P3_PARSE_DOCUMENT`) | Subida de PDF/DOCX/TXT |
| Corrección de CV | Haiku | `app/api/review-cv/route.ts` (`P9_REVIEW_CV`) | "Guardar y revisar" |
| Explicación de match | Haiku | `app/api/match-vacante/route.ts` (`P8_MATCH_VACANTE`) | Post-generación en modo vacante |
| Curación de LinkedIn | Haiku | `app/api/profile/hydrate/route.ts` (`STRUCTURE_PROMPT`) | Importar LinkedIn |

(Los nombres `P3`/`P8`/`P9` son vestigiales de la numeración vieja — no hay P1/P2/P4-P7 en el código actual. La vieja ramificación "modo × tiene experiencia" (P4–P7) ya no existe: la generación es incondicional.)

### `lib/cv/` — el corazón de la generación
- **`types/style-config.ts`** — `StyleWritingConfig` (reglas para la IA: tono, voz, tiempo verbal, fórmula de bullet, verbos por categoría, regla de métricas, orden de secciones, prohibiciones), `StyleDesignConfig` (layout/colores/tipografía para React), `StyleMetadata` (nombre, tagline, industrias, ATS score).
- **`styles/index.ts`** — registro de los 7 estilos (`STYLE_IDS`), `getWritingConfig`/`getDesignConfig`/`getMeta` fallan ruidosamente ante un id desconocido.
- **`prompts/global-rules.ts`** (`buildGlobalRules`) — se inyecta al inicio de todo prompt de generación, máxima prioridad, gana sobre las reglas del estilo si hay conflicto. Secciones: idioma (es/en/pt/fr autodetectado), persona gramatical, integridad de datos, rigor igual para el rol actual que para los pasados, cuantificación cualitativa-sobre-forzada, logros sin duplicar experiencia, habilidades evidenciadas primero (con ejemplo concreto), formato de título, formato de salida (JSON estricto).
- **`prompts/generate-cv.ts`** — combina reglas globales + config del estilo + bloque de vacante (si aplica); define el schema JSON completo de salida.
- **`pipelines/general.ts` / `vacancy.ts`** — orquestación: datos de usuario → prompt → Sonnet (1 reintento) → validación estructural → chequeo anti-alucinación → categorización de skills (`splitSkills`) → guardado en `cvs`. El pipeline de vacante calcula `match_porcentaje` de forma **determinística** (`computeMatchScore`, no IA): 40pts skills requeridas, 30pts keywords ATS, 15pts skills deseadas, 15pts relevancia de cargo/industria.
- **`validation/structure.ts`** — valida tipos/forma del JSON de la IA, no falla rápido (junta todos los errores), extrae JSON tolerante a fences de markdown.
- **`validation/anti-hallucination.ts`** — cruza por similitud difusa cada experiencia/educación generada contra los datos fuente reales del usuario; detecta entradas inventadas, conteos que exceden la fuente, nombres no coincidentes.

---

## Estilos de CV disponibles

7 estilos reales (`STYLE_IDS` en `lib/cv/styles/index.ts`), cada uno con su propio componente en `components/CVTemplates/`:

| ID | Nombre visible | Componente |
|---|---|---|
| `harvard` | Harvard | `HarvardCV.tsx` |
| `stanford` | Stanford | `StanfordCV.tsx` |
| `silicon-valley` | Silicon Valley | `SiliconValleyCV.tsx` |
| `tech` | Tech | `TechCV.tsx` |
| `minimalist` | Minimalista | `MinimalistCV.tsx` |
| `europass` | Europeo (Europass) | `EuropassCV.tsx` |
| `executive` | Ejecutivo | `ExecutiveCV.tsx` |

No hay gating de estilos por plan — cualquier usuario puede elegir cualquiera de los 7.

**CV Mirror fue eliminado del producto** (2026-09-21), reemplazado por **CV Studio** (`/create-cv/studio`, editor visual Konva con plantillas curadas por admin). El valor `'mirror'` sigue existiendo como dato legacy en `cvs.estilo`/`types/index.ts` y en columnas como `diseno_mirror_json` — es vestigial, no alcanzable desde ningún flujo de la UI actual.

Componentes compartidos: `EditableField.tsx` (edición inline), `SkillsBlock.tsx` (categorización técnica/blanda con fallback a lista plana para CVs viejos sin categorizar).

---

## Planes y pagos

**Modelo actual: 2 planes**, decidido por el CEO — reemplaza cualquier sistema de créditos/cuotas mensuales de versiones anteriores de este documento.

### Plan Inicio (pago único, sin suscripción)
- Crear un CV (General, Vacante, o CV Studio) es **gratis**.
- **Descargarlo cuesta `precio_cv_unico`** (config viva en tabla `configuracion`, default $2.99 USD).
- **Regla de bloqueo — la más importante del modelo de negocio, ✅ implementada y verificada:** sin Pro, no puedes crear un segundo CV mientras tengas uno sin pagar. Se aplica en el servidor vía `user_has_unpaid_cv()`, chequeada en `/api/generate-cv` y en la policy RLS de `cvs_inspiracion`.
- Sin branding "Creado con Momentum" en ningún plan.

### Plan Pro (suscripción)
- `precio_mensual`/`precio_anual` en `configuracion` (default $9.99/mes, $79/año).
- CVs y descargas ilimitadas, sin el bloqueo de "un CV sin pagar a la vez". Exportación DOCX exclusiva de Pro (PDF no tiene esa restricción, solo el paywall de pago-o-Pro).
- **⚠️ No se puede comprar todavía.** Cobro decidido: PayPal Subscriptions (NOWPayments no soporta recurrencia). Es la última fase pendiente del plan maestro — deliberadamente al final.

### Pago único vía NOWPayments (cripto)
- Redes: **BSC y Polygon únicamente.** TRON está deshabilitado (`components/PaymentModal.tsx` + ambos `ALLOWED_NETWORKS` server-side) porque NOWPayments rechaza el monto mínimo en USDT-TRC20 al precio actual, incluso sin descuento. El valor `'TRON'` sigue siendo válido en el CHECK de `pagos.red` por si se reactiva sin migración — pendiente de decisión de precio.
- El webhook (`/api/payments/webhook`) verifica la firma HMAC-SHA512 de NOWPayments contra `NOWPAYMENTS_IPN_SECRET` — **debe ser el secreto real** (no el placeholder), tanto en `.env.local` como en las variables de entorno de producción, o cualquiera puede forjar una confirmación de pago falsa.

### Códigos de descuento
- Resueltos y re-computados siempre server-side (`resolverCodigoDescuento`, `calcularPrecioConDescuento` en `lib/embajadores.ts`) — nunca se confía en un precio que mande el cliente.
- Al confirmarse el pago, el webhook consume el código y crea (u actualiza) la atribución en `referidos` con `origen='codigo'`, para que el embajador reciba su comisión aunque el comprador no haya llegado por el enlace de referido.

---

## Programa de embajadores

Sistema de referidos con comisiones y códigos de descuento, gestionado desde `/ambassador` (embajador) y `/admin` → tab Embajadores (CEO).

- **Atribución:** por enlace (`/r/[code]`, cookie `momentum_ref` de 30 días, último clic gana) o por código de descuento usado en checkout.
- **Comisiones:** se generan al confirmarse un pago de un usuario referido (`generarComision` en `lib/embajadores.ts`), con holdback informativo de 24h. **Aprobación 100% manual, una por una** — decisión explícita del CEO, nunca en lote ni automática (`/admin` → "Comisiones pendientes de revisión").
- **Retiro:** el embajador solicita el pago de su saldo `disponible` (`POST /api/embajador/solicitudes`), que bloquea esas comisiones en `solicitada`; el CEO las marca `pagada` (con hash de transacción) o `rechazada` (libera las comisiones de vuelta) desde `/admin`.
- **Acuerdo legal:** modal de bloqueo en el primer acceso a `/ambassador`, texto en la constante `TEXTO_ACUERDO_EMBAJADORES` (`app/(app)/ambassador/page.tsx`) marcada como placeholder — **el CEO/abogado debe reemplazarlo antes de aceptar embajadores reales.**

---

## Rate limiting

`lib/rate-limit.ts` — Upstash Redis (sliding window) cuando `UPSTASH_REDIS_REST_URL`/`TOKEN` están configuradas; si no, limitador en memoria (solo por instancia, no compartido — suficiente para local, no para producción). `rateLimit()` es async; los ~10 call-sites ya usan `await`.

---

## Landing pública y páginas legales

- **`/` (landing):** contenido aprobado por el CEO (`app/page.tsx`), visible solo a visitantes sin sesión — usuarios autenticados mantienen el redirect a `/profile`/`/onboarding` de siempre. Incluye hero, tipos de CV (General/Vacante/**CV Studio**, no Mirror), sección ATS + honestidad, seguimiento de vacantes, FAQ, CTA final.
- **`/terminos`, `/privacidad`, `/cookies`, `/uso-de-ia`:** estructura creada, **contenido sin redactar a propósito** — cada sección tiene un marcador `[PENDIENTE — contenido a redactar por el CEO o asesoría legal]`. No están enlazadas desde el footer de la landing todavía; enlazarlas es lo último, una vez tengan contenido real.
- **Blog/recursos:** fuera de esta ronda por decisión del CEO — no es prioridad.

---

## Manejo de errores

| Nivel | Contexto | Comportamiento |
|---|---|---|
| 1 | Error en chat | Mensaje simple para reintentar. No perder historial. |
| 2 | Error en parseo | Informar, sugerir reintento o chat. No guardar datos parciales. |
| 3 | Error en generación | Reintento automático 1 vez (`MAX_RETRIES=1`). Si falla de nuevo → mensaje simple. |

**Regla transversal:** nunca mostrar errores técnicos crudos (stack traces, códigos HTTP, mensajes de Supabase/Anthropic) al usuario.

---

## Reglas de profesión (críticas)

- `profesion_perfil`: definida solo por el usuario. Solo él puede cambiarla.
- `profesiones_inferidas[]`: detectadas en PDFs, chat o LinkedIn. Contexto interno para la IA. Nunca reemplazan `profesion_perfil`. Nunca se muestran como profesión principal.
- El CV general usa `profesion_perfil` como título; si está vacío, la IA puede inferir uno desde educación/experiencia reciente (ver regla TITLE LINE en `global-rules.ts`).
- El CV para vacante usa el cargo objetivo detectado en la vacante como título.

---

## Lo que el sistema nunca debe hacer

- Inventar datos del usuario (experiencia, logros, habilidades, cifras) en cualquier prompt.
- Sobrescribir `profesion_perfil` con datos de un PDF o de LinkedIn.
- Confiar en un precio, porcentaje de descuento o cantidad que venga del cliente en un endpoint de pagos.
- Mostrar mensajes técnicos crudos.
- Crear una tabla nueva sin su bloque `GRANT` explícito (ver advertencia en la sección de base de datos).
- Aprobar o liberar comisiones de embajadores automáticamente — es manual a propósito.

---

## Convenciones de código

- Componentes: PascalCase (`ProfileCard.tsx`)
- Funciones y variables: camelCase
- Rutas API: `route.ts` dentro de su carpeta bajo `app/api/`
- Prompts de generación de CV: `lib/cv/prompts/`; prompts de un solo endpoint: constante inline en su propio `route.ts` (no hay un directorio central `lib/prompts/p1.ts` como en versiones antiguas de este documento)
- Clientes Supabase: `lib/supabase/client.ts` (browser), `lib/supabase/server.ts` (server, respeta RLS), `lib/supabase/admin.ts` (service role, bypassa RLS — **requiere que la tabla tenga sus `GRANT`**)
- Cliente Anthropic: `lib/anthropic.ts`
- Migraciones SQL: `scripts/migration-*.sql`, ejecutadas manualmente por el CEO en el SQL Editor de Supabase — no hay migración automática

---

## Qué falta (a la fecha de esta reescritura)

Única fase pendiente del plan maestro: **PayPal Subscriptions para el Plan Pro** (Fase 8, deliberadamente la última). Todo lo demás del plan (commits, limpieza, motor de generación, match unificado, embajadores completos, rate limiting real, landing, legal) está resuelto y verificado. Para el detalle día a día de qué se hizo, cuándo y cómo se verificó, usa `handoff.md` — este archivo es la arquitectura estable, `handoff.md` es el log vivo.
