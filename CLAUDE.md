# CLAUDE.md — Resumint

Este archivo es la fuente única de verdad para el desarrollo de Resumint.
Léelo completo antes de escribir cualquier línea de código.

---

## Qué es Resumint

Resumint es una aplicación web SaaS que usa inteligencia artificial para ayudar a cualquier persona a crear un CV profesional de alta calidad, sin necesidad de saber diseño ni redacción.

El usuario entrega información sobre su trayectoria conversando con la IA o subiendo un documento. La app genera un CV listo para usar: general o optimizado para una vacante específica, usando **exclusivamente información real del usuario**.

**Propuesta de valor:** En menos de 10 minutos, cualquier persona puede tener un CV bien estructurado y profesional.

---

## Stack técnico

- **Framework:** Next.js 14 con App Router
- **Lenguaje:** TypeScript (strict)
- **Base de datos / Auth / Storage:** Supabase
- **IA:** API de Anthropic — modelo `claude-haiku-4-5` para todo el MVP
- **Deploy:** Vercel
- **Generación DOCX:** librería `docx` de npm (solo plan Pro)
- **Exportación PDF:** render HTML/CSS del componente React → PDF
- **Gráficos (admin):** Recharts

---

## Principios que nunca se violan

1. El sistema **nunca inventa datos** del usuario.
2. La IA puede reorganizar, resumir y optimizar — nunca fabricar experiencia, cargos, logros o habilidades inexistentes.
3. `profesion_perfil` es intocable: solo el usuario la define. Ningún PDF ni chat la sobreescribe.
4. Nunca mostrar errores técnicos crudos al usuario.
5. Nunca descontar créditos por generaciones fallidas de la IA.
6. El MVP prioriza claridad, bajo costo operativo y validación rápida.

---

### 🎨 Identidad Visual y Sistema de Diseño

**Skill de referencia:** `ui-ux-pro-max` (frontend-design)

---

#### Dirección estética

La app debe sentirse como un producto nativo del ecosistema Apple: **limpia, deliberada, premium**.  
Las referencias son Linear, Stripe, y las apps de iOS 17+: composición generosa, tipografía con carácter, jerarquía obvia, cero ruido visual.

El usuario nunca debe preguntarse "¿qué hago aquí?".  
Cada pantalla tiene un único propósito claro y lo comunica de inmediato.

---

#### Paleta de colores

```css
--color-primary:     #1A2B4C;   /* Textos principales, headings */
--color-accent:      #4B6BFB;   /* CTAs, links, estados activos, focus */
--color-ink:         #0F172A;   /* Textos secundarios */
--color-muted:       #64748B;   /* Labels, placeholders, microtexto */
--color-border:      #E2E8F0;   /* Bordes, divisores */
--color-surface:     #F8FAFC;   /* Backgrounds suaves */
--color-white:       #FFFFFF;   /* Cards, modales */
--color-success:     #22C55E;   /* Confirmaciones, progreso completado */
```

Solo modo claro. Sin gradientes llamativos. Sin efectos 3D. Sin sombras duras.

---

#### Tipografía

- **Fuente principal UI:** `Inter` (alternativas permitidas: `Sora`, `Poppins`)
- **H1 / H2:** peso 600–700, letter-spacing ligeramente negativo (-0.01em a -0.02em)
- **Subtítulos:** peso 500–600
- **Texto base:** peso 400, 14px–16px
- **Microtexto / labels:** peso 400, color `--color-muted`
- No mezclar múltiples familias tipográficas
- No usar estilos decorativos

---

#### Componentes

**Cards**
- `border-radius: 12px–16px`
- Sombra: `0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)` (mínima, no aplastante)
- Fondo: `#FFFFFF`
- Borde opcional: `1px solid #E2E8F0`

**Botones primarios**
- Fondo: `#4B6BFB` | Texto: blanco
- `border-radius: 10px–12px`
- Hover: leve oscurecimiento del fondo (`#3B5BDB`)
- Sin gradientes, sin sombras exageradas

**Botones secundarios**
- Fondo: transparente | Borde: `1px solid #E2E8F0`
- Hover: fondo gris muy suave (`#F1F5F9`)

**Inputs**
- Padding amplio (no compactos)
- Bordes redondeados (`border-radius: 10px`)
- Estado focus: borde `#4B6BFB`, sin glow exagerado
- Tamaño suficiente para sensación "íntima" en mobile y desktop

---

#### Espaciado y layout

- Sistema de 8px estricto: todos los espaciados son múltiplos de 4px u 8px
- Uso intensivo de espacio en blanco — respirar es parte del diseño
- Estructura basada en cards, no en tablas ni listas densas
- Grid flexible, no rígido
- En mobile: padding horizontal generoso (mínimo 16px–20px)

---

#### Microinteracciones y movimiento

- Transiciones: `200ms–300ms`, easing `ease-out` o `cubic-bezier(0.4, 0, 0.2, 1)`
- Hover states siempre presentes y claros
- Feedback visual inmediato en cualquier acción del usuario
- Animaciones de estado (loading, éxito, error) suaves y no intrusivas
- Confeti en pantalla de éxito: bien ejecutado, no recargado

---

#### Lo que NO debe aparecer

- ❌ Gradientes llamativos o tipo "IA genérica" (azul → morado)
- ❌ Efectos 3D, brillos, partículas flotantes
- ❌ Sombras duras o muy pronunciadas
- ❌ Fondos oscuros (dark mode)
- ❌ Múltiples tipografías o pesos inconsistentes
- ❌ Stock fotográfico corporativo genérico
- ❌ Pantallas sobrecargadas de información o acciones simultáneas
- ❌ Sensación de "formulario" — debe sentirse como "construir tu perfil profesional"

---

#### Sensación general objetivo

> El usuario no está llenando un formulario.  
> Está construyendo su próxima oportunidad profesional.

La interfaz comunica: **confianza, claridad, progreso**.  
Cada pantalla tiene un propósito obvio. El usuario nunca se siente perdido ni abrumado.  
El estilo es el de un producto SaaS premium del ecosistema Apple: preciso, sobrio, con carácter.

---

## Estructura de base de datos (Supabase)

### Tabla: `profiles`
```sql
id              uuid PRIMARY KEY references auth.users(id)
nombre          text NOT NULL
apellido        text NOT NULL
email_cv        text NOT NULL
foto_url        text
telefono        text
ciudad          text
pais            text
profesion_perfil text
profesiones_inferidas text[] DEFAULT '{}'
resumen_profesional text
puntaje_completitud integer DEFAULT 0
onboarding_completado boolean DEFAULT false
plan            text DEFAULT 'gratuito'  -- 'gratuito' | 'pro'
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
```

### Tabla: `experiencia`
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id     uuid references profiles(id) ON DELETE CASCADE
empresa     text NOT NULL
cargo       text NOT NULL
fecha_inicio text
fecha_fin    text
descripcion  text
activo       boolean DEFAULT false
created_at   timestamptz DEFAULT now()
```

### Tabla: `educacion`
```sql
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id       uuid references profiles(id) ON DELETE CASCADE
institucion   text NOT NULL
titulo        text NOT NULL
area          text
fecha_inicio  text
fecha_fin     text
created_at    timestamptz DEFAULT now()
```

### Tabla: `habilidades`
```sql
id         uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id    uuid references profiles(id) ON DELETE CASCADE
nombre     text NOT NULL
created_at timestamptz DEFAULT now()
```

### Tabla: `logros`
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id     uuid references profiles(id) ON DELETE CASCADE
descripcion text NOT NULL
created_at  timestamptz DEFAULT now()
```

### Tabla: `idiomas`
```sql
id      uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id uuid references profiles(id) ON DELETE CASCADE
nombre  text NOT NULL
nivel   text  -- 'Básico' | 'Intermedio' | 'Avanzado' | 'Nativo'
created_at timestamptz DEFAULT now()
```

### Tabla: `cvs`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id         uuid references profiles(id) ON DELETE CASCADE
titulo          text
intencion       text NOT NULL  -- 'general' | 'vacante'
estilo          text NOT NULL  -- 'classic' | 'modern' | 'minimal' | 'bold' | 'executive'
contenido_json  jsonb NOT NULL
descripcion_vacante text
match_porcentaje integer
created_at      timestamptz DEFAULT now()
```

### Tabla: `aplicaciones`
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id     uuid references profiles(id) ON DELETE CASCADE
cv_id       uuid references cvs(id)
empresa     text
cargo       text
fecha       date
estado      text DEFAULT 'En espera'  -- 'En espera' | 'Entrevistando' | 'Contratado' | 'Rechazado' | 'Sin respuesta'
nota        text
created_at  timestamptz DEFAULT now()
```

---

## Fórmula del puntaje de completitud

Se calcula sobre 100 puntos. Tiene topes por sección.

### Capa 1 — Datos básicos (máx. 30 pts)
| Campo | Puntos |
|---|---|
| Nombre + Apellido | 10 |
| Email del CV | 5 |
| Foto de perfil | 5 |
| Profesión | 5 |
| Teléfono + Ciudad/País | 5 |

### Capa 2 — Perfil profesional (máx. 70 pts)
| Sección | Regla | Máx. |
|---|---|---|
| Experiencia | 15 pts por entrada, máx. 2 contabilizadas | 30 |
| Educación | 10 pts por entrada, máx. 2 contabilizadas | 20 |
| Habilidades | 5 pts si hay al menos 3 | 5 |
| Logros | 5 pts si hay al menos 1 | 5 |
| Idiomas | 5 pts si hay al menos 1 | 5 |
| Resumen profesional | 5 pts si tiene ≥30 palabras útiles | 5 |

- Si hay más de 2 experiencias o educaciones, todo se guarda pero el puntaje no sube del tope.
- Se recalcula en tiempo real después de cada cambio.

---

## Arquitectura de rutas (Next.js App Router)

```
app/
├── (auth)/
│   ├── login/page.tsx
│   └── register/page.tsx
├── (app)/
│   ├── layout.tsx              ← sidebar + header, protegido
│   ├── onboarding/page.tsx
│   ├── perfil/page.tsx         ← "Mi Perfil"
│   ├── crear-cv/
│   │   ├── page.tsx            ← evaluación + selección de intención
│   │   ├── vacante/page.tsx    ← Modo 1
│   │   ├── general/page.tsx    ← Modo 2
│   │   └── preview/page.tsx   ← previsualización + edición
│   ├── mis-cvs/page.tsx
│   ├── aplicaciones/page.tsx
│   └── cuenta/page.tsx
├── api/
│   ├── chat/route.ts           ← P1, P2
│   ├── parse-document/route.ts ← P3
│   ├── generate-cv/route.ts    ← P4, P5, P6, P7
│   ├── match-vacante/route.ts  ← P8
│   └── review-cv/route.ts     ← P9
└── middleware.ts               ← protección de rutas
```

---

## Navegación principal

**Sidebar izquierdo fijo:**
- Foto, nombre, profesión, badge del plan
- Mi Perfil
- Crear CV
- Mis CVs
- Seguimiento de Aplicaciones
- Mejorar Cuenta

**Header superior:**
- Logo Resumint
- Botón "Mejorar Cuenta"
- Botón "Cerrar sesión"

**Regla cerrada:** La sección se llama "Mi Perfil". No "Sobre mí". No hay nombres alternativos.

---

## Flujo completo del producto

### 1. Registro / Login
- Supabase Auth con email y contraseña.
- Tras registro exitoso → verificar onboarding → redirigir.

### 2. Onboarding (`/onboarding`)
- Solo captura identidad básica. Sin documentos. Sin CV.
- Campos: foto (opcional), nombre*, apellido*, profesión, teléfono, ciudad/país, email_cv*.
- Si faltan obligatorios → errores debajo del campo → bloquear "Continuar".
- Al guardar correctamente → `onboarding_completado = true` → ir a `/perfil`.

### 3. Mi Perfil (`/perfil`)
- Muestra foto, nombre, profesión (de `profesion_perfil`), barra de completitud.
- Tarjetas: contacto, habilidades, experiencia, educación, idiomas, logros.
- Columna de chat siempre visible con botones "Añadir información" y "Adjuntar".

### 4. Crear CV (`/crear-cv`)
- Evalúa puntaje de completitud y muestra mensaje contextual:
  - < 30%: bloquear, redirigir a completar perfil
  - 30–35%: advertencia "CV muy básico", permite continuar
  - 35–50%: "ideal completar más", permite continuar
  - 51–75%: "buen CV, puede mejorar", permite continuar
  - 76–85%: "CV muy bueno", permite continuar
  - > 85%: continúa directo sin mensaje

### 5. Selección de intención
- **Modo 1 — Vacante específica:** pegar descripción + elegir estilo → "Previsualizar CV"
- **Modo 2 — CV general:** elegir estilo → "Previsualizar CV"
- El botón "Previsualizar CV" inicia desactivado hasta que todos los campos estén llenos.

### 6. Generación
- Modo 1 con experiencia → P4
- Modo 1 sin experiencia → P5
- Modo 2 con experiencia → P6
- Modo 2 sin experiencia → P7
- "Tiene experiencia" = tiene al menos 1 entrada en tabla `experiencia`.

### 7. Previsualización (`/crear-cv/preview`)
- CV renderizado con componente React del estilo elegido.
- Botones: Editar / Crear CV / Atrás.
- Modo 1: mostrar % de match (P8).
- Plan gratuito: footer sutil "Creado con Resumint".

### 8. Edición manual
- Clic en "Editar" → desactiva "Crear CV" → activa "Guardar y revisar".
- "Guardar y revisar" → P9 corrige ortografía/gramática → reactiva "Crear CV".
- Si hay correcciones → indicador sutil "Se corrigieron errores menores".

### 9. Retroceso
- Botón "Atrás" en previsualización → modal de confirmación.
- "Volver atrás generará un CV nuevo y consumirá una generación adicional."
- Confirmar → volver a selección de intención.

### 10. Confirmación final
- Clic en "Crear CV" → guardar en tabla `cvs` → descontar generación del plan.
- Los créditos solo se descuentan aquí, nunca en intentos fallidos.

### 11. Descarga (`/crear-cv/exito`)
- Animación de confeti.
- Plan Gratuito: descarga PDF con branding footer.
- Plan Pro: descarga PDF + DOCX, sin branding.
- Acciones: Descargar / Enviar por email / Generar otro CV / Ver CVs creados.

### 12. Mis CVs (`/mis-cvs`)
- KPIs: CVs generados, trabajos aplicados, entrevistas conseguidas.
- Tarjetas con: título, fecha, intención, acciones (descargar, email, eliminar, "Apliqué con este CV").
- "Apliqué con este CV" → mini formulario → crea registro en tabla `aplicaciones`.

### 13. Seguimiento de Aplicaciones (`/aplicaciones`)
- Tabla con filtros, búsqueda, ordenamiento.
- Estados: En espera / Entrevistando / Contratado / Rechazado / Sin respuesta.
- Plan Gratuito: máx. 5 aplicaciones. Plan Pro: ilimitado.

---

## Arquitectura de prompts

El sistema usa 9 prompts separados. Nunca un prompt universal.

| ID | Nombre | Cuándo se activa |
|---|---|---|
| P1 | Chat onboarding | Primer acceso del usuario |
| P2 | Chat Mi Perfil | Usuario recurrente añade info |
| P3 | Parser documentos | Usuario sube PDF |
| P4 | CV vacante con experiencia | Modo 1, tiene experiencia |
| P5 | CV vacante sin experiencia | Modo 1, sin experiencia |
| P6 | CV general con experiencia | Modo 2, tiene experiencia |
| P7 | CV general sin experiencia | Modo 2, sin experiencia |
| P8 | Match con vacante | Post-generación Modo 1 |
| P9 | Corrección edición | Guardar y revisar |

**Regla de estilos:** Los 5 estilos no generan prompts adicionales. Cada prompt de generación recibe las instrucciones de formato del estilo como variable.

### Reglas del chat (P1 y P2)
1. Máximo 2 líneas visibles al usuario.
2. Nunca repetir lo que el usuario dijo.
3. Nunca volver a preguntar algo ya respondido.
4. Sin saludos después del primer mensaje.
5. Una sola pregunta por mensaje.
6. Tono directo, natural, sin relleno.
7. Sin markdown, bullets ni asteriscos en respuesta visible.
8. Nunca inventar datos.
9. Si se necesita aclaración → una sola línea breve.
10. Cerrar naturalmente cuando el perfil esté completo.
11. Si una respuesta cubre varios campos → registrar todos a la vez.

**Mensaje inicial del chat:**
> "Vamos a generar tu CV. Puedes contarme sobre tu experiencia o subir un documento (CV antiguo, LinkedIn en PDF, carta de presentación)."

---

## Estilos de CV disponibles

| ID | Nombre | Uso ideal |
|---|---|---|
| classic | Clásico | Perfiles tradicionales, corporativo |
| modern | Moderno | Tech, startups, diseño |
| minimal | Minimal | Creativos, portfolios |
| bold | Bold | Ventas, marketing, liderazgo |
| executive | Ejecutivo | Cargos senior, dirección |

- Plan Gratuito: acceso a 2 estilos (classic, modern).
- Plan Pro: los 5 estilos.

---

## Planes

### Gratuito ($0/mes)
- 2 CVs generales/mes
- 2 CVs para vacante/mes
- 2 estilos disponibles (classic, modern)
- Descarga PDF con branding footer
- Historial últimos 3 CVs
- Seguimiento máx. 5 aplicaciones

### Pro ($9.99/mes o $24/trimestre)
- CVs ilimitados (general y vacante)
- 5 estilos disponibles
- Descarga PDF + DOCX
- Historial completo
- Seguimiento ilimitado
- Sin branding
- Prioridad en cola de generación
- Soporte prioritario

**Estado actual:** Plan Pro se muestra como "Próximamente" para validar interés. Sin cobro activo en fase inicial.

---

## Manejo de errores

| Nivel | Contexto | Comportamiento |
|---|---|---|
| 1 | Error en chat | Mensaje simple para reintentar. No perder historial. |
| 2 | Error en parseo | Informar, sugerir reintento o chat. No guardar datos parciales. |
| 3 | Error en generación | Reintentar automáticamente 1 vez. Si falla de nuevo → mensaje simple. No descontar créditos. |

**Regla transversal:** Nunca mostrar errores técnicos crudos (stack traces, códigos HTTP, mensajes de Supabase/Anthropic).

---

## Renderizado y exportación

- Previsualización: componentes React por estilo.
- PDF: generado desde el render HTML/CSS del componente React.
- DOCX: generado por separado con librería `docx`, solo Plan Pro.
- No mantener dos sistemas de diseño paralelos en el MVP.

---

## Reglas de profesión (críticas)

- `profesion_perfil`: definida solo por el usuario. Solo él puede cambiarla.
- `profesiones_inferidas[]`: las que se detectan en PDFs o en el chat. Son contexto interno para la IA. Nunca reemplazan `profesion_perfil`. Nunca se muestran como profesión principal.
- El CV general usa `profesion_perfil` como título. Si está vacío, la IA puede inferir uno desde educación o experiencia más reciente.
- El CV para vacante usa el cargo objetivo de la vacante como título.

---

## Protección de rutas (middleware.ts)

- `/onboarding`, `/perfil`, `/crear-cv/*`, `/mis-cvs`, `/aplicaciones`, `/cuenta` → requieren sesión activa.
- Si hay sesión pero `onboarding_completado = false` → redirigir a `/onboarding`.
- Si no hay sesión → redirigir a `/login`.

---

## Lo que el sistema nunca debe hacer

- Inventar datos del usuario.
- Sobrescribir `profesion_perfil` con datos de un PDF.
- Descontar créditos por fallos de la IA.
- Mostrar mensajes técnicos crudos.
- Usar nombres inconsistentes para la misma sección (siempre "Mi Perfil").
- Usar branding agresivo en plan gratuito (solo footer sutil).
- Priorizar el panel administrativo antes del flujo del usuario.

---

## Orden de desarrollo recomendado

1. Schema SQL completo en Supabase (ejecutar migrations).
2. Middleware de protección de rutas.
3. Autenticación (login, registro, manejo de sesión).
4. Onboarding.
5. Layout principal (sidebar + header).
6. Mi Perfil (visualización + chat P1/P2).
7. API routes de chat (P1, P2).
8. Carga y parseo de documentos (P3).
9. Flujo Crear CV (selección de intención + estilos).
10. Componentes de estilos de CV (5 componentes React).
11. API routes de generación (P4–P7).
12. Pantalla de previsualización (match P8, edición, P9).
13. Confirmación final y guardado.
14. Pantalla de descarga (PDF, DOCX Pro).
15. Mis CVs + Seguimiento de Aplicaciones.
16. Mejorar Cuenta (planes, lista de espera).
17. Panel administrativo (último).

---

## Convenciones de código

- Componentes: PascalCase (`ProfileCard.tsx`)
- Funciones y variables: camelCase
- Archivos de rutas API: `route.ts` dentro de su carpeta
- Tipos e interfaces: en `/types/` o co-ubicados con el módulo
- Clientes Supabase: `/lib/supabase/client.ts` (browser) y `/lib/supabase/server.ts` (server)
- Cliente Anthropic: `/lib/anthropic.ts`
- Prompts: `/lib/prompts/p1.ts`, `/lib/prompts/p2.ts`, etc.
- Utilidades de completitud: `/lib/completitud.ts`

---

*Este archivo debe mantenerse actualizado conforme avanza el desarrollo. Es la única fuente de verdad del proyecto.*
