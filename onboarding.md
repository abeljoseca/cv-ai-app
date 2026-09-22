# Flujo de Onboarding — Especificación Funcional

> Versión: 1.0
> Última actualización: junio 2026
> Propósito: documentar el flujo de onboarding rediseñado, desde el registro hasta el primer perfil completo, para implementación y referencia futura.

---

## 1. Visión general

Esta especificación describe el flujo de onboarding rediseñado de la aplicación, optimizado para ofrecer una experiencia premium: rápida, fácil, sin fricción innecesaria, y con múltiples caminos según el contexto del usuario.

### 1.1 Principios rectores

1. **Cero fricción innecesaria** — el usuario no rellena nada que el sistema pueda inferir, importar o derivar.
2. **Múltiples puntos de entrada** — LinkedIn, CV existente, o manual: el usuario elige cómo empezar según lo que tenga a mano.
3. **Reversibilidad total** — cualquier decisión inicial puede cambiarse después sin penalización ni fricción adicional.
4. **Transparencia** — el usuario sabe en todo momento qué está pasando, por qué, y cuánto falta.
5. **Momentos de celebración** — cada hito relevante (import exitoso, perfil completo) se reconoce visualmente para reforzar la sensación de progreso.
6. **Adaptabilidad** — el sistema detecta qué tiene y solo pide lo que falta. No se hacen preguntas redundantes.

### 1.2 Mejora respecto al flujo actual

| Aspecto | Flujo actual | Flujo nuevo |
|---|---|---|
| Métodos de registro | Email + contraseña | LinkedIn (primario) + Google + Email |
| Puntos de entrada de datos | URL LinkedIn escondida en formulario | LinkedIn + CV + Manual como decisión protagonista |
| Onboarding paso 1 | 8 campos obligatorios de golpe | 0 campos obligatorios al inicio |
| Feedback post-import | Salto silencioso a perfil | Pantalla de confirmación con resumen visual |
| Recuperación | Si LinkedIn no se importó, oportunidad perdida | Botón "Importar" persistente en el formulario |
| Caminos | 3 caminos bifurcados confusos | 1 pantalla con 3 opciones claras |
| Chat | Siempre forzado | Adaptativo: solo si falta info |

### 1.3 Objetivos medibles

- **Tiempo medio onboarding completo**: < 3 minutos (vs. ~10 actual).
- **Tasa de finalización del onboarding**: > 75% (vs. estimado 50% actual).
- **Tasa de uso de import (LinkedIn o CV)**: > 60% de usuarios nuevos.
- **Tasa de generación de primer CV**: > 80% de usuarios que completan onboarding.

---

## 2. Diagrama del flujo

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  PASO 0 — Registro / Login                                  │
│  ┌───────────────┐  ┌──────────┐  ┌──────────┐             │
│  │  LinkedIn SSO │  │  Google  │  │  Email   │             │
│  └───────┬───────┘  └────┬─────┘  └────┬─────┘             │
│          └─────────────┬─┴─────────────┘                    │
│                        ▼                                     │
└──────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│  PASO 1 — Pantalla de elección                              │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐                          │
│  │  LinkedIn   │  │  Subir CV   │                          │
│  └──────┬──────┘  └──────┬──────┘                          │
│         │                 │                                  │
│  ─── o si prefieres ───                                     │
│  ┌──────────────────┐                                       │
│  │ Manual           │                                       │
│  └──────┬───────────┘                                       │
└─────────┼─────────────────┼──────────────────┬──────────────┘
          │                 │                  │
          ▼                 ▼                  ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  PASO 2.A        │ │  PASO 2.B        │ │  PASO 2.C        │
│  Procesa         │ │  Procesa CV      │ │  Formulario      │
│  LinkedIn        │ │  con IA          │ │  manual          │
│  (Apify)         │ │                  │ │                  │
└────────┬─────────┘ └────────┬─────────┘ └────────┬─────────┘
         │                    │                    │
         └────────┬───────────┘                    │
                  ▼                                │
         ┌──────────────────┐                      │
         │  PASO 3          │                      │
         │  Confirmación    │                      │
         │  con resumen     │                      │
         └────────┬─────────┘                      │
                  │                                │
                  └──────────────┬─────────────────┘
                                 ▼
              ┌────────────────────────────────────┐
              │  PASO 4 — Formulario + Chat        │
              │  adaptativo                        │
              │  (campos pre-rellenados            │
              │   + botón "Importar"               │
              │   persistente)                     │
              └────────────────┬───────────────────┘
                               ▼
              ┌────────────────────────────────────┐
              │  PASO 5 — Perfil completo          │
              │  → Onboarding finalizado           │
              └────────────────────────────────────┘
```

---

## 3. Paso 0 — Registro / Login

### 3.1 Métodos disponibles

| Método | Jerarquía visual | Datos obtenidos |
|---|---|---|
| Sign in with LinkedIn (OIDC) | Primario (botón grande, color brand LinkedIn #0A66C2) | Nombre, apellido, email, foto, email verificado |
| Sign in with Google | Secundario (botón con logo Google, estilo neutro) | Nombre, apellido, email, foto |
| Email + contraseña | Terciario (bajo divisor "o continúa con email") | Email únicamente |

### 3.2 Comportamiento de sesión

- Usuario con sesión activa que entra a `/login` o `/register` → redirige a `/perfil`.
- Usuario sin sesión que accede a ruta protegida → redirige a `/login?next=<ruta>`.
- Después del login/registro:
  - Si `onboarding_completado = false` → al Paso 1.
  - Si `onboarding_completado = true` → a `/perfil` o al `?next=` si lo hay.

### 3.3 Datos guardados en DB tras registro

Tabla `profiles`:

| Campo | Tipo | Origen |
|---|---|---|
| id | uuid | auth.users |
| email | text | provider |
| nombre | text | provider (split de full_name) |
| apellido | text | provider (split de full_name) |
| avatar_url | text | provider |
| auth_provider | enum: 'linkedin_oidc' \| 'google' \| 'email' | sistema |
| onboarding_completado | boolean (default false) | sistema |
| onboarding_paso | enum: 'import' \| 'formulario' \| 'finalizado' | sistema |
| created_at | timestamp | sistema |

---

## 4. Paso 1 — Pantalla de elección

### 4.1 Propósito

Ofrecer al usuario tres caminos claros para construir su CV, sin forzar ninguno:

1. **Importar de LinkedIn** — pegando la URL pública del perfil.
2. **Subir un CV existente** — PDF o DOCX.
3. **Completar manualmente** — formulario tradicional.

### 4.2 Layout (desktop)

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  Hola Juan 👋                                           │
│  Hagamos tu CV en segundos                              │
│                                                          │
│  Elige cómo quieres empezar:                            │
│                                                          │
│  ┌────────────────────┐    ┌────────────────────┐      │
│  │      💼            │    │      📄            │      │
│  │   LinkedIn         │    │   Subir CV         │      │
│  │                    │    │                    │      │
│  │   Importa tu       │    │   Sube tu CV       │      │
│  │   perfil pegando   │    │   actual en PDF    │      │
│  │   tu URL pública   │    │   o Word           │      │
│  │                    │    │                    │      │
│  │   [Importar →]     │    │   [Subir archivo]  │      │
│  └────────────────────┘    └────────────────────┘      │
│                                                          │
│           ──── o si prefieres ────                       │
│                                                          │
│         [Completar manualmente →]                        │
│                                                          │
│  💡 Podrás importar después también                      │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 4.3 Layout (mobile)

Las dos cards se apilan verticalmente. El botón "Completar manualmente" sigue debajo como ghost button.

### 4.4 Copy diferenciado por método de entrada

**Si vino de LinkedIn OIDC:**
> Título: "Hola [nombre] 👋"
> Subtítulo: "Ya nos conocemos. Para crear tu CV en segundos, importa el resto de tu perfil de LinkedIn o sube un CV que ya tengas."

**Si vino de Google:**
> Título: "Bienvenido [nombre] 👋"
> Subtítulo: "¿Cómo quieres empezar? Importa tu LinkedIn o sube tu CV actual, y rellenamos los datos automáticamente."

**Si vino de Email:**
> Título: "Bienvenido 👋"
> Subtítulo: "¿Cómo quieres empezar? Importa tu LinkedIn o sube tu CV actual, y rellenamos los datos automáticamente."

### 4.5 Estados de la pantalla

- **Default** — las dos cards y el botón manual visibles, sin selección.
- **Hover en card** — leve elevación (shadow), no cambia el flujo hasta clic.
- **Card LinkedIn activa** — al hacer clic, expande mostrando input de URL + botón "Importar".
- **Card CV activa** — al hacer clic, abre selector de archivo nativo del SO.

### 4.6 Validaciones

- **URL LinkedIn**: regex que verifique formato `linkedin.com/in/...` (acepta con o sin `https://`, con o sin `www.`).
- **Archivo CV**: solo `.pdf` y `.docx`, tamaño máximo 5 MB.

---

## 5. Paso 2 — Procesamiento del import

### 5.1 Variante 2.A — Import de LinkedIn

#### Flujo técnico

1. Usuario pega URL y hace clic en "Importar".
2. Frontend valida formato → envía a backend.
3. Backend llama a Apify con la URL.
4. Apify devuelve JSON con perfil completo.
5. Backend parsea y guarda datos en tablas correspondientes (experiencias, educación, habilidades, idiomas, etc.).
6. Backend calcula completitud (% de campos rellenados sobre total esperado).
7. Frontend recibe respuesta y muestra Paso 3 (Confirmación).

#### Estados visuales durante procesamiento

Loader explícito con mensajes progresivos (estimados, no necesariamente reales):

```
[spinner] Conectando con LinkedIn...
[spinner] Leyendo tu perfil...
[spinner] Encontradas 4 experiencias laborales...
[spinner] Extrayendo habilidades y educación...
[spinner] Casi listo...
```

Tiempo estimado: 8-15 segundos. Si supera 30 segundos, mensaje: *"Está tardando más de lo normal. ¿Esperar o continuar manualmente?"*.

#### Casos de error

| Error | Mensaje al usuario | Acción |
|---|---|---|
| URL inválida | "Esa URL no parece de LinkedIn. Debe ser tipo linkedin.com/in/tu-nombre" | Mantiene pantalla, foco en input |
| Perfil privado / no encontrado | "No pudimos acceder al perfil. ¿Es público? Puedes ajustar la privacidad en LinkedIn o continuar manualmente." | Botón "Reintentar" + botón "Continuar manualmente" |
| Apify timeout | "LinkedIn está tardando. ¿Quieres seguir esperando o continuar manualmente?" | Botón "Esperar" + botón "Continuar manualmente" |
| Apify error genérico | "No pudimos importar ahora mismo. Inténtalo en unos minutos o continúa manualmente." | Botón "Reintentar" + botón "Continuar manualmente" |
| Datos extraídos < 30% | (No es error, ver Paso 3 — Confirmación con aviso) | — |

### 5.2 Variante 2.B — Import de CV (PDF / DOCX)

#### Flujo técnico

1. Usuario selecciona archivo → frontend valida tipo y tamaño.
2. Frontend sube archivo a almacenamiento temporal (Supabase Storage, bucket privado).
3. Backend recibe archivo, lo pasa a Claude API (Anthropic) como input directo.
4. Claude devuelve JSON estructurado con los datos extraídos.
5. Backend mapea JSON a tablas correspondientes.
6. **Archivo original se borra del storage** al terminar el proceso (privacidad).
7. Frontend muestra Paso 3 (Confirmación).

#### Prompt sugerido para extracción (referencia para Claude Code)

```
Eres un extractor de datos de CVs. Recibirás un PDF/DOCX y debes devolver
SOLO un JSON con esta estructura, sin texto adicional:

{
  "datos_contacto": {
    "nombre": "",
    "apellido": "",
    "email": "",
    "telefono": "",
    "ciudad": "",
    "pais": "",
    "linkedin_url": "",
    "portfolio_url": ""
  },
  "profesion": "",
  "resumen_profesional": "",
  "experiencias": [
    {
      "empresa": "",
      "puesto": "",
      "fecha_inicio": "YYYY-MM",
      "fecha_fin": "YYYY-MM o null si actual",
      "ciudad": "",
      "descripcion": "",
      "logros": []
    }
  ],
  "educacion": [
    {
      "institucion": "",
      "titulo": "",
      "fecha_inicio": "YYYY",
      "fecha_fin": "YYYY",
      "descripcion": ""
    }
  ],
  "habilidades": [],
  "idiomas": [
    {"nombre": "", "nivel": ""}
  ],
  "logros": [],
  "certificaciones": []
}

Reglas:
- Si un campo no aparece en el CV, déjalo vacío o como array vacío.
- Para fechas, normaliza al formato indicado.
- No inventes datos.
- Si el documento no parece un CV, devuelve {"error": "no_es_cv"}.
- Si el documento es ilegible (imagen escaneada sin OCR), devuelve {"error": "ilegible"}.
```

#### Estados visuales durante procesamiento

```
[spinner] Subiendo tu CV...
[spinner] Leyendo el documento...
[spinner] Analizando experiencia...
[spinner] Detectados X trabajos...
[spinner] Organizando todo...
```

Tiempo estimado: 5-12 segundos.

#### Casos de error

| Error | Mensaje al usuario | Acción |
|---|---|---|
| Archivo no soportado | "Solo aceptamos PDF y Word (.docx) por ahora." | Mantener pantalla |
| Archivo > 5 MB | "El archivo es muy grande. Máximo 5 MB." | Mantener pantalla |
| Error 'no_es_cv' | "No parece un CV. ¿Subes otro archivo o continúas manualmente?" | Reintentar / Manual |
| Error 'ilegible' | "Este CV parece escaneado (imagen). Por ahora no podemos leerlo. ¿Tienes una versión en texto?" | Reintentar / Manual |
| API timeout | "Está tardando más de lo normal. ¿Reintentar o continuar manualmente?" | Reintentar / Manual |
| Datos extraídos < 30% | (Ver Paso 3 con aviso) | — |

### 5.3 Variante 2.C — Manual

Salto directo al formulario (Paso 4) sin pantalla intermedia.

---

## 6. Paso 3 — Confirmación de import

### 6.1 Propósito

Convertir un proceso opaco en un **momento de celebración visible**: el usuario ve qué datos se extrajeron y siente que el sistema cumplió su promesa.

### 6.2 Layout

```
┌──────────────────────────────────────────────────┐
│                                                  │
│           ✅                                     │
│   ¡Listo! Importamos tu perfil                  │
│                                                  │
│   Esto es lo que encontramos:                   │
│                                                  │
│   📋 4 experiencias laborales                   │
│   🎓 2 títulos académicos                       │
│   ⚡ 12 habilidades                              │
│   🌍 3 idiomas                                   │
│   🏆 2 certificaciones                          │
│                                                  │
│   ─────────────────────                          │
│                                                  │
│   Completitud del perfil: 78%                   │
│   [████████████░░░░]                            │
│                                                  │
│   [Continuar al perfil →]                       │
│                                                  │
│   ¿Falta algo? Lo completas en el siguiente paso│
└──────────────────────────────────────────────────┘
```

### 6.3 Variantes según completitud

**Si completitud ≥ 70%:**
> Mensaje: "¡Perfecto! Tu perfil está casi listo. Solo te faltan algunos detalles que podemos completar rápido."
> CTA: "Continuar al perfil"

**Si completitud 30-70%:**
> Mensaje: "Tenemos una buena base. Vamos a completar los datos que faltan en una conversación rápida."
> CTA: "Completar lo que falta"
> Comportamiento: lleva al chat IA con prompt enfocado en lo faltante.

**Si completitud < 30%:**
> Mensaje: "Pudimos extraer algunos datos pero falta bastante. ¿Completamos juntos?"
> CTA: "Completar perfil"
> Comportamiento: lleva al chat IA o al formulario manual con datos pre-rellenados.

### 6.4 Tiempo en pantalla

- Mínimo: 2 segundos (para que el usuario alcance a procesar el contenido).
- No es bloqueante: el usuario puede clicar "Continuar" antes.
- No hay timer automático: el usuario decide cuándo avanza.

---

## 7. Paso 4 — Formulario + Chat adaptativo

### 7.1 Propósito

Capturar datos faltantes con la opción de seguir importando, completar manualmente, o usar el chat IA.

### 7.2 Layout general

```
┌────────────────────────────────────────────────────┐
│  TU PERFIL                          [Saltar al CV] │
├────────────────────────────────────────────────────┤
│                                                    │
│  💡 ¿Tienes LinkedIn o un CV?                     │
│  [ Importar datos automáticamente ]               │
│  Te ahorrará rellenar todo a mano                 │
│                                                    │
│  ────────────────────────────                      │
│                                                    │
│  📷 FOTO DE PERFIL                                 │
│  [foto cargada]  [Cambiar]                        │
│                                                    │
│  👤 INFORMACIÓN PERSONAL                          │
│  Nombre:        [Juan________________]            │
│  Apellido:      [Pérez García_________]           │
│  Profesión:     [Diseñador UX________]            │
│                                                    │
│  📞 CONTACTO                                       │
│  Email:         [juan@ejemplo.com_____]           │
│  Teléfono:      [____________________]            │
│  Ciudad:        [Madrid_______________]           │
│  País:          [España_______________]           │
│  LinkedIn:      [linkedin.com/in/juan]            │
│                 ↑ Aparecerá en tu CV               │
│                                                    │
│  💼 EXPERIENCIA   [+ Añadir]                       │
│  ┌──────────────────────────────────────────┐    │
│  │ Diseñador Senior - Empresa X             │    │
│  │ 2020 - Actual                            │    │
│  │ [Editar] [Eliminar]                      │    │
│  └──────────────────────────────────────────┘    │
│                                                    │
│  🎓 EDUCACIÓN     [+ Añadir]                       │
│  ...                                               │
│                                                    │
│  ⚡ HABILIDADES   [+ Añadir]                       │
│  ...                                               │
│                                                    │
│  [Generar mi CV →]    [💬 Pedir ayuda al chat]    │
│                                                    │
└────────────────────────────────────────────────────┘
```

### 7.3 Pre-llenado

Los campos se pre-rellenan según la fuente:

| Campo | Fuente preferente | Fallback |
|---|---|---|
| Nombre, Apellido | OIDC > CV > LinkedIn import | Vacío |
| Email | OIDC > CV > LinkedIn import | Vacío |
| Foto | OIDC > LinkedIn import | Vacío (placeholder) |
| Teléfono | CV > LinkedIn import | Vacío |
| Ciudad, País | CV > LinkedIn import | Vacío |
| LinkedIn URL | LinkedIn import > CV > OIDC (si se intuye) | Vacío |
| Profesión | CV > LinkedIn import (headline) | Vacío |
| Experiencia, Educación, etc. | LinkedIn import > CV > Vacío | Vacío |

### 7.4 Botón "Importar datos automáticamente"

- **Posición**: arriba del formulario, antes de la sección Contacto.
- **Visibilidad**: siempre visible, no esconder en menú colapsable.
- **Comportamiento al clicar**: abre modal con las dos opciones (LinkedIn / CV).
- **Si ya hay datos en el formulario**: confirmación previa: *"Tienes datos sin guardar. Si importas, podríamos reemplazar algunos. ¿Continuar?"* — opciones: Continuar / Cancelar.

### 7.5 Campo LinkedIn URL en sección Contacto

- **Siempre visible** como campo de primera clase en la sección "Contacto".
- **Razón**: es un dato del CV (aparece en el output final), no un input técnico.
- **Texto de ayuda debajo del campo**: "Tu URL pública de LinkedIn. Aparecerá en tu CV."
- **Si el usuario importó de LinkedIn**: el campo aparece pre-rellenado con la URL usada.
- **Si el usuario rellena manualmente la URL aquí**: NO se dispara import automáticamente. Es solo dato de contacto. El import se ofrece vía el botón "Importar datos automáticamente".

### 7.6 Chat IA adaptativo

- **Botón "Pedir ayuda al chat"** visible siempre.
- **Comportamiento contextual**:
  - Si perfil está completo (>85%) → chat es solo "extra" (pulir, optimizar).
  - Si perfil está en 50-85% → chat sugiere proactivamente añadir lo más impactante.
  - Si perfil está <50% → chat se ofrece como camino más rápido que rellenar a mano.
- **Capacidades del chat**:
  - Recibir mensajes de texto del usuario.
  - Recibir archivos (PDF, DOCX) y procesarlos como import adicional.
  - Recibir URL de LinkedIn y procesarlas como import.
  - Sugerir mejoras a campos existentes.
  - Mostrar progreso del perfil en tiempo real (qué falta).

### 7.7 Validación para avanzar

El botón "Generar mi CV" se habilita cuando:
- Mínimo: nombre, apellido, profesión, email, al menos 1 experiencia o 1 educación.
- Recomendable: completitud ≥ 50%.
- Si <30%: botón habilitado pero con aviso: *"Tu CV podría quedar muy básico. ¿Continuar igualmente o seguir completando?"*.

---

## 8. Paso 5 — Finalización

### 8.1 Acción

- Usuario hace clic en "Generar mi CV" desde Paso 4.
- Sistema marca `onboarding_completado = true` y `onboarding_paso = 'finalizado'`.
- Redirige a `/perfil` (no a `/crear-cv` directamente, para que el usuario vea su perfil completo primero).

### 8.2 Pantalla /perfil post-onboarding

- Banner de bienvenida la primera vez: "¡Tu perfil está listo! Ahora puedes crear tu CV cuando quieras."
- CTA principal: "Crear mi primer CV →".
- Acceso a editar cualquier sección.
- Chat IA disponible como panel lateral.

---

## 9. Reglas transversales

### 9.1 Copy general

- Tono cercano pero profesional. Tutear al usuario.
- Emojis sutiles, solo donde aporten claridad emocional (no decoración).
- Mensajes de error siempre constructivos: explican qué pasó y qué hacer.
- Nunca usar lenguaje técnico al usuario ("API failed", "timeout", "404") — traducirlo.

### 9.2 Carga y estados

- Cualquier acción que tarde > 2 segundos debe mostrar loader con mensaje contextual.
- Si tarda > 10 segundos, ofrecer alternativa.
- Skeletons en lugar de spinners genéricos cuando se carga contenido predecible.
- Animaciones siempre por debajo de 300ms (transiciones), 1500ms (celebraciones).

### 9.3 Persistencia

- Cada paso del onboarding se guarda automáticamente en DB.
- Si el usuario cierra la pestaña y vuelve, retoma exactamente donde lo dejó.
- No usar `sessionStorage` para datos críticos (volátil); usar DB.

### 9.4 Accesibilidad

- Contraste mínimo WCAG AA en todos los textos.
- Navegación por teclado completa (tab, enter, esc).
- Labels en todos los inputs.
- Mensajes de error asociados a campos con `aria-describedby`.
- Imágenes con `alt` text.

### 9.5 Responsive

- Mobile-first.
- Breakpoints: 640px (sm), 768px (md), 1024px (lg).
- Cards de elección se apilan en mobile.
- Formulario en mobile: una columna, inputs full-width.

### 9.6 Privacidad

- Los archivos de CV subidos se borran del storage después de procesarlos.
- La política de privacidad menciona explícitamente que se procesan datos personales para extracción.
- El usuario puede borrar todos sus datos desde "Ajustes → Eliminar cuenta".

---

## 10. Casos edge

### 10.1 Usuario que abandona y vuelve

- Vuelve a `/login` → tras autenticar, va al paso donde estaba (`onboarding_paso`).
- Datos parciales se conservan.

### 10.2 Usuario que importa, no le gusta el resultado, quiere empezar de cero

- Botón en formulario: "Reiniciar datos" → confirmación → vuelve al Paso 1 limpio.

### 10.3 Usuario que ya tiene cuenta con email y ahora usa Sign in with LinkedIn con el mismo email

- Supabase debe estar configurado con "Allow same email across providers" → enlaza ambos métodos a la misma cuenta.
- Usuario no pierde datos previos.

### 10.4 Usuario que importa LinkedIn y luego también sube CV

- Confirmación previa: "Ya importaste datos de LinkedIn. Si subes un CV, podríamos sobreescribir algunos. ¿Continuar?"
- Por v1: el CV reemplaza datos importados.
- Por v2 (futuro): merge inteligente que combina ambas fuentes.

### 10.5 Usuario con perfil de LinkedIn vacío o muy pobre

- Import devuelve <30% → Paso 3 con mensaje específico → chat o formulario.

### 10.6 Usuario que sube un CV de otra persona (caso fraudulento)

- No es nuestro problema técnico, pero el usuario verá datos que no son suyos en su perfil.
- Mitigación: en la confirmación, mostrar el nombre extraído y preguntar: *"¿Este eres tú?"*.

### 10.7 Usuario que sube CV en otro idioma

- v1: la IA extrae igualmente (los campos son universales: empresa, fechas, etc.).
- El CV final puede generarse en el idioma del usuario o del original.
- v2: opción de "Traducir mi CV a [idioma]".

### 10.8 Usuario que no quiere LinkedIn ni CV — solo manual

- Camino completo respetado.
- Formulario manual debe sentirse tan respetable como las otras opciones.
- No mostrar avisos tipo "¿Seguro que no quieres importar?" — es paternalista.

---

## 11. Métricas a medir

### 11.1 Funnel principal

| Métrica | Definición | Objetivo |
|---|---|---|
| Registro completado | Usuario crea cuenta exitosamente | >95% |
| Llegada a Paso 1 | Llega a pantalla de elección tras registro | >98% |
| Elección hecha | Clica una de las tres opciones | >90% |
| Import exitoso (si elige LinkedIn/CV) | El import termina sin error | >85% |
| Llegada a Paso 4 | Llega al formulario | >85% |
| Onboarding completado | Marca `onboarding_completado = true` | >75% |
| Generación primer CV | Genera primer CV en < 24h post-registro | >70% |

### 11.2 Métricas de tiempo

| Métrica | Objetivo |
|---|---|
| Tiempo medio Paso 0 → Paso 1 | < 5s |
| Tiempo medio en Paso 1 (decisión) | < 15s |
| Tiempo medio import LinkedIn | 8-15s |
| Tiempo medio import CV | 5-12s |
| Tiempo total onboarding (registro → finalizado) | < 3 min con import; < 10 min sin import |

### 11.3 Métricas de calidad

| Métrica | Objetivo |
|---|---|
| % import LinkedIn exitoso vs intentado | >85% |
| % import CV exitoso vs intentado | >90% |
| Completitud media del perfil post-import | >60% |
| Completitud media del perfil al finalizar onboarding | >75% |
| % usuarios que usan el chat IA en onboarding | medir, no objetivo |

### 11.4 Métricas de retención

| Métrica | Objetivo |
|---|---|
| % usuarios que vuelven en 7 días | >40% |
| % usuarios que descargan al menos 1 CV | >50% |

---

## 12. Roadmap de implementación

### Fase 1 (sprint inicial)

- [ ] Sign in with LinkedIn (OIDC) en `/login` y `/register`.
- [ ] Sign in with Google.
- [ ] Pantalla de Paso 1 con tres opciones.
- [ ] Variante 2.A: import de LinkedIn (mantener integración Apify actual).
- [ ] Variante 2.B: import de CV con Claude API.
- [ ] Variante 2.C: manual.
- [ ] Paso 3: pantalla de confirmación.
- [ ] Paso 4: formulario con pre-llenado y botón "Importar" persistente.
- [ ] Chat adaptativo según completitud.
- [ ] Borrado de archivos tras procesamiento.

### Fase 2 (siguientes 2-4 semanas)

- [ ] Pantalla "revisar y corregir" antes de pasar al formulario.
- [ ] Merge inteligente LinkedIn + CV.
- [ ] Soporte para CVs en otros idiomas.
- [ ] Métricas y dashboard interno.

### Fase 3 (mes 2-3)

- [ ] OCR para CVs escaneados.
- [ ] Sugerencias proactivas del chat ("Veo que tu CV tiene X, podríamos mejorarlo con Y").
- [ ] A/B test de copy en Paso 1.

---

## 13. Decisiones tomadas (registro)

| Fecha | Decisión | Razón |
|---|---|---|
| Junio 2026 | Sign in with LinkedIn como botón primario | Reduce fricción de registro, coherente con marca |
| Junio 2026 | No reemplazar Apify por LinkedIn API oficial | API oficial no da experiencia/educación; partner program inviable |
| Junio 2026 | Import de CV con Claude API directo | Robusto, alineado con stack IA actual |
| Junio 2026 | URL LinkedIn como campo visible en Contacto | Es dato del CV, no solo input técnico |
| Junio 2026 | Botón "Importar" persistente en formulario | Reversibilidad; el usuario puede cambiar de opinión |
| Junio 2026 | Pantalla de confirmación post-import | Crea momento de celebración, no salto silencioso |
| Junio 2026 | Chat adaptativo según completitud | Evita preguntar lo que ya se sabe |

---

## 14. Glosario

- **OIDC**: OpenID Connect, protocolo de autenticación basado en OAuth 2.0.
- **Apify**: servicio de scraping usado para extraer datos de perfiles públicos de LinkedIn.
- **Completitud**: porcentaje calculado de campos rellenados sobre total esperado en el perfil.
- **Onboarding**: proceso de configuración inicial del perfil del usuario tras el registro.
- **OAuth callback**: URL a la que el provider redirige tras la autenticación.

---

*Fin del documento.*
