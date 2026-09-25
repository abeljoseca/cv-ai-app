# Spec técnica — Estilo "Europeo / Europass" · v2

**Estado:** v2 · 2026-09-24 · **aprobada por el CEO en su totalidad** (incluidas las decisiones de §14).
**Sustituye a:** `europass-style-spec.md` (v1).
**Referencia visual:** `europass-cv-ejemplo-v2.html`. La v1 (`europass-cv-ejemplo-v1.html`) queda solo como histórico. Esta spec es la fuente de verdad de los valores; el HTML v2 lo es de cómo se ven aplicados.

**Propósito:** definición cerrada y no ambigua del estilo `europass`. El formato Europass real es flexible; esta spec fija **una única configuración** como estándar de la app. Todo usuario que elija este estilo debe obtener exactamente el diseño de la imagen de muestra, con sus datos. Cualquier valor no especificado aquí NO debe inventarse: se trata como pendiente y se consulta antes de implementar.

---

## 0. Cambios respecto a v1

| # | v1 | v2 | Motivo |
|---|---|---|---|
| 1 | 6 secciones obligatorias; bloquear exportación hasta completarlas | Obligatorio = solo lo que ya existe en el perfil. El resto es **activable** o **recomendado**. Nunca se bloquea la exportación ni se pregunta nada antes de generar | Los campos no existen hoy en el perfil; bloquear dañaría la UX |
| 2 | Sin foto → placeholder "Foto profesional" en el CV | Foto **activable**. El placeholder existe **solo en el editor**, nunca en el PDF. Si está apagada, la cabecera se reacomoda sin hueco | Un recuadro vacío en el PDF es inaceptable |
| 3 | CEFR nunca se precarga | Se precarga con el **nivel general que el propio usuario declaró**, con cápsula sutil de aviso. Sigue prohibido inventar un nivel por defecto | Es una declaración del usuario, no un invento |
| 4 | Sin selector de color | **Se mantiene el selector de color existente** | Decisión de producto |
| 5 | Fechas `DD/MM/AAAA` | Fechas **`MM/AAAA`**, elegidas con selector de mes y año | El perfil no guarda el día; exigirlo obligaría a inventarlo |
| 6 | Experiencia como párrafo (`descripcion`) | **3–5 bullets** por puesto; los logros vinculados a un puesto se integran como bullets | Legibilidad y control de congruencia |
| 7 | Guía de longitud y sugerencia de "ampliar descripciones" | **Eliminada** | Empujaba al relleno y contradice la regla de no inventar |
| 8 | Interlineado fijo 1.2 | **3 densidades fijas** (Compacto / Estándar / Amplio) | Permite ajustar el contenido a las páginas sin romper el estándar |
| 9 | — | Arquitectura con backend propio por estilo (§12) y garantía de congruencia de la IA (§8) | Nuevo |
| 10 | Sin título profesional en cabecera | Título profesional **núcleo** bajo el nombre | El modo Vacante lo necesita para ATS |
| 11 | Toggle "modo ATS" | **Eliminado**; se añade `#1A1A1A` a las opciones de color | Redundante con foto activable + selector de color |
| 12 | Foto 40 × 30 mm (horizontal) | **30 × 40 mm (vertical)** | Una foto de rostro es vertical |
| 13 | Calibri | **Carlito** autoalojada (métricas idénticas a Calibri) | Calibri no existe fuera de Windows: el PDF cambiaba de fuente y paginación según el dispositivo |
| 14 | Otras competencias como frases con "(evidencia: …)" | **Chips** con los nombres de habilidades blandas, sin IA | Redactar la evidencia obligaba a inventarla |
| 15 | Títulos de sección en peso 600 | **700** | Carlito y Calibri solo tienen 400 y 700; el 600 ya se renderizaba como 700 |
| 16 | Fechas siempre `MM/AAAA` | `MM/AAAA`, o **solo `AAAA`** cuando el mes no se conoce (decisión CEO 2026-09-25) | Los datos existentes solo tienen año; nunca se inventa el mes |
| 17 | Idioma sin confirmar: nivel en texto en una fila combinada | **Sin nivel** hasta que el usuario lo confirme (decisión CEO 2026-09-25: el CV solo muestra códigos MCER). La presentación exacta de esa fila se define en la plantilla (4d) | Ningún texto como "Avanzado" llega al CV |
| 18 | Sin lugar para "Cursos y Certificaciones" del perfil | Se listan **como elementos de "Educación y formación"** (título, institución, año), ordenados junto con los estudios (decisión CEO 2026-09-25) | Como hace el Europass oficial; ningún dato del perfil se pierde |
| 19 | Sin "Área" en educación | **Área** (campo de estudio) como línea gris bajo el título del estudio (decisión CEO 2026-09-25) | Es útil y ya existe en el perfil |
| 20 | — | Fecha de fin anterior a la de inicio: el perfil no permite guardarla; si llega por importación se guarda tal cual y el perfil marca "Revisa las fechas" (decisión CEO 2026-09-25) | No se adivina cuál de las dos fechas está mal |

---

## 1. Identidad del estilo

- **id interno:** `europass`
- **Nombre visible:** "Estilo Europeo / Europass"
- **Versión base fijada:** moderna 2020+, una columna. La versión clásica tabular 2004-2019 queda descartada de forma permanente.
- **Tamaño de página:** A4 (210 × 297 mm). Nunca US Letter.

---

## 2. Design tokens

### 2.1 Color

```json
{
  "color.acento":     "#003399",
  "color.negro":      "#000000",
  "color.gris":       "#595959",
  "color.gris_claro": "#e8ecf5",
  "color.blanco":     "#ffffff"
}
```

- `acento` → títulos de sección, borde de cabecera, cabecera de la tabla CEFR, niveles DigComp y numeración de anexos. **Es el único token que el usuario puede cambiar**, mediante el selector de color existente. Por defecto: `#003399`. Opciones: `#003399`, `#1A2B4C`, `#006EBF`, `#1A1A1A` (negro, sustituye al antiguo modo ATS), más un HEX libre (comportamiento actual del selector).
- `negro` → cuerpo, nombre, subtítulos.
- `gris` → fechas, lugares y metadatos.
- `gris_claro` → fondos de tabla, separadores, chips y el placeholder de foto (solo en el editor).
- `blanco` → fondo de página.

### 2.2 Tipografía

- **Familia:** **Carlito** (licencia SIL OFL, métricas idénticas a Calibri), **autoalojada** con `next/font/google` en pesos 400, 400 italic y 700. Pila: `Carlito, Calibri, "Segoe UI", Arial, sans-serif`. Está prohibido depender de fuentes instaladas en el dispositivo del usuario.
- Sin selector de fuente.

| Token | Peso | Tamaño | Uso |
|---|---|---|---|
| `type.nombre` | 700 | 20pt | Nombre en cabecera |
| `type.titulo_profesional` | 400 | 11.5pt, color `gris` | Línea bajo el nombre |
| `type.section_title` | 700 | 13pt | Títulos de sección, en mayúsculas |
| `type.subtitulo` | 700 | 11.5pt | Cargo / título académico dentro de un ítem |
| `type.cuerpo` | 400 | 10.5pt | Texto general y bullets |
| `type.detalle` | 400 italic | 10pt | Fechas, ciudad/país, etiquetas de datos personales |
| `type.meta` | 400 | 9.5pt | Metadatos (NACE, ISCED, materias, certificaciones de idioma) |

Los títulos de sección van siempre en mayúsculas. Es una regla del estilo, no una opción del usuario.

### 2.3 Espaciado y densidad

`spacing.margen_pagina` = **22 mm en los 4 lados, fijo en todas las densidades**. `spacing.borde_cabecera` = 2.5px sólido, color `acento`.

El usuario elige **una de 3 densidades** en el panel lateral, justo debajo del selector de color, con un control de 3 botones. No hay deslizador ni valores libres.

| Token | Compacto | **Estándar** (por defecto) | Amplio |
|---|---|---|---|
| `line_height` | 1.1 | **1.2** | 1.35 |
| `spacing.entre_secciones` | 10.5pt | **14pt** | 17pt |
| `spacing.bajo_titulo_seccion` | 6pt | **8pt** | 10pt |
| `spacing.entre_items` | 4.5pt | **6pt** | 7pt |

- La imagen de muestra y la referencia visual usan siempre **Estándar**.
- La densidad se guarda en `visual_config.densidad` (ver requisito previo en §10).

### 2.4 Foto

- **Tamaño y orientación:** vertical, proporción **3:4** fija, `object-fit: cover`, recorte centrado.
- **Tamaño (selector de 3 opciones, igual que la densidad) — aprobado 2026-09-24:** Pequeña **24 × 32 mm** · **Mediana 30 × 40 mm (por defecto)** · Grande **33 × 44 mm**. Se guarda en `visual_config.foto_tam`. Sin tamaños libres. La Pequeña queda alineada con la altura del bloque de datos; la Grande deja un poco de aire bajo los datos. El selector solo aparece en el panel si la foto está activada.
- **Posición:** esquina superior derecha de la cabecera.
- **Tipo:** activable. **Encendida por defecto si el perfil tiene `foto_url`**; apagada si no la tiene.
- **Activada con foto:** bloque de identidad a la izquierda (`flex: 1`) y foto a la derecha.
- **Activada sin foto subida:** en el **editor** se muestra un placeholder `gris_claro` con el texto "Sube tu foto" que abre la subida al hacer clic. En el **PDF** la foto se omite y la cabecera se exporta como si estuviera apagada.
- **Desactivada:** el bloque de identidad ocupa el 100% del ancho. Sin hueco ni espacio reservado.

---

## 3. Tipos de sección y campo

| Tipo | Comportamiento |
|---|---|
| **Núcleo** | Visible siempre que el perfil tenga el dato. Si no lo tiene, la sección se oculta **y aparece en el panel lateral como "Recomendada"** |
| **Activable** | Oculta hasta que el usuario la enciende en el panel lateral. Al encenderla aparece en su **posición fija** con un input estructurado |
| **Recomendada** | Activable con prioridad visual en el panel (etiqueta "Recomendada en Europass") |
| **No existe** | Nunca se ofrece en este estilo (p. ej. proyectos, tech stack, áreas de expertise) |

Reglas comunes:
1. Una sección sin datos se oculta **completa, título incluido**.
2. **Desactivar oculta, no borra.** Al reactivar se recupera el contenido.
3. Una sección activada que queda vacía al guardar **se desactiva sola**.
4. Lo que el usuario introduce mediante un activable se guarda **en el CV y en su perfil**, para que los próximos CVs ya lo traigan.
5. Nunca se pregunta nada al usuario antes de generar. Todo se completa en el editor.

---

## 4. Estructura de secciones (orden fijo, no reordenable)

| # | Sección / campo | Tipo | Origen del dato | ¿Pasa por IA? |
|---|---|---|---|---|
| **1** | **Información personal (cabecera)** | Núcleo | | |
| | Nombre completo | Núcleo | Perfil | No |
| | Título profesional (en modo Vacante: el cargo exacto de la oferta) | Núcleo | Perfil / vacante | No |
| | Teléfono | Núcleo | Perfil | No |
| | Email | Núcleo | Perfil | No |
| | Ciudad, país | Núcleo | Perfil | No |
| | Foto | Activable (encendida por defecto si hay `foto_url`) | Perfil | No |
| | Fecha de nacimiento | Activable | **Nuevo campo de perfil** | No |
| | Nacionalidad | Recomendada | **Nuevo campo de perfil** | No |
| | Dirección completa | Activable (sustituye a "ciudad, país" en la cabecera) | **Nuevo campo de perfil** | No |
| | LinkedIn / ORCID / ResearchGate | Activable (cada uno) | **Nuevos campos de perfil** | No |
| **2** | **Sobre mí** | Núcleo | Resumen profesional + experiencia del perfil | **Sí** (3–5 líneas) |
| **3** | **Experiencia laboral** (cronología inversa) | Núcleo | Perfil | |
| | Cargo, empleador, fechas | Núcleo | Perfil | No |
| | Bullets (3–5), con logros vinculados integrados | Núcleo | Descripción + logros vinculados | **Sí** |
| | Ciudad, país del puesto | Activable (por puesto) | **Nuevo campo** | No |
| | Sector NACE | Activable (por puesto, texto libre) | **Nuevo campo** | No |
| **4** | **Educación y formación** (cronología inversa) | Núcleo | Perfil | |
| | Título, institución, fechas | Núcleo | Perfil | No |
| | Área (campo de estudio), línea gris bajo el título | Núcleo si hay dato | Perfil | No |
| | Cursos y certificaciones del perfil (título, institución, año) como elementos de esta sección | Núcleo si hay datos | Perfil | No |
| | Nivel CINE/ISCED | Recomendada (por estudio). **El usuario lo elige de una lista; la IA nunca lo deduce** | **Nuevo campo** | No |
| | Ciudad, país | Activable (por estudio) | **Nuevo campo** | No |
| | Materias principales | Activable (por estudio) | **Nuevo campo** | No |
| **5** | **Competencias lingüísticas** | Núcleo | Perfil | |
| | Lengua(s) materna(s) | Núcleo si algún idioma es "Nativo" | Perfil | No |
| | Tabla CEFR (5 habilidades) de otros idiomas | Núcleo, **precargada** (§7.3) | Perfil (nivel general o desglose) | No |
| | Certificación oficial (DELF, IELTS…) | Activable (por idioma) | **Nuevo campo** | No |
| **6** | **Competencias digitales** | | | |
| | Herramientas (chips) | Núcleo | Habilidades **técnicas** del perfil | No |
| | Tabla DigComp (5 áreas) | Recomendada | **Nuevo campo** | No |
| **7** | **Otras competencias** (chips) | Núcleo si hay datos | Habilidades **blandas** del perfil | No |
| **8** | **Permiso de conducir** (chips) | Activable (selección de categorías: A, A1, A2, AM, B, BE, C, C1, CE, D, D1, DE) | **Nuevo campo** | No |
| **9** | **Información adicional** | Activable, con subinterruptores | | |
| | Logros destacados (logros no vinculados a un puesto) | Subactivable | Perfil | No |
| | Publicaciones / Ponencias / Voluntariado / Premios y becas / Afiliaciones | Subactivable (cada uno) | **Nuevos campos** | No |
| **10** | **Anexos** (lista numerada de nombres de documentos, sin subida de archivos en el MVP) | Activable | **Nuevo campo** | No |

**Superficie de IA en Europass:** solo **Sobre mí** y los **bullets de experiencia**. Todo lo demás lo coloca el código desde el perfil, sin generación.

### 4.1 Orden fijo de los datos personales en la cabecera

Rejilla de **2 columnas al ancho de su contenido, repartidas hasta los bordes** (`grid-template-columns: auto auto; justify-content: space-between`), **llenada por filas**, en este orden, omitiendo los campos apagados o vacíos (sin huecos). Con los 6 campos típicos queda 3 y 3: Fecha de nacimiento | Nacionalidad · Dirección | Teléfono · Email | LinkedIn. Con foto se ve igual que la v1. Sin foto, el bloque de identidad ocupa todo el ancho y la columna derecha se desplaza hasta el borde derecho, sin dejar espacio libre. Orden completo: Fecha de nacimiento · Nacionalidad · Dirección **o** Ciudad, país · Teléfono · Email · LinkedIn · ORCID · ResearchGate.

### 4.2 Detalles de presentación fijados en el HTML v2

- **Competencias digitales:** primero los chips de herramientas; debajo, si está activada, la rejilla DigComp de 2 columnas.
- **Otras competencias:** chips con el nombre de cada habilidad.
- **Permiso de conducir:** un chip por categoría con el texto **"Categoría X"** (p. ej. "Categoría B"), nunca la letra sola.
- **Información adicional:** cada subsección activada es un subgrupo con etiqueta (`type.detalle`, 700, color `gris`) seguida de su lista con viñetas, en este orden fijo: Logros destacados · Publicaciones · Ponencias · Voluntariado · Premios y becas · Afiliaciones.
- **Metadatos de ítem** (NACE, ISCED, materias): una sola línea `type.meta` bajo los bullets, con los elementos separados por " · ".

---

## 5. Modelo de datos

### 5.1 Contenido del CV (`contenido_json` para `estilo = 'europass'`)

Esquema **propio del estilo**. No reutiliza el `CVContent` compartido; la IA no puede producir campos de otros estilos.

```jsonc
{
  "schema": "europass@2",
  "informacion_personal": {
    "nombre_completo": "string",
    "titulo_profesional": "string",
    "telefono": "string",
    "email": "string",
    "ciudad_pais": "string | null",
    "foto":             { "activo": "boolean", "url": "string | null" },
    "fecha_nacimiento": { "activo": "boolean", "valor": "DD/MM/AAAA | null" },
    "nacionalidad":     { "activo": "boolean", "valor": "string | null" },
    "direccion":        { "activo": "boolean", "valor": "string | null" },
    "perfiles": [ { "tipo": "linkedin | orcid | researchgate", "url": "string", "activo": "boolean" } ]
  },
  "sobre_mi": { "texto": "string | null", "_fuentes": ["ref"] },
  "experiencia_laboral": [
    {
      "cargo": "string",
      "empleador": "string",
      "fecha_inicio": "MM/AAAA",
      "fecha_fin": "MM/AAAA | 'actualidad'",
      "bullets": [ { "texto": "string", "_fuentes": ["ref"], "_origen": "ia | usuario" } ],
      "lugar":       { "activo": "boolean", "valor": "string | null" },
      "sector_nace": { "activo": "boolean", "valor": "string | null" }
    }
  ],
  "educacion_formacion": [
    {
      "titulo": "string",
      "institucion": "string",
      "fecha_inicio": "MM/AAAA | null",
      "fecha_fin": "MM/AAAA | null",
      "nivel_isced": { "activo": "boolean", "valor": "integer 0-8 | null" },
      "lugar":       { "activo": "boolean", "valor": "string | null" },
      "materias":    { "activo": "boolean", "valor": "string | null" }
    }
  ],
  "competencias_linguisticas": {
    "lenguas_maternas": ["string"],
    "otras_lenguas": [
      {
        "idioma": "string",
        "niveles": {
          "comprension_auditiva": "A1|A2|B1|B2|C1|C2",
          "comprension_lectora":  "A1|A2|B1|B2|C1|C2",
          "interaccion_oral":     "A1|A2|B1|B2|C1|C2",
          "expresion_oral":       "A1|A2|B1|B2|C1|C2",
          "expresion_escrita":    "A1|A2|B1|B2|C1|C2"
        },
        "niveles_confirmados": "boolean",             // false = precargados desde el nivel general
        "certificacion": { "activo": "boolean", "valor": "string | null" }
      }
    ]
  },
  "competencias_digitales": {
    "herramientas": ["string"],
    "digcomp": {
      "activo": "boolean",
      "informacion_datos":         "Básico|Intermedio|Avanzado|Altamente especializado | null",
      "comunicacion_colaboracion": "… | null",
      "creacion_contenido":        "… | null",
      "seguridad":                 "… | null",
      "resolucion_problemas":      "… | null"
    }
  },
  "otras_competencias": ["string"],
  "permiso_conducir":   { "activo": "boolean", "categorias": ["B", "…"] },
  "informacion_adicional": {
    "activo": "boolean",
    "logros_destacados": { "activo": "boolean", "items": ["string"] },
    "publicaciones":     { "activo": "boolean", "items": ["string"] },
    "ponencias":         { "activo": "boolean", "items": ["string"] },
    "voluntariado":      { "activo": "boolean", "items": ["string"] },
    "premios_becas":     { "activo": "boolean", "items": ["string"] },
    "afiliaciones":      { "activo": "boolean", "items": ["string"] }
  },
  "anexos": { "activo": "boolean", "items": ["string"] }
}
```

- Los campos con prefijo `_` (`_fuentes`, `_origen`) son **internos**. Nunca se renderizan en el CV ni en el PDF.
- `nivel_isced` se guarda como entero; la etiqueta visible ("Grado", "Máster"…) la resuelve la capa de presentación.
- CEFR, DigComp, ISCED y permiso de conducir son enums cerrados. La UI solo ofrece selección, nunca texto libre.

### 5.2 Cambios requeridos en el perfil (base de datos)

| Tabla | Campo nuevo | Tipo |
|---|---|---|
| `profiles` | `fecha_nacimiento`, `nacionalidad`, `direccion` | date / text / text |
| `profiles` | `linkedin_url`, `orcid_url`, `researchgate_url` | text |
| `profiles` | `permiso_conducir` | text[] (enum) |
| `profiles` | `digcomp` | jsonb (5 áreas) |
| `profiles` | `publicaciones`, `ponencias`, `voluntariado`, `premios_becas`, `afiliaciones`, `anexos` | text[] |
| `experiencia` | `ciudad`, `pais`, `sector_nace` | text |
| `educacion` | `ciudad`, `pais`, `nivel_isced`, `materias` | text / text / smallint / text |
| `idiomas` | `nivel` pasa a la escala `A1…C2 \| Nativo` | enum |
| `idiomas` | `niveles_cefr` (5 habilidades), `certificacion` | jsonb / text |
| `logros` | `experiencia_id` (opcional: "¿en qué empleo lo lograste?") | fk nullable |

**Migración de idiomas:** los valores actuales `Básico/Intermedio/Avanzado` **no se convierten en silencio** ("Avanzado" puede ser B2 o C1). Se conservan hasta que el usuario confirme su nivel mediante un aviso único de "Actualiza el nivel de tus idiomas". Mientras no confirme, el idioma aparece en el CV **sin nivel** (el CV solo muestra códigos MCER; decisión CEO 2026-09-25). Cómo se ve esa fila en la tabla se define en la plantilla (4d).

---

## 6. Formato de fechas y números

- **Fechas:** **`MM/AAAA`** (p. ej. `03/2021`), o **solo `AAAA`** cuando el perfil no tiene el mes (nunca se inventa). Puesto actual: `03/2021 – actualidad`. Nunca "Mar 2021" ni "2021-03".
- **Entrada:** selector de **mes y año** en el perfil y en el editor. Las fechas existentes en texto libre ("2021-03") se normalizan al guardar; si no se pueden interpretar, se marcan para que el usuario las corrija. Nunca se adivinan.
- **Fecha de nacimiento:** `DD/MM/AAAA` (único campo con día, introducido con un calendario completo).
- **Decimales:** coma (`3,5%`). **Miles:** punto (`1.250.000`).
- **Moneda:** `€` pegado al número (`50.000€`), salvo que la cifra original del usuario indique otra moneda.
- El formateo lo hace **siempre el código** (`format.ts`), nunca la IA.

---

## 7. Comportamiento en el editor

### 7.1 Panel lateral (orden fijo)

1. **Color de acento** (selector existente).
2. **Densidad:** Compacto / Estándar / Amplio.
2b. **Tamaño de foto:** Pequeña / Mediana / Grande (solo visible si la foto está activada).
3. **Secciones:** primero las **Recomendadas**, después el resto de activables, cada una con su interruptor. Las subsecciones (Información adicional, campos de cabecera) se despliegan dentro de su sección.

El panel se genera **automáticamente a partir del contrato del estilo** (`contract.ts`). No hay UI hecha a mano por estilo.

### 7.2 Activar un campo

Al encender un interruptor:
1. La sección aparece en su posición fija dentro del CV.
2. Se enfoca su input estructurado (selector, calendario, lista…).
3. Al guardar: si tiene datos, se persiste en el CV **y en el perfil**; si está vacía, se desactiva sola.

### 7.3 Tabla CEFR precargada

- Si el usuario tiene "Inglés C1" sin desglose, las 5 celdas se precargan con **C1** y `niveles_confirmados = false`.
- Sobre la tabla aparece una **cápsula muy sutil** que resalta la tabla: *"Tu nivel general es C1. Ajusta si alguna habilidad es distinta."*
- Al editar cualquier celda o pulsar "Confirmar" en la cápsula, `niveles_confirmados = true`, el desglose se guarda en el perfil y la cápsula desaparece.
- La cápsula existe **solo en el editor**, nunca en el PDF.
- Los idiomas "Nativo" van en la línea **Lengua(s) materna(s)**, fuera de la tabla.

### 7.4 DigComp

Sin precarga: la tabla empieza vacía y el usuario elige cada nivel. No existen datos de origen desde los que precargar.

---

## 8. Redacción con IA y garantía de congruencia

### 8.1 Alcance
La IA redacta **solo** `sobre_mi` y los **bullets de experiencia**. En el editor, cualquiera de los dos puede regenerarse con **"Redactar con IA"**, que sigue exactamente estas mismas reglas.

### 8.2 Estilo de redacción
Descriptivo, formal e impersonal, sin primera persona ni superlativos ("world-class", "top-performer"). Se prefieren construcciones nominales o en infinitivo: "Responsable de…", "Coordinación de…". Métricas: **solo las que el usuario aportó**; si no hay, se describe el alcance sin cifras.

- `sobre_mi`: 3–5 líneas. Si el perfil no tiene resumen ni experiencia, la sección se oculta y queda como Recomendada. No se genera relleno.
- Bullets: 3–5 por puesto, ordenados del más relevante al menos relevante. Si la fuente no da para 3, se generan los que se puedan sostener; nunca se rellena.

### 8.3 Tres capas de garantía

1. **Superficie mínima:** la IA no toca ningún dato objetivo (§4).
2. **Cita de fuente obligatoria:** cada bullet y el texto de `sobre_mi` se devuelven con `_fuentes` (referencias a campos del perfil, p. ej. `experiencia[0].descripcion`, `logros[2]`). Después se aplican dos controles:
   - **Control exacto (código):** todo número, porcentaje, monto, fecha, nombre propio, organización o herramienta del texto debe aparecer en las fuentes citadas. Si no aparece, la frase se rechaza.
   - **Control de sentido (segundo modelo, independiente del redactor):** "¿Esta frase se desprende de estas fuentes? sí/no". Detecta exageraciones como convertir "participé en" en "lideré".
3. **Respaldo:** si una frase falla, se reintenta una vez. Si vuelve a fallar, se usa **el texto original del usuario** (`_origen: "usuario"`), limpio de formato.

**Garantía resultante:** cada frase del CV está verificada contra los datos del usuario o es literalmente del usuario.

### 8.4 Logros
- Un logro con `experiencia_id` se integra como bullet de ese puesto (con la misma verificación).
- Un logro sin vínculo solo se asigna a un puesto si su texto nombra la empresa o el cargo. En otro caso va a **Información adicional → Logros destacados**.

---

## 9. Validaciones de negocio

1. **Transparencia de fechas:** no hay opción de ocultar fechas. `fecha_fin` vacía solo se permite como `actualidad` en un puesto activo.
2. **Huecos:** si hay más de 3 meses entre dos puestos consecutivos, se muestra un aviso **no bloqueante** en el editor sugiriendo documentarlo en Información adicional. El hueco nunca se oculta.
3. **CEFR:** nunca se inventa un nivel. Solo se permite la precarga desde el nivel declarado (§7.3).
4. **DigComp e ISCED:** nunca los precarga ni deduce la IA; siempre los elige el usuario.
5. **Longitud:** sin guía ni sugerencias de longitud (eliminado en v2).
6. Toda validación vive en el **backend del estilo** (`validate.ts`), no solo en la UI.

---

## 10. Renderizado y exportación

- **Salida:** HTML/CSS con los tokens de §2, paginado a A4, exportado a PDF.
- **Márgenes:** los 22 mm los aplica **`@page { size: A4; margin: 22mm }`** en impresión, **no** el padding del contenedor. Con padding y `@page { margin: 0 }` (el esquema actual), solo la primera página tiene margen superior y desde la segunda el texto queda pegado al borde. En pantalla (editor) el contenedor sí usa padding de 22 mm para simular la hoja.
- **Motor de PDF (aprobado 2026-09-24):** Puppeteer + `@sparticuz/chromium` (MIT) en una función de Vercel, con el mismo HTML del editor. Se genera el PDF **en el servidor** con Chromium sin interfaz (Puppeteer/Playwright: `printBackground: true`, `displayHeaderFooter: false`, `preferCSSPageSize: true`) en lugar de `window.print()`. Con `window.print()`, el resultado depende del navegador (Safari y Chrome paginan distinto) y de la configuración de impresión del usuario (escala, márgenes, encabezados/pies de página del navegador). Eso contradice el objetivo de un resultado 100% fijo.
- **Multipágina:** `break-inside: avoid` en cada ítem de experiencia y educación, y en la tabla CEFR. Los títulos de sección nunca quedan huérfanos al final de una página (`break-after: avoid`).
- **Elementos exclusivos del editor**, nunca exportados: placeholder de foto, cápsula CEFR, avisos de huecos, interruptores, etc.
- **Fuente:** debe cargarse explícitamente (ver §14-D). Hoy el PDF se genera con `window.print()` en el navegador del usuario, y Calibri no existe en Mac, Linux, Android ni iOS. Sin una fuente autoalojada, el mismo CV sale con otra tipografía y **otra paginación** según el dispositivo.
- **Requisito previo (bug actual):** `visual_config` (color y densidad) debe **persistirse en la base de datos** y la página `/cv/[id]/imprimir` debe **leerlo y pasarlo** al renderer. Hoy el color elegido se pierde: solo vive en el estado local de `create-cv/preview` y la página de impresión no lo recibe.

---

## 11. Imagen de muestra (selector de estilos)

- Se renderiza con **la plantilla real** a partir de un perfil de demostración fijo, en densidad **Estándar** y color por defecto.
- Contenido: **núcleo + 3 activables típicos: foto, nacionalidad y permiso de conducir**.
- Se regenera automáticamente cuando cambia la plantilla, para que la muestra nunca se desincronice del resultado real.

---

## 12. Arquitectura: backend propio del estilo

```
lib/cv/styles/europass/
  contract.ts    ← secciones, orden, tipos (núcleo/activable/recomendada), densidades, variantes de cabecera
  schema.ts      ← esquema §5.1 + validación de estructura
  mapper.ts      ← perfil → datos objetivos (sin IA)
  prompt.ts      ← redacción de sobre_mi + bullets, con _fuentes obligatorias
  validate.ts    ← control exacto + control de sentido + respaldo + reglas §9
  format.ts      ← MM/AAAA, números eu, CEFR, ISCED, etiquetas
  Template.tsx   ← plantilla visual; lee contract + tokens
  panel.ts       ← definición del panel lateral para este estilo
```

**Compartido entre estilos (solo lo realmente común):** el motor del control exacto, el guardado CV+perfil, el componente genérico del panel y el cliente de IA. Todo lo demás es propio del estilo.

---

## 13. Fuera de alcance del MVP

- Versión clásica tabular 2004-2019.
- Selector de tipografía.
- Modo académico extendido (publicaciones extensas, supervisión doctoral, comités): será un estilo aparte.
- Formato numérico por idioma/país.
- Catálogo NACE completo (texto libre en el MVP).
- Iconografía de la Comisión Europea.
- Subida de archivos en Anexos (en el MVP solo se listan nombres).
- Cápsula "Basado en: …" al pasar el mouse sobre un bullet (mejora posterior).

---

## 14. Decisiones cerradas en v2 (2026-09-24, todas aprobadas)

| # | Tema | Problema | Decisión aprobada |
|---|---|---|---|
| **A** | Título profesional bajo el nombre | El HTML v1 no lo tiene, pero la app siempre lo genera y el **modo Vacante** usa el cargo de la oferta como título (clave para ATS) | **Núcleo**: una línea bajo el nombre, 11.5pt, color `gris` |
| **B** | Modo ATS (§6 de v1) | Con foto activable y selector de color, el toggle ATS es redundante: apagar la foto y elegir un color oscuro produce el mismo resultado | **Eliminar el toggle.** Añadir negro (`#1A1A1A`) a las opciones de color |
| **C** | Orientación de la foto | La v1 fija 40 mm de ancho × 30 mm de alto (**horizontal**). Una foto de rostro es vertical: en ese formato se recorta mal o queda con franjas | **30 × 40 mm (vertical)** |
| **D** | Tipografía | Calibri no existe fuera de Windows/Office, y no se puede incrustar por licencia. El PDF cambiaría de fuente y de paginación según el dispositivo | **Carlito** autoalojada: licencia libre y métricas idénticas a Calibri, así que se ve igual |
| **E** | "Otras competencias" | El HTML v1 muestra frases redactadas con "(evidencia: …)". El perfil solo tiene nombres de habilidades blandas; redactar esas frases obligaría a la IA a inventar la evidencia | **Chips con los nombres**, sin IA, igual que las herramientas digitales |
