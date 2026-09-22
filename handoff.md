# Momentum — Handoff Document
**Fecha:** 2026-05-31  
**Estado:** Desarrollo activo. MVP funcional con pagos, embajadores y panel admin operativo.  
**Repositorio local:** `C:\Users\ajcol\projects\resumint`  
**Dominio:** www.momentumcv.com  
**Stack:** Next.js 15 (App Router) + TypeScript strict + Supabase (auth, DB, storage) + Tailwind (solo globals) + NOWPayments

---

## 1. Qué es Momentum

Plataforma SaaS de creación de CVs con IA. Ex-Resumint/Resumika. Tres tipos de CV (General, Vacante, y **CV Studio** — nuevo nombre de lo que era "CV Inspiración", el editor canvas), pero **solo 2 planes** (decisión del CEO, 2026-09-21 — reemplaza cualquier tabla de 3 productos/precios anterior en este documento):

| Plan | Modelo | Precio |
|---|---|---|
| **Inicio** | Crear cualquier tipo de CV es gratis → pagar para descargar | $2.99 por CV (configurable, clave `precio_cv_unico`) |
| **Pro** | Suscripción | $9.99/mes · $79/año (configurable) — **✅ comprable vía PayPal Subscriptions (Sandbox), ver sección 18** |

**✅ Decidido (2026-09-21): CV Studio NO conserva la excepción de "primera descarga gratis".** Se paga desde la primera descarga, igual que un CV estándar. `descarga_gratis_inspiracion_usada` quedó sin usar (columna todavía existe en BD, inofensiva) y se eliminó `/api/inspiracion/mark-free-download` — `EditorContainer.tsx` ahora solo revisa `plan === 'pro'`.

**Regla de negocio más importante del producto (no solo "nice to have" — es la base del modelo de ingresos):** un usuario sin Pro no puede tener más de un CV sin pagar a la vez. Generar el *texto* de un CV (aunque el usuario nunca haga clic en "descargar") ya cuenta como haber usado su cupo — no puede volver atrás y regenerar indefinidamente para explotar tokens de IA gratis. Debe bloquearse en el servidor, no solo en la UI. Ver pendiente #1 y sección 15 para el diseño completo.

Marca de agua "Creado con Momentum" — ✅ **eliminada del todo** (2026-09-21), código muerto retirado de `app/cv/[id]/imprimir/page.tsx`, no solo ocultada.

**CV Mirror — ✅ ELIMINADO POR COMPLETO (decisión del CEO, 2026-09-21).** Calidad insuficiente para justificar el costo de un modelo con visión más avanzado. Se borraron: `app/(app)/create-cv/mirror/`, `app/api/mirror-cv/`, `components/CVTemplates/MirrorCVRenderer.tsx`, `lib/prompts/p10.ts`. Se limpiaron referencias en `cvs/page.tsx`, `admin/page.tsx` (ResumenTab) y el tipo de `CVRenderer`. Su lugar en la sección "tipos de CV" lo toma **CV Studio**.

Pagos vía NOWPayments: USDT en TRON, BSC, Polygon. No hay devoluciones. Suscripción Pro decidida por PayPal (NOWPayments no soporta recurrencia), ver pendiente #1.

---

## 2. Arquitectura

```
app/
  (app)/          ← Rutas autenticadas (layout con sidebar)
    admin/        ← Panel admin (is_admin=true)
    admin/embajadores/[id]/  ← Vista admin del dashboard del embajador
    embajador/    ← Dashboard embajador (is_embajador=true)
    aplicaciones/
    crear-cv/
    cuenta/       ← Planes y pagos
    editar-perfil/
    mis-cvs/
    onboarding/
    perfil/
  api/
    admin/
      config/       ← GET+PATCH precios (solo admin)
      embajadores/  ← GET lista + POST asignar + PATCH [id]
      stats/        ← KPIs para resumen admin
      users/        ← GET+POST+PATCH usuarios
      capabilities/ ← isSuperAdmin check
    auth/callback/  ← Registra atribución embajador al crear cuenta
    chat/           ← IA generación de CV vía chat
    config/         ← GET público de precios
    embajador/
      route.ts      ← GET dashboard del embajador (datos + referidos enriquecidos)
      codigos/      ← GET+POST códigos del embajador
      codigos/[id]/ ← PATCH+DELETE código
    generate-cv/
    match-vacante/
    mirror-cv/
    parse-document/
    payments/
      create/           ← Crear pago CV único
      create-inspiracion/← Crear pago CV Inspiración
      webhook/          ← NOWPayments IPN → confirma pago + genera comisión
    profile/
      hydrate/    ← Import LinkedIn (obfuscado, antes era /api/linkedin-import)
    r/[code]/     ← Redirección de atribución embajador (planta cookie 30d)

components/
  Select.tsx      ← Dropdown custom con bordes redondeados (reemplaza <select> nativo)
  Sidebar.tsx     ← Nav lateral con collapse (admin/editor/embajador solamente)

lib/
  config.ts       ← getConfig() → lee precios de tabla `configuracion` en Supabase
  embajadores.ts  ← registrarAtribucion() · generarComision() · resolverCodigoDescuento()
  completitud.ts  ← calcularPuntajeCompletitud() → score 0–100 del perfil
  nowpayments.ts  ← createNOWPayment(), verifyNOWPaymentsSignature(), PAYMENT_FINISHED/FAILED

contexts/
  SidebarContext.tsx  ← { sidebarOpen, setSidebarOpen, sidebarCollapsed, setSidebarCollapsed }

types/index.ts    ← Profile, Pago, CV, Aplicacion, Experiencia, etc.
```

---

## 3. Base de datos Supabase — tablas clave

Todas las tablas tienen RLS activado. El `createAdminClient()` usa `service_role` (bypassa RLS).

### Tablas del core

| Tabla | Descripción clave |
|---|---|
| `profiles` | Extiende auth.users. Campos: `plan`, `is_admin`, `is_editor`, `is_embajador`, `cv_pendiente_pago_id`, `descarga_gratis_inspiracion_usada` |
| `cvs` | CVs generados con IA |
| `cvs_inspiracion` | CVs del editor canvas |
| `cv_templates` | Plantillas del editor canvas |
| `aplicaciones` | Seguimiento de postulaciones |
| `pagos` | Todos los pagos. `tipo`: cv_unico · suscripcion_mensual · suscripcion_anual · inspiracion_descarga |
| `configuracion` | Key-value de precios: `precio_cv_unico`, `precio_mensual`, `precio_anual`, `precio_inspiracion` |

### Tablas del sistema de embajadores (migración: `migration-embajadores.sql` + `migration-codigos-descuento.sql`)

| Tabla | Descripción clave |
|---|---|
| `embajador_perfil` | Perfil por embajador. Campos críticos: `codigo_referido` (UNIQUE), `porcentaje_comision`, `max_porcentaje_descuento`, `meses_recurrencia_mensual`, `umbral_minimo_pago`, `estado` (activo/suspendido), `modulo_codigos_activo`, `acuerdo_aceptado` |
| `codigos_descuento` | Códigos del embajador. Campos: `codigo` (UNIQUE global), `porcentaje_descuento`, `usos_maximos`, `usos_actuales`, `activo`, `eliminado` (soft-delete), `fecha_expiracion` |
| `referidos` | Atribución click→registro. `origen`: enlace · codigo. `cookie`: `momentum_ref = CODE|TIMESTAMP` (30 días, last-click wins) |
| `comisiones` | Estados: pendiente → disponible → solicitada → pagada (+ anulada/rechazada). `fecha_disponible` = holdback 24h |
| `solicitudes_pago` | Solicitudes de retiro. Redes: TRON · POLYGON |

### Funciones SQL importantes
```sql
increment_codigo_descuento_uso(codigo_id uuid)  -- incrementa usos
liberar_comisiones_disponibles()               -- pendiente → disponible (llamar manualmente o vía cron)
```

---

## 4. Variables de entorno (`.env.local`) — NUNCA publicar

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY     ← usado en createAdminClient()
ANTHROPIC_API_KEY             ← IA (Claude)
APIFY_TOKEN                   ← Scraping LinkedIn (server-only, sin NEXT_PUBLIC_)
NOWPAYMENTS_API_KEY
NOWPAYMENTS_IPN_SECRET        ← Verificación HMAC-SHA512 del webhook
SUPER_ADMIN_EMAIL             ← Email del CEO. Solo este puede asignar rol admin
NEXT_PUBLIC_SITE_URL          ← https://www.momentumcv.com
CRON_SECRET                   ← Protege /api/cron/liberar-comisiones. NO hay ningún cron programado que lo llame
                                 (decisión del CEO: liberación de comisiones es manual, ver sección 12, pendiente #6).
                                 Solo necesaria si en el futuro se dispara ese endpoint manualmente o se decide automatizar.
```

---

## 5. Roles de usuario

| Campo en profiles | Permisos |
|---|---|
| (ninguno) | Usuario normal: crea CVs, paga descargas |
| `is_embajador = true` | Ve el panel `/embajador` en sidebar. Gestiona códigos si `modulo_codigos_activo = true` |
| `is_editor = true` | Ve `/admin` pero solo tab de Plantillas canvas |
| `is_admin = true` | Panel admin completo (resumen, usuarios, plantillas, embajadores, configuración) |
| email = SUPER_ADMIN_EMAIL | Puede asignar rol admin a otros. Los admins normales no pueden hacerlo |

---

## 6. Sistema de embajadores — flujo completo

### Atribución
1. Embajador comparte `https://momentumcv.com/r/CODIGO`
2. `app/r/[code]/route.ts` → planta cookie `momentum_ref = CODIGO|TIMESTAMP` (30d, httpOnly, last-click wins)
3. Usuario se registra → `app/auth/callback/route.ts` lee la cookie, llama `registrarAtribucion()`, borra cookie
4. Se crea fila en `referidos`

### Comisión
1. Usuario paga → NOWPayments notifica webhook (`/api/payments/webhook`)
2. Webhook llama `generarComision(pagoId)` en `lib/embajadores.ts`
3. Se crea fila en `comisiones` con estado `pendiente` y `fecha_disponible = now() + 24h`
4. Llamar `liberar_comisiones_disponibles()` para pasar a `disponible` (aún manual)

### Códigos de descuento
- Solo visible al embajador si admin activa `modulo_codigos_activo = true`
- El % de descuento está limitado por `max_porcentaje_descuento` del perfil
- Si un código tuvo ≥1 uso y se "elimina" → soft-delete (`eliminado=true`), permanece en historial
- Si tuvo 0 usos → hard delete
- **IMPORTANTE:** la lógica de aplicar el código en checkout NO está conectada aún (ver pendientes)

---

## 7. Precios dinámicos

La tabla `configuracion` en Supabase almacena los precios. El CEO puede cambiarlos desde Admin → Configuración sin tocar código.

```typescript
// En cualquier API route del servidor:
import { getConfig } from '@/lib/config'
const { precio_cv_unico, precio_mensual, precio_anual, precio_inspiracion } = await getConfig()
```

Los endpoints que leen precios dinámicos:
- `POST /api/payments/create` → `precio_cv_unico`
- `POST /api/payments/create-inspiracion` → `precio_inspiracion`
- `GET /api/config` → público, usado por `/cuenta` para mostrar precios

---

## 8. Import de LinkedIn (obfuscado)

El endpoint **real** es `POST /api/profile/hydrate` con body `{ uri: string, async?: boolean }`.  
El endpoint viejo `/api/linkedin-import` devuelve 404 (neutralizado).  
El campo `APIFY_TOKEN` es server-only. No exponer en cliente.

---

## 9. Diseño y UI

**Sistema de diseño:** CSS tokens en `app/globals.css`. Variables clave:
```css
--ink, --deep, --blue, --blue-600, --lav, --mute, --line, --bg, --surface, --hover
--sh-1, --sh-2, --sh-3 (sombras)
--ease: cubic-bezier(.2,.7,.2,1)
```

**Componente Select custom:** `components/Select.tsx`  
Reemplaza todos los `<select>` nativos. La API es:
```tsx
<Select
  value={valor}
  onChange={(v) => setValor(v)}
  options={[{ value: 'x', label: 'X' }]}
  style={{ width: '100%' }}        // wrapper
  triggerStyle={{ fontSize: 13 }}  // botón trigger
/>
```
Usado en: admin (filtros), embajador (filtro plan), aplicaciones (4 selects), mis-cvs (1), perfil (2).

**Sidebar colapsable:** Solo visible para admin/editor/embajador. Botón `<` en header del sidebar. Tab `>` flotante en borde izquierdo cuando está colapsado.

**Modales/overlays:** Usar `createPortal(..., document.body)` para garantizar que el overlay cubra toda la pantalla (el `<main>` tiene `overflow: auto` que afecta `position: fixed`).

---

## 10. Migraciones SQL ejecutadas en Supabase

Todas estas ya están aplicadas en producción/dev:

| Archivo | Contenido |
|---|---|
| `migration-payments.sql` | Tabla `pagos`, políticas |
| `migration-configuracion.sql` | Tabla `configuracion` con precios default |
| `migration-embajadores.sql` | 5 tablas embajadores + RLS + RPCs + GRANTs |
| `migration-codigos-descuento.sql` | Columnas `modulo_codigos_activo` + `eliminado` en tablas embajador |
| `migration-unpaid-cv-check.sql` | ✅ Ejecutada 2026-09-21 — función `user_has_unpaid_cv()` + política RLS de `cvs_inspiracion` |
| `migration-certificaciones-rls.sql` | ⚠️ Pendiente de ejecutar (2026-09-21) — `certificaciones` no tenía RLS, `/profile` recibía 403 al leer/crear/editar/borrar certificaciones (confirmado en prueba real de navegador). El insert desde `/api/profile/hydrate` seguía funcionando porque usa el cliente admin, que bypassa RLS — por eso nadie lo notó antes. |

---

## 11. Todo lo implementado en la sesión 2026-05-30 / 2026-05-31

### Fase 1 — Rebrand Momentum
- `app/layout.tsx` → título "Momentum — Crea tu CV con IA"
- `app/cv/[id]/imprimir/page.tsx` → footer "Creado con Momentum"
- `components/ExportButtons.tsx` → PDF default "CV_Momentum.pdf"

### Fase 2 — Precios dinámicos
- `lib/config.ts` → `getConfig()` lee de tabla `configuracion`
- `app/api/config/route.ts` → GET público (para frontend)
- `app/api/admin/config/route.ts` → GET + PATCH (solo admin)
- `app/(app)/admin/page.tsx` → Tab "Configuración" con editor de precios
- `app/(app)/cuenta/page.tsx` → Precios desde API, no hardcodeados

### Fase 3 — CV Inspiración freemium
- `app/(app)/crear-cv/inspiracion/page.tsx` → Eliminado gate PRO

### Fase 4 — Sistema de embajadores (completo)
- `scripts/migration-embajadores.sql` + `migration-codigos-descuento.sql`
- `lib/embajadores.ts` → `registrarAtribucion()`, `generarComision()`, `resolverCodigoDescuento()`, `consumirCodigoDescuento()`
- `app/r/[code]/route.ts` → Planta cookie de atribución
- `app/auth/callback/route.ts` → Lee cookie, registra atribución, borra cookie
- `app/api/payments/webhook/route.ts` → Genera comisión tras pago confirmado
- `app/api/admin/embajadores/route.ts` → GET (lista+stats) + POST (asignar)
- `app/api/admin/embajadores/[id]/route.ts` → GET (detalle completo) + PATCH
- `app/api/embajador/route.ts` → Dashboard data con referidos enriquecidos + email enmascarado
- `app/api/embajador/codigos/route.ts` → GET+POST
- `app/api/embajador/codigos/[id]/route.ts` → PATCH+DELETE (soft/hard según usos)
- `app/(app)/embajador/page.tsx` → Dashboard completo (4 tabs, módulo de códigos, popup ganancias)
- `app/(app)/admin/embajadores/[id]/page.tsx` → Vista admin del dashboard con banner informativo
- `app/(app)/admin/page.tsx` → Tab "Embajadores" con tabla, toggles con confirmación

### Fixes importantes
- `app/api/admin/users/route.ts` → Cambiado a `adminClient` para ver todos los usuarios (bug RLS)
- `app/api/admin/stats/route.ts` → Cambiado a `adminClient` para métricas reales
- `app/api/admin/embajadores/route.ts` → GET ahora incluye `modulo_codigos_activo`
- `app/api/profile/hydrate/route.ts` → Deduplicación content-based (no count-based)

### UX
- `contexts/SidebarContext.tsx` → Añadido `sidebarCollapsed`
- `components/Sidebar.tsx` → Botón `<` en header del logo (solo privilegiados)
- `app/(app)/layout.tsx` → Tab flotante `>` para expandir (solo cuando está colapsado)
- `app/(app)/admin/page.tsx` → `useSidebar` para `maxWidth` dinámico
- `app/(app)/embajador/page.tsx` → `useSidebar` para `maxWidth` dinámico
- `app/globals.css` → Estilos globales `<select>` (fallback)
- `components/Select.tsx` → Dropdown custom con bordes redondeados, chevron animado

### Confirmaciones en panel admin
Todos los toggles del admin tienen `ConfirmModal` antes de ejecutar:
- Usuarios: plan, is_admin, is_editor
- Embajadores: estado (activo/suspendido), modulo_codigos_activo

---

## 12. Pendientes — ordenados por prioridad

### 🔴 Alta (bloquean ingresos / lanzamiento)

**1. Bloqueo de generación sin pagar — ✅ RESUELTO Y VERIFICADO (2026-09-21/22)**  
Decisión del CEO: un usuario sin Pro no puede tener más de un CV sin pagar a la vez. Generar el *texto* ya cuenta como haber usado su cupo.  
Implementado: función SQL `user_has_unpaid_cv()` (`scripts/migration-unpaid-cv-check.sql`, ejecutada en producción), chequeo agregado en `/api/generate-cv` y `/api/mirror-cv`, política RLS de `cvs_inspiracion` actualizada para CV Studio (que inserta directo desde el cliente, sin pasar por una API route). Verificado con generación real: un segundo intento de CV sin pagar el primero fue bloqueado correctamente con el mensaje al usuario. Ver sección 15 para el diseño completo.

**2. Flujo de suscripción Pro**  
El botón "Mejorar a Pro" en `/account` no hace nada.  
- **Decisión tomada (2026-09-20): PayPal** para el cobro recurrente de Pro (NOWPayments no soporta suscripciones automáticas). CV único y CV Studio se quedan en NOWPayments/cripto — solo Pro migra a PayPal.
- **DEBE estar resuelto antes de lanzar** — bloqueante de lanzamiento, no solo de ingresos.
- Falta: integración de PayPal Subscriptions API (planes recurrentes mensual/anual)
- Falta: webhook de PayPal (equivalente a `/api/payments/webhook` pero para eventos de PayPal) que, al confirmar cobro → `await supabase.from('profiles').update({ plan: 'pro' })`
- Falta: manejo de renovación fallida / cancelación (PayPal envía eventos para esto — no asumir que una vez Pro, siempre Pro)

**3. Historial de pagos real en `/account` — ✅ RESUELTO (2026-09-20)**  
`BILLING_HISTORY` hardcodeado reemplazado por query real a `pagos` filtrada por `user_id`, con estado vacío honesto si no hay pagos.

**4. Landing page pública — en progreso**  
Contenido siendo definido con el CEO (ver `Momentum_CV_Landing_Optimizada.md` si se guardó en el repo, o el historial de la conversación). Pendiente: sección de precios (no existía en el borrador original), y decidir si se menciona a CV Mirror o se reemplaza por CV Studio en la sección de tipos de CV.  
Ruta sugerida: `app/page.tsx` (actualmente hace redirect a /onboarding o /perfil según sesión) o `app/(landing)/page.tsx` con layout propio.

### 🟡 Media (sistema de embajadores incompleto)

**5. Aplicar código de descuento en checkout — ✅ RESUELTO (2026-09-22)**  
`PaymentModal.tsx` tiene campo de código + botón "Aplicar" que llama a `POST /api/payments/validate-codigo` (también usado para mostrar el precio real, ya no hardcodeado). `/api/payments/create` y `/api/payments/create-inspiracion` re-resuelven el código server-side (nunca confían en un precio del cliente) y guardan `codigo_descuento_id`/`monto_original` en `pagos`. El webhook llama `consumirCodigoDescuento()` y `registrarAtribucionPorCodigo()` (nueva función en `lib/embajadores.ts`) ANTES de generar la comisión — esto también crea la atribución `referidos` (origen='codigo') si el comprador no venía de un enlace, algo que antes no pasaba nunca. Verificado de punta a punta con un pago real simulado (firma HMAC-SHA512 real del webhook).

**5b. Red TRON deshabilitada temporalmente — hallazgo nuevo (2026-09-22), pendiente de decisión final**  
Al verificar el punto 5, se descubrió que NOWPayments rechaza pagos en TRON (USDT-TRC20) al precio actual de CV Único/CV Studio ($2.99) por estar bajo su monto mínimo — **incluso sin ningún descuento aplicado**. BSC y Polygon funcionan bien en ambos casos (con y sin descuento del 20%). Decisión temporal del CEO: quitar TRON de las opciones (`PaymentModal.tsx` y el `ALLOWED_NETWORKS` de ambas rutas de creación de pago) hasta decidir si se sube el precio o se deja fuera permanentemente. La red sigue siendo válida en el schema de `pagos` (`red CHECK IN ('TRON','BSC','MATIC')`) por si se reactiva sin migración.

**6. Solicitudes de pago de embajadores — ✅ RESUELTO (2026-09-22)**  
`app/(app)/ambassador/page.tsx` (tab Pagos) ahora tiene un formulario real (red + wallet) que llama a `POST /api/embajador/solicitudes` — bloquea todas las comisiones `disponible` en la solicitud (pasan a `solicitada`) para que no se puedan contar dos veces, y exige `umbral_minimo_pago` + acuerdo aceptado (ver punto 8). `/admin` → tab Embajadores tiene una cola "Solicitudes de retiro pendientes" (`GET/PATCH /api/admin/solicitudes-pago[/id]`) para marcar pagada (con hash de tx) o rechazar (libera las comisiones de vuelta a `disponible`). Verificado de punta a punta: solicitud creada → comisión bloqueada → admin marca pagada → comisión pasa a `pagada` → aparece en el historial del embajador.

**7. Liberar comisiones — ✅ RESUELTO A MANO (2026-09-20)**  
Decisión del CEO: el programa de embajadores es pequeño y exclusivo, y quiere revisar y aprobar/rechazar cada comisión personalmente, una por una — nunca en lote ni automático.  
Implementado como cola de revisión manual en `/admin` → tab **Embajadores** → sección "Comisiones pendientes de revisión": lista cada comisión en estado `pendiente` (embajador, monto, tipo, fecha) con botones **Aprobar** (→ `disponible`, el embajador ya puede solicitar el retiro) y **Rechazar** (→ `rechazada`), cada uno con `ConfirmModal`.  
- `GET /api/admin/comisiones?estado=pendiente` — lista la cola (admin-only)
- `PATCH /api/admin/comisiones/[id]` — aprueba o rechaza una comisión individual; solo transiciona desde `pendiente` (si ya fue procesada, devuelve 409 en vez de sobrescribir)
- `app/api/cron/liberar-comisiones/route.ts` y la función SQL `liberar_comisiones_disponibles()` siguen existiendo pero **no están conectados a ningún disparador automático** (no hay `vercel.json`) — quedan sin uso a propósito. No reactivar sin confirmar con el CEO.
- **Nota:** el campo `fecha_disponible` (holdback de 24h) ya no bloquea nada — es solo informativo. El CEO puede aprobar antes o después de esa fecha, a su criterio.
- **Pendiente de smoke-test:** el join anidado de Supabase (`comisiones → embajador_perfil → profiles`) no se probó contra la base de datos real todavía — verificar que la cola cargue correctamente con al menos una comisión pendiente antes de confiar en ella para revisión real.

**8. Acuerdo legal del embajador — ✅ RESUELTO con placeholder (2026-09-22)**  
Modal de bloqueo en `/ambassador` (primer acceso, mientras `acuerdo_aceptado = false`) con checkbox + botón "Aceptar y continuar" → `PATCH /api/embajador` con `{acuerdo_aceptado: true}`. El texto vive en una única constante `TEXTO_ACUERDO_EMBAJADORES` en `app/(app)/ambassador/page.tsx`, marcada `[PENDIENTE — reemplazar con el acuerdo legal completo]` — **el CEO/abogado debe reemplazar el texto ahí antes de lanzar**, sin tocar ninguna lógica. También bloqueado server-side: `POST /api/embajador/solicitudes` devuelve 403 si `acuerdo_aceptado` es falso.

**9. Páginas legales (Términos, Privacidad, Cookies, Uso responsable de IA) — ✅ ESTRUCTURA RESUELTA, CONTENIDO PENDIENTE (2026-09-22)**  
Rutas públicas creadas: `/terminos`, `/privacidad`, `/cookies`, `/uso-de-ia`, compartiendo `components/LegalLayout.tsx`. Cada una tiene sus secciones esperadas con un marcador `[PENDIENTE — contenido a redactar por el CEO o asesoría legal]` en cada una — **no se inventó ningún texto legal real**, solo la estructura. El footer de la landing (`app/page.tsx`) NO las enlaza todavía, tal como se decidió, para evitar exponer páginas sin contenido real. Enlazarlas desde el footer/navegación es la última tarea, una vez el CEO/abogado reemplace el contenido.

**10. Sección de blog/recursos en la landing**  
La landing planea una columna de footer con guías (qué es ATS friendly, cómo redactar experiencia, etc.) para SEO. Decisión del CEO: no es prioridad ahora, pero cuando se construya debe permitirle publicar posts él mismo (no solo páginas estáticas hardcodeadas). No enlazar en el footer hasta que exista contenido real.

### 🟢 Baja (mejoras técnicas)

**11. Clasificación de habilidades con `tipo` — ✅ RESUELTO, esta nota estaba obsoleta.** Confirmado 2026-09-22: `chat`, `parse-document` y `profile/hydrate` YA clasifican `tipo` de forma confiable. Además, la categorización técnica/blanda ya llega al CV generado (ver sección 17).

**12. Curación de texto LinkedIn — ✅ RESUELTO (2026-09-22)**  
El prompt real es `STRUCTURE_PROMPT` en `app/api/profile/hydrate/route.ts` (no `lib/embajadores.ts`, que no tiene nada de LinkedIn — esa referencia estaba mal). Ahora reescribe `about` en tono profesional de CV (sin emojis/hashtags/muletillas, condensado a 2-4 líneas) en vez de copiarlo literal, con la misma regla anti-alucinación del resto del sistema (nunca inventa hechos que no estén ya en el "about"). Verificado con una llamada real a Anthropic.

**13. Sistema de match unificado — ✅ RESUELTO (2026-09-22)**  
Existían dos números de compatibilidad distintos: el determinístico de `computeMatchScore()` (`lib/cv/pipelines/vacancy.ts`) y el que devolvía la IA en `/api/match-vacante` (P8), que podían no coincidir. Ahora `computeMatchScore()` es la única fuente del porcentaje — `/api/match-vacante` lo recibe como dato ya calculado y solo genera `recomendaciones`/`explicacion` coherentes con él (con re-anclaje defensivo por si el modelo intenta devolver su propio número). `create-cv/preview/page.tsx` actualizado para nunca dejar que la respuesta de esa llamada sobreescriba el porcentaje. Verificado con una generación real en modo vacante: el mismo número (60%) aparece en `cvs.match_porcentaje`, en la respuesta de `generate-cv`, y en la respuesta de `match-vacante`.

**14. `pagos` sin permisos de tabla — 🔴 CRÍTICO, ✅ RESUELTO (2026-09-22)**  
Hallazgo grave durante la verificación del punto 5: `public.pagos` y `public.suscripciones` se crearon con RLS activado pero **sin los `GRANT` que sí tienen todas las demás tablas** del sistema. Confirmado empíricamente que tanto `authenticated` como `service_role` recibían `permission denied for table pagos` — es decir, ningún pago cripto pudo haberse creado o confirmado nunca en producción, y el historial de pagos de cualquier usuario en `/account` se veía silenciosamente vacío (el código hace `data || []`, sin mostrar el error). Arreglado con `scripts/migration-pagos-grants.sql`, ya ejecutado y verificado.

**15. Rate limiting real con Upstash — ✅ RESUELTO (2026-09-22)**  
`lib/rate-limit.ts` reescrito sobre `@upstash/ratelimit` + `@upstash/redis` (sliding window), con fallback a limitador en memoria si `UPSTASH_REDIS_REST_URL`/`TOKEN` no están configuradas o si Upstash no responde (fail-open). `rateLimit()` ahora es async — los 9 call-sites ya actualizados con `await`. Verificado contra la cuenta real de Upstash del CEO: se confirmó una clave real (`momentum-ratelimit:<user_id>:...`) escrita en la base de datos vía la REST API de Upstash, no solo el patrón de respuestas HTTP.

**16. `NOWPAYMENTS_IPN_SECRET` era el placeholder sin rellenar — 🔴 CRÍTICO, ✅ RESUELTO (2026-09-22, local y producción)**  
Hallado por casualidad al editar `.env.local` para Upstash: el secreto IPN de NOWPayments era literalmente el texto `your_nowpayments_ipn_secret` sin reemplazar. Con eso, cualquiera podía forjar una llamada al webhook (`POST /api/payments/webhook`) firmada con ese valor público y marcar un pago como confirmado sin haber pagado nada. El CEO proporcionó el secreto real (dashboard de NOWPayments → Store settings → IPN) y ya lo actualizó también en Vercel. Verificado estructuralmente: una firma forjada con el placeholder viejo ahora es rechazada (401, el pago queda `pendiente`), y la firma real confirma el pago correctamente (200, `confirmado`).

**17. Otras 4 tablas sin `GRANT` (mismo patrón que `pagos`) — 🔴 CRÍTICO, ✅ RESUELTO (2026-09-22)**  
Encontrado por casualidad corriendo `scripts/setup-paypal-plans.js` (Fase 8): `configuracion` fallaba con `permission denied`. Auditando todos los `scripts/migration-*.sql` en busca del mismo patrón (RLS activado, sin `GRANT`), aparecieron 4 tablas rotas:
- **`cvs_inspiracion` — el más grave de los cuatro.** Sin ningún `GRANT`, ni para `authenticated` ni para `service_role`. `src/features/cv-inspiracion/lib/supabase-cv-service.ts` usa el cliente del navegador (`authenticated`) para todo — insertar, actualizar, leer y borrar el estado del canvas. **CV Studio nunca ha podido guardar ni cargar ningún diseño en producción.** Verificado con un usuario autenticado real: insert/update/select ahora funcionan de punta a punta (antes del fix, fallaban los tres).
- **`configuracion`** — sin `GRANT`. `getConfig()` (`lib/config.ts`) traga el error silenciosamente y cae a los `DEFAULTS` hardcodeados — los precios reales nunca se han leído de la base de datos, y `PATCH /api/admin/config` nunca pudo persistir un cambio de precio real.
- **`linkedin_profiles_cache`** — sin `GRANT` para `service_role` (es la única tabla de las 4 pensada para acceso exclusivo por admin client). La importación de LinkedIn sigue funcionando de punta a punta porque el código no lanza si el guardado en caché falla, pero nunca cacheaba nada — cada importación repetía el scraping completo con Apify, gastando créditos de más.
- **`cv_templates`** — tenía `GRANT` a `authenticated` pero no a `service_role`.

Arreglado con `scripts/migration-grants-sweep.sql`, ejecutado y verificado (incluyendo una prueba real de insert/update/select en `cvs_inspiracion` con un usuario autenticado de prueba, no solo con el cliente admin).

**Nota para el futuro:** esto ya son 6 tablas (`pagos`, `suscripciones`, `configuracion`, `cvs_inspiracion`, `linkedin_profiles_cache`, `cv_templates`) encontradas con este mismo patrón en dos hallazgos separados. Cualquier tabla nueva creada con SQL crudo (no desde el editor de tablas de Supabase) debe llevar su bloque `GRANT` explícito desde el primer momento — ver la advertencia ya agregada en `CLAUDE.md` sección de base de datos.

**18. PayPal Subscriptions para el Plan Pro — ✅ IMPLEMENTADO Y VERIFICADO EN SANDBOX (2026-09-22, Fase 8 — última fase del plan maestro)**  
El botón "Mejorar a Pro" en `/account` ahora es el botón real de PayPal (JS SDK, `intent=subscription`), y "Cambiar a Plan Inicio" cancela de verdad.
- **`lib/paypal.ts`** — OAuth2 (con caché en memoria), creación/consulta/cancelación de suscripciones, verificación de firma de webhook contra la API real de PayPal (no HMAC simple como NOWPayments).
- **`scripts/setup-paypal-plans.js`** — script de una sola vez que crea el Producto "Momentum Pro" y los 2 Billing Plans (mensual/anual) leyendo el precio real de `configuracion`. Ya corrido en Sandbox: `PAYPAL_PLAN_ID_MENSUAL`/`PAYPAL_PLAN_ID_ANUAL` en `.env.local`. **Falta correrlo en Live** cuando se lance de verdad (cambiar `PAYPAL_MODE=live` + credenciales Live).
- **Endpoints:** `POST /api/paypal/create-subscription` (server decide el `custom_id`, nunca el cliente), `POST /api/paypal/confirm-subscription` (camino rápido tras `onApprove`, re-verifica contra PayPal antes de subir a Pro), `POST /api/paypal/cancel-subscription` (downgrade **inmediato**, decisión del CEO), `POST /api/paypal/webhook` (fuente de verdad durable — `ACTIVATED`→Pro, `SUSPENDED`/`CANCELLED`/`EXPIRED`→gratuito, `PAYMENT.SALE.COMPLETED`→fila en `pagos` para el historial).
- **`suscripciones`** ganó `paypal_subscription_id` (UNIQUE) y `paypal_plan_id` — `scripts/migration-paypal.sql`.
- **CSP arreglada** (`next.config.ts`): el SDK de PayPal (`www.paypal.com`, `www.paypalobjects.com`) estaba bloqueado por la Content-Security-Policy existente — se descubrió al probar el botón real en navegador, no solo con `tsc`. Agregado a `script-src`, `connect-src`, `img-src`, `frame-src`.

**Verificado de punta a punta con Sandbox real** (no simulado): creación de suscripción real → aprobación real en el checkout de PayPal (navegador controlado con Playwright, cuenta buyer de sandbox) → PayPal confirma `status: ACTIVE` → `confirm-subscription` sube `profiles.plan` a `pro` y crea la fila en `suscripciones` → `cancel-subscription` baja a `gratuito` de inmediato Y PayPal confirma `status: CANCELLED` de su lado → un segundo intento de cancelar da 404 correctamente. También verificado que el botón real de PayPal renderiza sin errores de consola tras el fix de CSP (capturado con screenshot).

**⚠️ Lo único que NO se pudo verificar con entrega real: el webhook.** ngrok bloqueó la IP de este entorno de ejecución (`ERR_NGROK_9040`, no relacionado a la cuenta ni al token) y no había otra forma de exponer `localhost` públicamente sin desplegar a un dominio real. Se verificó en su lugar: (a) que una firma forjada es rechazada de verdad por la API de PayPal (401, mismo patrón que NOWPayments), y (b) que la lógica de negocio del handler usa exactamente los mismos campos (`custom_id`, `plan_id`, `billing_info.next_billing_time`) ya probados en `confirm-subscription`/`cancel-subscription` contra la API real. **Pendiente real:** probar la entrega del webhook end-to-end una vez haya una URL pública (staging o producción) — hasta entonces, la activación/cancelación funcionan igual gracias al camino rápido de `confirm-subscription`/`cancel-subscription`, pero si un usuario cierra la pestaña antes de que esos endpoints respondan, o si PayPal suspende por fallos de pago sin que el usuario haga nada, el único camino que lo reflejaría es el webhook — no probado con entrega real todavía.

**Otros pendientes reales antes de cobrar dinero de verdad:**
- Registrar el webhook de producción (`POST /v1/notifications/webhooks` con la URL real) y poner su `id` en `PAYPAL_WEBHOOK_ID` — el usado en las pruebas de Sandbox se creó apuntando a una URL falsa y ya se borró.
- Correr `scripts/setup-paypal-plans.js` en modo Live para obtener los planes reales, y actualizar todas las variables `PAYPAL_*`/`NEXT_PUBLIC_PAYPAL_CLIENT_ID` en Vercel con las credenciales Live (nunca las de Sandbox).
- ~~Hallazgo menor: `/account` decía "2 estilos de CV incluidos"~~ — **✅ RESUELTO (2026-09-22).** Corregido junto con dos afirmaciones falsas más en la lista de Pro ("Los 7 estilos disponibles" y "Análisis de compatibilidad avanzado" no correspondían a ningún gating real en el código). Ver punto 20 para el resto de lo verificado en esta misma tanda (suite de pruebas reparada).

---

## 19. 🔴 La saga de producción — Momentum nunca había estado realmente desplegado (2026-09-22)

**El hallazgo más grande de toda la sesión, descubierto por accidente al preguntar "¿cómo se despliega esto a producción?".** Resumen para que nunca se vuelva a perder de vista:

1. **El repo local no tenía remoto de git.** Todo el trabajo de esta sesión (y meses anteriores, a juzgar por el historial) vivía solo en esta máquina. El repo de GitHub conectado a Vercel (`github.com/abeljoseca/cv-ai-app`, rama `main`) tenía un historial de git **completamente distinto, sin ancestro común** — una versión primitiva del producto (rutas en español, sin `lib/cv/`, sin embajadores, sin CV Studio, sin pagos reales) cuyo último commit era del **17 de abril de 2026**, más de 5 meses de antigüedad.
   - Resuelto: se respaldó el `main` viejo completo en la rama `legacy-abril-2026` (recuperable, nada se perdió), y se reemplazó `main` con el código real vía `git push --force`. Confirmado con el CEO antes de forzar.
2. **A Vercel le faltaban variables de entorno** para todo lo construido esta sesión (`UPSTASH_*`, `PAYPAL_*`, `APIFY_TOKEN`) y tenía `NEXT_PUBLIC_SITE_URL=localhost` en producción.
3. **"Vercel Authentication" (Standard Protection) estaba activado en el proyecto** — bloqueaba a cualquier visitante sin cuenta de Vercel, incluso en el dominio público. Desactivado.
4. **`momentumcv.com` nunca había estado conectado a Vercel.** El dominio apuntaba a la página de estacionamiento por defecto de Aruba (el registrador). Conectado por primera vez: registro A (`@` → `216.198.79.1`) y CNAME (`www` → el valor que dio Vercel) configurados en Aruba, con cuidado de no tocar los registros de correo (`mail`, `mx`, `imap`, etc.) que sí eran reales.
5. **El widget de Cloudflare Turnstile tenía un typo en los hostnames** (`momentum.com` en vez de `momentumcv.com`) — causaba el error 110200 ("dominio no autorizado") en login/registro. Corregido.
6. **El más grave de todos: Vercel apuntaba a un proyecto de Supabase completamente distinto** (`tqgupcgocnjtbrvyxkjd`, el de la versión vieja de abril) del que se usó **toda la sesión** para migraciones, arreglos de permisos y pruebas (`otaehqzjwrhdkzdfchhr`, el de `.env.local`). Se confirmó con evidencia (actividad reciente real del super-admin, 30 usuarios todos de prueba del propio CEO) que `otaehqzjwrhdkzdfchhr` es el proyecto correcto. Corregido: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` actualizadas en Vercel.
7. **Hallazgo aparte, todavía sin resolver:** "¿Olvidaste tu contraseña?" en `/login` es un link muerto (`href="#"`) — nunca se implementó `resetPasswordForEmail()`. Se desbloqueó al CEO manualmente vía la API admin de Supabase como parche puntual, pero **cualquier otro usuario que se bloquee hoy no tiene forma de recuperar su cuenta solo**. Ver pendiente en la sección de abajo.
8. **El proyecto viejo de Supabase (`tqgupcgocnjtbrvyxkjd`) no se borró** — decisión deliberada: no se auditó por dentro y borrar un proyecto es irreversible. Revisar su contenido con calma antes de decidir si eliminarlo.
9. **Supabase Auth → URL Configuration tenía `Site URL` y `Redirect URLs` apuntando solo a `localhost:3000`** — mismo patrón que Turnstile, mismo root cause (proyecto usado siempre solo en local). Habría roto OAuth de Google/LinkedIn y cualquier link de email (confirmación, magic link) en producción. Corregido: se agregó `https://www.momentumcv.com` como Site URL y `https://www.momentumcv.com/**` a Redirect URLs, **sin quitar** la entrada de `localhost` (sigue haciendo falta para seguir desarrollando en local).
10. **Login social configurado y verificado end-to-end (2026-09-22):**
    - **Google:** no existía ninguna app OAuth — se creó desde cero en Google Cloud Console (proyecto "Momentum CV", pantalla de consentimiento en modo "Usuarios externos"/prueba, cliente OAuth con origen `https://www.momentumcv.com` y redirect URI `https://otaehqzjwrhdkzdfchhr.supabase.co/auth/v1/callback`), y activado en Supabase con esas credenciales. Verificado con navegador real: el flujo llega hasta la pantalla real de "Sign in with Google" pidiendo correo. **Nota:** Google la tiene en modo de prueba — solo los correos agregados como "usuarios de prueba" en la pantalla de consentimiento pueden usarla hasta que se envíe a verificación de Google (pendiente, no urgente).
    - **LinkedIn:** ya estaba configurado de sesiones anteriores del CEO y **seguía funcionando sin cambios** (usa el mismo proyecto de Supabase de siempre). Verificado con navegador real: llega a la pantalla real de login de LinkedIn con el redirect correcto.
    - **Aclaración de una confusión del CEO:** iniciar sesión con LinkedIn **no** dispara la importación de perfil vía Apify — son dos features separadas. La importación (`/api/profile/hydrate`, usada desde `onboarding/page.tsx` y `components/import/ImportFlow.tsx`) es un paso manual donde el usuario pega su URL de LinkedIn.

**Estado final confirmado:** `www.momentumcv.com` sirve el código real con SSL, apunta a la base de datos correcta, y el CEO pudo iniciar sesión de verdad por email, y por primera vez también quedaron verificados extremo a extremo (hasta donde es posible sin credenciales humanas) el login con Google y LinkedIn. Primera vez que todo esto es cierto en la historia del proyecto.

---

## 20. Correcciones de copy y reparación de la suite de pruebas (2026-09-22)

- **`/account`:** corregidas 3 afirmaciones falsas sobre diferencias entre planes (ver arriba). Ahora solo lista beneficios verificados en código: bloqueo de "un CV sin pagar" (Inicio) vs. sin bloqueo (Pro), límite de 5 aplicaciones (Inicio, verificado en `applications/page.tsx`) vs. ilimitadas (Pro), PDF (Inicio) vs. PDF+DOCX (Pro, verificado en `ExportButtons.tsx`).
- **Suite de pruebas reparada:** `vitest` no podía ni arrancar (`jsdom` no estaba instalado pese a que la config lo requería, y no excluía los specs de Playwright, causando que intentara cargarlos y fallara). Arreglado — 14/14 tests unitarios pasan. Agregado `test`/`test:e2e` a `package.json`.
- **`tests/e2e/*.spec.ts` — diagnosticados como obsoletos más allá de un arreglo rápido, no reparados.** Referencian rutas que ya no existen (`/create-cv/general`) y estilos viejos ("Clásico"), y ninguno autentica de verdad (`auth.spec.ts` choca directo con Turnstile; `cv-creation.spec.ts` tiene un `// TODO: usar credenciales de test` literal, nunca se implementó). Arreglarlos de verdad requiere primero construir un bypass de Turnstile para entorno de pruebas — es una decisión de producto, no un cambio de archivo de test.

---

## 21. Lista de pendientes activa post-lanzamiento (2026-09-22)

Acordada con el CEO tras confirmar que producción ya sirve el código real. Se trabaja uno por uno, marcando cada uno al cerrarlo:

1. ✅ **"¿Olvidaste tu contraseña?"** — **RESUELTO (2026-09-22).** `/forgot-password` (pide el correo, `resetPasswordForEmail` + Turnstile) y `/reset-password` (establece la nueva contraseña) implementadas de verdad, con el enlace de `/login` ya conectado. El enlace de recuperación llega como tokens en el fragmento hash (`#access_token=...&type=recovery`) en vez del `?code=` de PKCE — el cliente de Supabase no lo auto-detectaba, así que `/reset-password` lo parsea a mano y llama `setSession()` directamente; también soporta el caso `?code=` por si algún día cambia. Verificado de punta a punta con un usuario de prueba real: enlace generado → sesión establecida → contraseña cambiada → pantalla de éxito real (no solo "no dio error").
2. ⬜ **Verificación de Google OAuth** — hoy solo funciona para usuarios de prueba agregados a mano en Google Cloud; falta enviar a verificación para que cualquier usuario real pueda usarlo.
3. ⬜ **PayPal Live** — pasar de Sandbox a credenciales reales (`scripts/setup-paypal-plans.js` en modo Live, webhook de producción, variables en Vercel).
4. ⬜ **Contenido legal y acuerdo de embajadores** — el CEO/abogado redacta el texto real para reemplazar los placeholders ya estructurados.
5. ⬜ **Proyecto viejo de Supabase (`tqgupcgocnjtbrvyxkjd`)** — auditar contenido y decidir si se elimina.

---

## 13. Patrones de código importantes

### Admin vs User client
```typescript
// SIEMPRE para queries de admin que deben ver todos los datos:
import { createAdminClient } from '@/lib/supabase/admin'
const admin = createAdminClient()

// Para operaciones del usuario autenticado (respeta RLS):
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
```

### params dinámicos en Next.js 15
```typescript
// CORRECTO (Next.js 15 — params es Promise):
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  ...
}
```

### Portal para modales
```typescript
// Usar siempre createPortal para overlays de pantalla completa:
import { createPortal } from 'react-dom'
// ...
{open && typeof document !== 'undefined' && createPortal(
  <div style={{ position: 'fixed', inset: 0, zIndex: 9999, ... }}>
    ...
  </div>,
  document.body
)}
```

### Select custom (en lugar de <select> nativo)
```tsx
import { Select } from '@/components/Select'
<Select
  value={val}
  onChange={(v) => setVal(v)}
  options={[{ value: 'x', label: 'X' }]}
  style={{ width: '100%' }}     // wrapper
  triggerStyle={{ fontSize: 13 }} // botón
/>
```

---

## 14. Convenciones y restricciones importantes

- **Sin emojis** en la UI. Solo iconos SVG vectoriales.
- **Sin comentarios de código** salvo que expliquen un WHY no obvio.
- **maxWidth en páginas admin/embajador** es dinámico: `sidebarOpen ? 1060 : 1400` vía `useSidebar()`
- **`APIFY_TOKEN`** es server-only. Nunca con prefijo `NEXT_PUBLIC_`.
- El endpoint LinkedIn está obfuscado como `/api/profile/hydrate` con body `{ uri, async }` / response `{ ok, patch, q }`
- El superadmin se identifica por `email === process.env.SUPER_ADMIN_EMAIL`. Solo él puede asignar rol admin.
- Todos los cambios de estado en el admin panel tienen `ConfirmModal` de confirmación antes de ejecutar.
- Los GRANTs de Supabase para las tablas de embajadores están en el script SQL. Si se crean tablas nuevas, agregar `GRANT ALL ON nueva_tabla TO service_role; GRANT SELECT, INSERT, UPDATE, DELETE ON nueva_tabla TO authenticated;`

---

## 15. Bloqueo de generación sin pagar — diseño (pendiente #1, NO implementado)

### El mecanismo propuesto

Reemplazar la dependencia del campo `cv_pendiente_pago_id` (que solo se escribe cuando el usuario *inicia* un pago desde `/api/payments/create` — si nunca llega a esa pantalla, el campo nunca se setea y el usuario nunca queda bloqueado) por una invariante derivada, calculada en cada intento de generación:

> **¿Existe algún CV de este usuario (en `cvs` o en la tabla de CV Studio) sin un pago con `estado = 'confirmado'` vinculado? Si sí → bloquear.**

Esto se calcula fresco cada vez (no depende de que un puntero se haya escrito/borrado correctamente en el momento correcto), así que no puede desincronizarse como pasaba con `cv_pendiente_pago_id`. Debe vivir **al inicio de cada endpoint que genera contenido** (`/api/generate-cv`, `/api/mirror-cv` si sobrevive, el endpoint de creación de CV Studio) — antes de gastar ningún token de IA — y solo aplica si `profile.plan !== 'pro'`.

`cv_pendiente_pago_id` puede conservarse solo como atajo de UI (mostrar el banner "tienes un CV sin pagar"), nunca como el mecanismo de seguridad real.

### Vectores de abuso identificados (para que no se cuelen)

1. **Bypass del cliente (el que ya existe hoy):** el chequeo debe estar en el servidor. Confirmado que hoy no lo está — es el hallazgo de esta auditoría.
2. **Multi-cuentas:** el chequeo es por `user_id` — alguien puede registrar una cuenta nueva por cada CV gratis. No hay forma de eliminar esto al 100% sin verificación de identidad, pero ayuda: exigir verificación de email antes de poder generar, y vigilar patrones (mismo IP/dispositivo registrando muchas cuentas en poco tiempo).
3. **Pagos abandonados:** un pago en estado `pendiente` que nunca se confirma (usuario nunca envía la cripto) NO libera el bloqueo — correcto, coincide con la regla. `/api/payments/create` ya reutiliza el pago pendiente existente en vez de crear uno duplicado, así que el usuario siempre tiene un camino para retomar el pago del CV que ya generó.
4. **Condición de carrera:** si el mismo usuario dispara dos generaciones casi simultáneas (doble clic, dos pestañas) antes de que la primera inserte su fila en `cvs`, ambas podrían pasar el chequeo y crear 2 CVs sin pagar en vez de bloquear la segunda. Impacto bajo (el rate limit de 5/min ya reduce esto), pero si se quiere cerrar del todo: mover el chequeo + insert a una función SQL atómica (transacción), no dos pasos separados en la API route.
5. **Cambiar de estilo antes de pagar:** bajo esta regla, generar el mismo perfil en un estilo distinto ANTES de pagar el primero también cuenta como "crear otro CV" y queda bloqueado — no hay excepción para "solo estoy probando estilos". Es coherente con lo que pidió el CEO explícitamente, pero vale tenerlo presente como trade-off de conversión: un usuario indeciso entre estilos tiene que pagar el primero para poder ver el segundo.

### Preguntas — ✅ todas resueltas (2026-09-21), implementación completa

1. **CV Studio NO conserva "primera descarga gratis"** — se paga desde la primera, sin excepción. `user_has_unpaid_cv()` no necesita casos especiales por tabla.
2. **`profiles.plan` no se renombra en BD** — sigue siendo `'gratuito' | 'pro'` internamente. Solo el texto visible cambió a "Plan Inicio" en las 8 pantallas donde aparecía (admin, embajadores, `/account`).
3. **Mensaje de error:** "Ya tienes un CV sin pagar. Complétalo para poder crear uno nuevo." — implementado en `/api/generate-cv` y `/api/mirror-cv`.

**Estado de implementación:** `scripts/migration-unpaid-cv-check.sql` creado (función `user_has_unpaid_cv()` + política RLS de `cvs_inspiracion` actualizada) — **falta ejecutarlo en el SQL Editor de Supabase**, el código ya llama a esa función y fallará hasta que exista. `/api/generate-cv` y `/api/mirror-cv` ya llaman al RPC antes de generar.

---

## 16. Reescritura de `/create-cv` — create-cv-v2 promovido a producción (2026-09-21)

Decisión del CEO: el wizard nuevo (`/create-cv-v2`, hasta ahora un sandbox sin enlazar desde ningún menú) pasa a ser la experiencia real de `/create-cv`. `/create-cv-v2` se conserva como sandbox activo para seguir iterando — ambos archivos parten hoy del mismo contenido, pero pueden divergir libremente a partir de ahora.

**Bug crítico encontrado y corregido en el camino:** el `ESTILOS` de create-cv-v2 tenía IDs viejos (`classic`, `modern`, `minimal`, `bold`) que ya no existen en `lib/cv/styles/index.ts` — de haberse promovido tal cual, seleccionar cualquier estilo salvo "Ejecutivo" habría hecho fallar `/api/generate-cv` con `Unknown style ID`. También le faltaban 2 de los 7 estilos reales (Tech y Minimalista). Corregido: los 7 IDs reales, con `isPro` (Harvard y Stanford incluidos en Plan Inicio, los otros 5 exclusivos de Pro — coincide con las cifras ya usadas en `/account`).

**Se añadió al wizard nuevo** (no existía en el sandbox original): banner + `PaymentModal` cuando `cv_pendiente_pago_id` está seteado (bloqueo de pago pendiente), y gating de estilos Pro-only con badge "Pro" + botón "Mejorar cuenta para usar este estilo" (igual que ya hacía el `/create-cv` viejo).

**Otro bug de la misma familia, encontrado y corregido en `app/(app)/cvs/page.tsx`:** `ESTILO_NOMBRES` también tenía los 5 IDs viejos — como ningún CV real usa esos IDs, "Mis CVs" mostraba el ID crudo en vez de un nombre bonito para cada estilo, para todo el mundo, hasta ahora.

**Limpieza asociada:**
- Borradas `app/(app)/create-cv/general/page.tsx` y `create-cv/job/page.tsx` — huérfanas, nada las enlazaba, mismos IDs viejos.
- `components/AdminDashboard.tsx` / `AdminUsersTable.tsx` — confirmado que no los importa nadie (huérfanos de una versión anterior del panel admin). No se borraron, solo se actualizó su texto por consistencia. Candidatos a eliminar cuando el CEO confirme que no se van a reusar.
- `AdminDashboard.tsx` todavía tiene un texto suelto mencionando "Mirror" — inofensivo porque el archivo es código muerto, pero queda pendiente si algún día se reactiva ese componente.

---

## 17. Calidad de redacción de CVs — Framework VALOR y fixes de renderizado (2026-09-22)

Un CV de prueba (estilo Harvard) fue revisado por un profesional de RRHH externo: veredicto "no pasa los primeros 6 segundos del reclutador". Diagnóstico completo contra el código real + fixes aplicados. Documento de referencia del framework de redacción: "Especificación Técnica — Sistema de Redacción de Logros Momentum" (Framework VALOR™, compartido por el CEO, no versionado en el repo).

**🔴 Persona gramatical incorrecta (el bug más grave encontrado).** `lib/cv/styles/*.ts` describía la convención "sujeto implícito, voz activa" de forma genérica — un patrón que solo tiene sentido gramatical en inglés. Sin una regla explícita de persona por idioma, el modelo conjugaba en tercera persona en español ("Redujo", "Evalúa"), que en un CV se lee como si describiera las acciones de otra persona. Fix en `lib/cv/prompts/global-rules.ts`: nueva regla `personDirective`, específica por idioma (es/pt: primera persona singular sin pronombre — "Reduje"/"Reduzi"; fr: primera persona con pronombre elidido — "J'ai réduit"; en: se mantiene la convención de sujeto implícito, que ahí sí es válida). Verificado con generación real: 100% de los bullets en primera persona tras el fix.

**🔴 Rol actual/presente sin el mismo rigor que roles pasados.** El modelo trataba la experiencia "Presente" como descripción de funciones del puesto en vez de logros. Fix: nueva regla `CURRENT / ACTIVE ROLE` en `global-rules.ts` — mismo requisito de outcome que un rol pasado, solo cambia el tiempo verbal. Verificado: con datos de prueba sin ninguna métrica disponible para el rol actual, el modelo generó resultados cualitativos concretos en vez de restatar funciones del cargo.

**🟠 "Logros"/Achievements duplicaba literalmente "Experiencia".** Nueva regla en `global-rules.ts`: el modelo debe revisar `experiencias[].bullets` antes de escribir `logros`, y devolver `logros: []` si todo logro real ya está cubierto arriba — nunca restatar por rellenar. Verificado con un logro de prueba que duplicaba a propósito un bullet de experiencia: el modelo lo omitió correctamente (`logros: []`), en vez de repetirlo.

**🟠 Skills sin respaldo textual.** Nueva regla: preferir en el orden las skills evidenciadas en el contenido generado, sin eliminar nunca una skill real declarada por el usuario aunque no tenga respaldo (evita ocultar información verídica solo por prolijidad).

**🔴 Fondo gris en el PDF exportado.** Causa raíz: `app/globals.css` define `body { background: var(--bg) }` sin ninguna media query — aplica también en impresión. `app/cv/[id]/imprimir/page.tsx` solo lo sobreescribía bajo `@media screen`, nunca lo devolvía a blanco en `@media print`. Fix de una línea: `html, body { background: #ffffff !important }` dentro de `@media print`, más lo mismo en `.cv-container`. Verificado con `page.emulateMedia({ media: 'print' })`: el fondo computado pasó de gris a `rgb(255,255,255)`.

**🔴 Salto de página deficiente (bloques huérfanos).** La exportación real usa `window.print()` (paginación nativa del navegador), no el `html2canvas`+`jsPDF` de `lib/export.ts` — ese código está muerto, `ExportButtons.tsx` no lo importa nadie en la app real. Fix: `breakInside: 'avoid'` agregado a cada bloque de experiencia/educación/proyecto y a los bullets de logros, en los 7 componentes de estilo.

**🟠 Encabezados de sección en inglés, hardcodeados.** Confirmado en los 7 componentes de `components/CVTemplates/`: "Experience", "Education", "Skills", "Achievements", etc. son strings literales en JSX, completamente ajenos a la directiva de idioma del prompt (que solo controla el contenido generado por IA, nunca las etiquetas fijas del componente). Decisión del CEO: traducir fijo a español ahora (coherente con que el producto es español-only hoy). Aplicado en los 7 componentes — Europass ya estaba en español (sigue el estándar oficial). Verificado con render real: "EXPERIENCIA" aparece correctamente, cero rastro de headers en inglés.

**🟡 Teléfono sin formato.** Nueva utilidad `lib/format-phone.ts` — best-effort para números `+cc` con 10 dígitos locales (formato `+58 414-573-5559`), nunca modifica un número que no reconozca con confianza. Aplicada en los 7 componentes. Verificado con render real.

**🟡 Bug real en fechas de Educación (no era "falta de campo").** El formulario de `/profile` sí tiene "Año graduación" (`fecha_fin`) — el reporte asumía que faltaba, pero el bug estaba en cada componente: `formatDate(inicio, fin)` hacía `if (!inicio) return ''`, y como Educación nunca tiene `fecha_inicio` (correcto, no tiene sentido pedirlo), el año de graduación se descartaba en silencio aunque existiera. Fix de una línea en los 7 componentes: `if (!inicio) return fin || ''`.

**Diferido — requiere su propio esfuerzo, no son bugs:**
- **Categorización visual de skills** (herramientas vs. competencias): los datos YA existen — la tabla `habilidades` tiene columna `tipo` ('tecnica'/'blanda') que hoy `prepareUserData.ts` no selecciona. Implementarlo bien requiere: threading de `tipo` por `CVUserData`/`CVContent`, actualizar el schema de salida del prompt, y rediseñar la sección de skills en los 7 componentes para renderizar dos grupos. Es un cambio de esquema, no un fix puntual.
- **Campo de mes obligatorio en fechas de experiencia:** el input ya es texto libre que acepta "2021-03" (placeholder lo sugiere), pero no lo exige. Redecidir el input (¿`type="month"`? ¿selects separados?) es una decisión de UX, no se tocó.

**🟠 Redundancia interna en Educación (hallazgo 2.2) — corregido 2026-09-22, se había pasado por alto en la primera tanda.** "Asistencia Virtual con enfoque en Análisis de Datos" + subtítulo "Análisis de Datos" repetía la misma idea. Nueva utilidad `lib/format-education.ts` (`shouldShowArea`) — oculta el subtítulo `area` cuando ya está contenido en `titulo` (normaliza acentos/mayúsculas antes de comparar). Aplicada en los 5 componentes que renderizan `area` (Harvard, Stanford, Silicon Valley, Tech, Europass — Minimalist y Executive no muestran `area` en absoluto). Verificado con el string exacto del caso reportado.

**✅ Cuantificación forzada — corregido y verificado (2026-09-22).** Cuando el rol actual tenía muy poca sustancia cuantificable, la regla "todo bullet necesita métrica" producía cuantificadores técnicamente honestos pero débiles (ej. "al menos 1 línea de producto activa") — no era alucinación, pero sonaba a relleno, y no era fiel a la sección 10 del documento VALOR, que ya preveía este caso. Nueva regla `QUANTIFICATION` en `global-rules.ts`: un resultado cualitativo fuerte y específico vale más que un número forzado y débil — solo usar cifra cuando sea real y fortalezca genuinamente la afirmación. Verificado con generación real usando datos deliberadamente sin ningún número: los 3 bullets del rol actual salieron con cierres cualitativos concretos ("manteniendo trazabilidad completa...", "consolidando el proceso... para todo el equipo...", "asegurando la continuidad operativa...") — cero cuantificadores débiles fabricados.

**✅ Categorización de skills (hallazgo 4.3) — implementado y verificado (2026-09-22).** Sin tocar el schema de salida de la IA en absoluto (más seguro): la IA sigue devolviendo `habilidades: string[]` igual que siempre; el pipeline (`general.ts`/`vacancy.ts`) categoriza DESPUÉS de la validación, usando `lib/skill-classification.ts` (`splitSkills`) — extraído del heurístico `isLikelySoft` que ya vivía en `/profile`, ahora compartido entre ambos. Prioriza el `tipo` real guardado en la tabla `habilidades` (que YA se clasifica de forma confiable en chat, parse-document y LinkedIn hydrate — el pendiente #11 de este documento que decía lo contrario estaba obsoleto) y solo cae al heurístico por palabras clave cuando `tipo` es null. `prepareUserData.ts` ahora trae `tipo` (antes lo descartaba con `select('nombre')`). Nuevos campos opcionales en `CVContent`: `habilidades_tecnicas`/`habilidades_blandas` — ausentes en CVs generados antes de este cambio, así que los 7 componentes usan el nuevo `components/CVTemplates/SkillsBlock.tsx` con fallback automático a la lista plana cuando no existen (retrocompatible, cero migración necesaria). Silicon Valley y Tech quedaron fuera a propósito — su fallback de habilidades en chips (cuando no hay `tech_stack`) es secundario en esos dos estilos, ya que su sección principal (`tech_stack`) ya viene categorizada por la IA. Verificado con generación real mezclando skills con `tipo` real y sin él: Excel/Google Sheets (tipo real) → técnicas, Confidencialidad y ética profesional (tipo real) → blanda, Python (sin tipo, heurístico) → técnica correctamente, Gestión del tiempo (sin tipo, heurístico) → blanda correctamente.

**✅ Cabo suelto encontrado y cerrado el mismo día: `/api/review-cv` (P9) podía descartar `habilidades_tecnicas`/`habilidades_blandas`.** "Guardar y revisar" (corrección ortográfica) recibe el CV completo como JSON genérico y le pide a Haiku "devuelve el JSON con los mismos campos" — un prompt que nunca fue actualizado para saber que estos dos campos nuevos existen. Que el modelo los preserve es una apuesta probabilística, no una garantía de código — probado una vez y funcionó, pero eso no basta. Fix real en `app/api/review-cv/route.ts`: después de parsear la respuesta del modelo, se reinsertan `habilidades_tecnicas`/`habilidades_blandas` desde el objeto original sin importar lo que haya hecho la IA. Verificado a nivel de lógica simulando que el modelo los descarta por completo — se recuperan igual. Nunca dependas de que un LLM "recuerde" devolver un campo que no le mencionaste explícitamente: si un dato es estructurado (no prosa que necesite corrección), reinsértalo en código después de la llamada, no confíes en que sobreviva el round-trip.

**Nota para quien siga extendiendo esto:** el archivo de especificación del Framework VALOR (compartido por el CEO) tiene un motor de extracción conversacional de 8 pasos y un banco de verbos por categoría funcional pensado específicamente para el chat de "Mi Perfil" (`app/api/chat/route.ts`) y el parseo de documentos — eso NO se implementó todavía, solo se llevaron a `global-rules.ts` las reglas que aplican directamente a la generación de CV (persona, rigor del rol actual, no-duplicación, respaldo de skills). Extender el motor de extracción completo al chat/parse-document/LinkedIn-hydrate queda pendiente como esfuerzo aparte.