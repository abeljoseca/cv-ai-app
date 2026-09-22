# Instrucción para Claude en VS Code — Añadir CV Mirror a Resumint

## Contexto

Resumint ya está construido con Next.js 14, TypeScript, Supabase y la API de Anthropic Claude. Ya existen dos modos de generación de CV: Modo 1 (para vacante específica) y Modo 2 (CV general). El flujo de previsualización, edición con P9, confirmación, guardado y descarga ya funcionan.

Lo que necesitas hacer es añadir **CV Mirror** como un tercer modo de generación de CV, sin romper nada de lo que ya existe.

---

## Qué es CV Mirror

CV Mirror permite que el usuario suba una foto o captura de pantalla de un diseño de CV que le gusta (por ejemplo, uno que encontró en Pinterest), y el sistema genera un CV con ese mismo diseño visual usando la información real del perfil del usuario que ya tenemos guardada en la base de datos.

No es seleccionar entre los estilos predefinidos del sistema. Es traer un diseño externo como referencia.

---

## Cambios en la base de datos

Sobre la tabla `cvs` existente, añade los siguientes campos nuevos si no existen ya:

- `modo` — si ya existe como enum, añade el valor `'mirror'`. Si no existe, créalo como campo texto.
- `imagen_referencia_url` — texto nullable. Almacena la URL de la imagen subida por el usuario como referencia de diseño (solo aplica en modo mirror).
- `diseno_mirror_json` — JSONB nullable. Almacena el JSON con instrucciones visuales que devuelve el análisis de la imagen (solo aplica en modo mirror).
- `foto_cv_url` — texto nullable. Almacena una foto específica para este CV, que puede ser diferente a la foto del perfil del usuario (solo aplica en modo mirror).

En Supabase Storage, crea dos buckets nuevos si no existen:

- `imagenes-referencia` — para las imágenes de diseño que sube el usuario. Ruta de archivos: `{user_id}/{timestamp}.{ext}`. Políticas RLS: solo el propietario puede leer y escribir.
- `fotos-cv` — para la foto específica de un CV Mirror cuando el usuario sube una foto diferente a la de su perfil. Ruta: `{cv_id}/foto.{ext}`. Mismas políticas RLS.

También necesitas añadir un contador de CV Mirror por mes al perfil del usuario. Si tu tabla `profiles` ya tiene un campo para controlar generaciones mensuales, añade uno específico llamado `cvs_mirror_este_mes` con valor entero default 0. Este contador se resetea junto con los demás contadores mensuales.

---

## Cambios en la selección de intención del CV

En la pantalla donde el usuario actualmente elige entre "CV para vacante" y "CV general", añade una tercera opción: **CV Mirror**.

Diseño de la tarjeta de CV Mirror:
- Nombre: "CV Mirror"
- Descripción breve: "Tengo un diseño que me gusta. Quiero usarlo para mi CV."
- Ícono sugerente de imagen o espejo
- Mismo estilo visual que las otras dos tarjetas existentes

Límites por plan que debes validar antes de dejar seleccionar esta opción:
- Plan Gratuito: máximo 1 CV Mirror por mes. Si ya usó el cupo, muestra un tooltip o mensaje explicando el límite y ofrece el upgrade a Pro.
- Plan Pro: ilimitado.

---

## Nueva pantalla: Configuración de CV Mirror

Cuando el usuario selecciona CV Mirror, llega a una pantalla nueva antes de la previsualización. Esta pantalla tiene un único propósito: recoger la imagen de referencia.

Elementos de la pantalla:

**Zona de subida de imagen:**
- Área de drop con borde punteado o botón "Seleccionar imagen"
- Acepta JPG, PNG, WEBP
- Una vez subida la imagen, muestra preview de la imagen a tamaño razonable
- Botón "Cambiar imagen" si ya hay una subida

**Texto informativo** (breve, no técnico):
"Replicaremos la estructura y el estilo de este diseño usando tu información. El resultado puede variar según la complejidad del diseño original."

**Botón "Previsualizar CV":**
- Desactivado hasta que haya una imagen subida
- Al hacer clic, sube la imagen a Supabase Storage en el bucket `imagenes-referencia`, guarda la URL en el registro del CV que se está creando, y dispara el proceso de análisis y generación

---

## Nuevo prompt del sistema: P10

Este es el prompt nuevo que necesitas crear. El modelo a usar es el mismo que en todo el sistema: `claude-haiku-4-5-20251001`.

P10 recibe dos cosas: la imagen en base64 y el perfil completo del usuario en JSON.

Su trabajo tiene dos fases internas:

**Fase A — Análisis visual de la imagen:**
Extrae de la imagen de referencia toda la información de diseño estructurada:
- Layout general: cuántas columnas tiene, si hay una barra lateral, cómo se distribuyen los bloques
- Paleta de colores: color de fondo, color de texto principal, color de texto secundario, color de cabecera, color de acento
- Tipografía: familias usadas, pesos aproximados, jerarquía de tamaños entre nombre, títulos de sección y cuerpo
- Orden de las secciones del CV: en qué orden aparecen (cabecera, resumen, experiencia, educación, habilidades, etc.)
- Elementos especiales detectados: iconos de contacto, líneas separadoras, etiquetas tipo pill para habilidades, barras de progreso, formato de fechas visible, uso de color en headers de sección
- **Detección crítica:** si el diseño de referencia incluye zona para foto o no. Devuelve `tiene_foto: true` o `tiene_foto: false`. Esto es fundamental para la lógica que viene después.

**Fase B — Generación del contenido del CV:**
Usando el perfil del usuario y las instrucciones visuales extraídas en Fase A, genera el contenido del CV. Para esto, internamente aplica la misma lógica de los prompts de generación existentes: si el usuario tiene experiencia laboral activa el flujo equivalente a P6; si no tiene experiencia, el equivalente a P7. El diseño detectado se inyecta como variable de formato.

**Salida de P10:**
Devuelve un JSON con dos bloques:
1. `diseno`: todas las instrucciones visuales extraídas (layout, colores, tipografía, orden de secciones, elementos especiales, `tiene_foto`)
2. `contenido`: el texto del CV generado con el perfil del usuario, estructurado por secciones

Ese JSON se almacena en `cvs.diseno_mirror_json` y se usa para construir el componente React dinámico que renderiza la previsualización.

**Casos de error que P10 debe manejar:**
- Imagen ilegible o muy baja calidad: devuelve error con código `IMAGE_QUALITY_LOW`
- Imagen que no es un CV: devuelve error con código `NOT_A_CV`
- Diseño muy complejo: devuelve advertencia con código `DESIGN_COMPLEX` pero continúa y genera lo más fiel posible

---

## Componente React dinámico para la previsualización

A diferencia de los modos 1 y 2 donde el estilo es fijo y usa un componente React predefinido, en CV Mirror el componente de previsualización se construye dinámicamente a partir del JSON que devuelve P10.

Crea un componente `MirrorCVRenderer` que recibe como props el JSON de diseño y el contenido del CV, y renderiza el CV aplicando los estilos, layout, colores y tipografías extraídos de la imagen de referencia. Este componente debe ser capaz de manejar los distintos tipos de layout (una columna, dos columnas, barra lateral) y los distintos elementos especiales detectados.

Para el PDF final, se usa este mismo componente como fuente de renderizado, igual que con los otros estilos.

---

## Lógica de la foto en la previsualización

Esta lógica solo se activa si P10 devolvió `tiene_foto: true`. Si el diseño de referencia no tiene zona para foto, nunca se muestra ni se pide foto al usuario y toda esta sección no aplica.

**Caso A — El usuario ya tiene foto en su perfil (`profiles.foto_url` no es null):**

En la pantalla de previsualización, dentro de la zona de foto del CV renderizado, muestra un control discreto superpuesto: un ícono de cámara pequeño con el texto "Cambiar foto para este CV".

Si el usuario hace clic en ese control:
- Abre un selector de archivo
- El usuario sube una imagen nueva
- Esa imagen se sube al bucket `fotos-cv` con ruta `{cv_id}/foto.{ext}`
- La URL se guarda en `cvs.foto_cv_url`
- La foto del CV en la previsualización se actualiza en tiempo real con la nueva imagen
- La foto del perfil del usuario en `profiles.foto_url` no se modifica bajo ninguna circunstancia

Si el usuario no hace nada con ese control, el CV usa la foto del perfil (`profiles.foto_url`) como foto del CV. No se guarda nada en `cvs.foto_cv_url` para este caso.

**Caso B — El usuario no tiene foto en su perfil (`profiles.foto_url` es null):**

En la zona de foto del CV renderizado, muestra un placeholder visual limpio: un círculo o rectángulo con un ícono de persona en gris suave y el texto "Agregar foto (opcional)" debajo.

Si el usuario hace clic:
- Abre un selector de archivo
- El usuario sube una imagen
- Esa imagen se sube al bucket `fotos-cv` con ruta `{cv_id}/foto.{ext}`
- La URL se guarda en `cvs.foto_cv_url`
- El placeholder se reemplaza por la foto en el CV en tiempo real

Si el usuario no sube foto:
- El CV se genera y descarga sin foto
- El componente `MirrorCVRenderer` debe ajustar el layout limpiamente cuando no hay foto, sin dejar un hueco vacío en el diseño

**Oferta opcional al confirmar (solo aplica en Caso B):**

Cuando el usuario hace clic en "Crear CV" para confirmar, y subió una foto específica para este CV Mirror (`cvs.foto_cv_url` no es null) pero aún no tiene foto de perfil (`profiles.foto_url` es null), muestra una vez un mensaje no intrusivo antes de completar la confirmación:

"También guardamos esta foto para tu CV. ¿Quieres usarla como foto de perfil?"

Con dos botones: "Sí, usar como foto de perfil" y "No, solo para este CV".

- Si acepta: sube la imagen también al bucket `fotos-perfil`, actualiza `profiles.foto_url`, y recalcula el puntaje de completitud del perfil sumando los 5 puntos correspondientes a tener foto.
- Si rechaza: no hace nada adicional. La foto queda vinculada solo a ese CV.

Este mensaje aparece solo una vez por sesión de CV Mirror. Si el usuario genera otro CV Mirror en el futuro y sigue sin foto de perfil, puede aparecer de nuevo.

---

## Panel de edición de colores (exclusivo de CV Mirror)

En la pantalla de previsualización de CV Mirror, añade un panel lateral de edición de colores que no existe en los otros modos.

Qué muestra el panel:
- 4 swatches circulares, uno por cada color editable, con etiqueta debajo: "Acento", "Texto principal", "Texto secundario", "Fondo"
- Los valores iniciales de los swatches vienen del JSON que devolvió P10

Comportamiento:
- Al hacer clic en un swatch, abre un color picker básico (puedes usar una librería ligera o el input nativo de color de HTML)
- Al seleccionar un color nuevo, el componente `MirrorCVRenderer` actualiza su paleta en tiempo real sin llamar a la IA ni consumir generaciones
- Los colores actualizados se guardan en el campo `diseno_mirror_json` del CV junto con el resto del diseño cuando el usuario confirma

Qué NO es editable en este panel (requeriría nueva generación):
- El layout (número de columnas, distribución)
- La tipografía
- El orden de las secciones

---

## Manejo de errores de CV Mirror

Los errores de análisis de imagen tienen mensajes específicos. Nunca muestres el error técnico crudo al usuario.

| Código de error de P10 | Mensaje visible al usuario | Acción |
|---|---|---|
| `IMAGE_QUALITY_LOW` | "La imagen no tiene suficiente calidad para analizar el diseño. Intenta con una captura más nítida." | Permite subir otra imagen |
| `NOT_A_CV` | "No detecté un diseño de CV en esta imagen. Intenta con una imagen diferente." | Permite subir otra imagen |
| `DESIGN_COMPLEX` | "El diseño tiene elementos que no podemos replicar exactamente, pero haremos la versión más fiel posible." | Continúa mostrando la previsualización con esta advertencia |
| Error genérico de la API | "Ocurrió un problema al analizar el diseño. Intenta de nuevo." | Reintenta automáticamente una vez de forma silenciosa. Si falla de nuevo, muestra este mensaje. |

Regla crítica: ningún error de P10 descuenta una generación del plan del usuario. El descuento solo ocurre cuando el usuario llega exitosamente a "Crear CV" y confirma.

---

## Cambios en "Mis CVs"

Las tarjetas de CV en el historial ya muestran el modo del CV. Asegúrate de que el modo `mirror` muestre un badge visual diferenciador, por ejemplo "CV Mirror", con el mismo estilo que los badges de "CV General" y "Para Vacante" que ya existen.

El campo que en CV Mirror hace las veces de título o cargo para mostrar en la tarjeta debe tomarse del título profesional generado por P10 en el contenido del CV.

---

## Resumen de lo que debes implementar

1. Migración de base de datos: campos nuevos en `cvs`, contador en `profiles`, dos buckets nuevos en Storage.
2. Añadir la opción "CV Mirror" en la pantalla de selección de intención, con validación de límite por plan.
3. Crear la pantalla de configuración de CV Mirror con subida de imagen.
4. Crear el prompt P10 y su API route correspondiente que sube imagen a la IA, recibe el JSON de diseño + contenido, y lo guarda.
5. Crear el componente React `MirrorCVRenderer` que renderiza el CV dinámicamente a partir del JSON.
6. Implementar la lógica completa de foto en previsualización: Caso A (tiene foto), Caso B (no tiene foto), y oferta opcional al confirmar.
7. Añadir el panel lateral de edición de colores en la previsualización de CV Mirror.
8. Conectar el flujo de confirmación de CV Mirror al flujo existente de "Crear CV" (guardado, descuento de generación, pantalla de éxito).
9. Actualizar las tarjetas de "Mis CVs" para mostrar el badge correcto para modo mirror.
10. Manejar todos los errores de P10 con sus mensajes específicos.

No toques nada del flujo de Modo 1 ni Modo 2. Todo lo nuevo es aditivo.
