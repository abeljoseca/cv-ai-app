# CV Inspiración

Editor de CV al estilo Canva. Permite al usuario editar plantillas de CV en un canvas interactivo y exportar a PDF.

**Plan requerido:** Pro

## Arquitectura

```
src/features/cv-inspiracion/
├── types/          — Tipos TypeScript (Layer, Template, CanvasState, EditorState)
├── lib/            — Lógica de negocio (data-injector, pdf-exporter, canvas-serializer, etc.)
├── templates/      — Definiciones de plantillas (TS + HTML)
├── hooks/          — React hooks (useCanvas, useHistory, useSelection, useExport, useTemplateLoader)
└── components/
    ├── canvas/     — KonvaCanvas, LayerRenderer (solo cliente, no SSR)
    ├── editor/     — EditorContainer, Toolbar, LeftPanel, RightPanel, CanvasArea
    └── gallery/    — TemplateGallery, TemplateCard
```

**Páginas:**
- `/crear-cv/inspiracion` — Galería de plantillas
- `/crear-cv/inspiracion/editor/[id]` — Editor principal
- `/crear-cv/inspiracion/test` — Página de validación Sprint 0

## SSR Fix

`KonvaCanvas` se importa con `dynamic(..., { ssr: false })` en `CanvasArea.tsx` vía el wrapper `KonvaCanvasWrapper.tsx`.
Nunca importar `react-konva` directamente en un Server Component ni en un módulo sin `'use client'`.

## Templates

Cada plantilla expone:
1. Un `CVTemplate` (metadatos + array de `Layer` para Konva)
2. Una cadena HTML con marcadores `USUARIO_*` para PDF export vía html2canvas

Los marcadores siguen el patrón `USUARIO_NOMBRE`, `USUARIO_EXP1_EMPRESA`, etc.

## PDF Export

`pdf-exporter.ts` inyecta datos en el HTML, lo renderiza en un iframe oculto,
espera `document.fonts.ready`, captura con `html2canvas` y exporta con `jsPDF`.

## DB

Tabla: `cvs_inspiracion`
```sql
id          uuid primary key
user_id     uuid references auth.users
template_id text
canvas_state jsonb
thumbnail_url text
created_at  timestamptz
updated_at  timestamptz
```