# Especificación: Smart Guides / Snapping de Alineación (estilo Canva)

Implementa un sistema de guías de alineación inteligentes con comportamiento idéntico
al de Canva / Figma. Esta especificación corrige errores conceptuales de versiones
previas y describe el algoritmo real usado por estos editores.

> **Principio rector:** El snapping NO funciona suprimiendo ejes según la dirección del
> movimiento. Funciona evaluando *todos* los puntos de alineación posibles en *ambos*
> ejes en cada frame, y activando únicamente aquellos cuya distancia esté por debajo de
> un umbral pequeño. La sensación de "limpieza" de Canva surge de ese umbral pequeño +
> histéresis, NO de apagar un eje completo.

---

## 0. DEFINICIONES Y CONVENCIONES

- **Elemento arrastrado** (`dragged`): el elemento que el usuario mueve.
- **Bounding box**: `{ left, top, right, bottom, centerX, centerY, width, height }`
  en coordenadas de LIENZO (no de pantalla).
- **Snap point**: una de las 6 líneas de referencia de un elemento:
  - Eje X (líneas verticales): `left`, `centerX`, `right`
  - Eje Y (líneas horizontales): `top`, `centerY`, `bottom`
- **zoomLevel**: factor de escala del lienzo (1.0 = 100%).
- Todos los cálculos de geometría se hacen en coordenadas de LIENZO. Los umbrales se
  definen en píxeles de PANTALLA y se convierten dividiendo entre `zoomLevel`.

```
SNAP_IN_THRESHOLD_SCREEN  = 5    // px de pantalla: distancia para ENGANCHAR
SNAP_OUT_THRESHOLD_SCREEN = 9    // px de pantalla: distancia para SOLTAR (histéresis)
EQUAL_SPACING_TOLERANCE   = 2    // px de lienzo: tolerancia de equidistancia
```

Conversión en cada frame:
```js
const snapIn  = SNAP_IN_THRESHOLD_SCREEN  / zoomLevel;
const snapOut = SNAP_OUT_THRESHOLD_SCREEN / zoomLevel;
```

---

## 1. RECOLECCIÓN DE LÍNEAS DE REFERENCIA (cada frame del drag)

NO se elige "un elemento de referencia". Se construye una lista completa de líneas
candidatas, exactamente como hacen Konva, Figma y Canva:

```
function collectReferenceLines(draggedElement, allElements, canvas):
    verticalLines   = []   // posiciones X candidatas (líneas verticales)
    horizontalLines = []   // posiciones Y candidatas (líneas horizontales)

    // a) Bordes y centro del lienzo / página (SIEMPRE presentes)
    verticalLines.push(   { pos: 0,                kind: 'canvas-edge' } )
    verticalLines.push(   { pos: canvas.width / 2, kind: 'canvas-center' } )
    verticalLines.push(   { pos: canvas.width,     kind: 'canvas-edge' } )
    horizontalLines.push( { pos: 0,                kind: 'canvas-edge' } )
    horizontalLines.push( { pos: canvas.height / 2,kind: 'canvas-center' } )
    horizontalLines.push( { pos: canvas.height,    kind: 'canvas-edge' } )

    // b) Las 3 líneas X y 3 líneas Y de CADA elemento visible distinto al arrastrado
    for el in allElements:
        if el === draggedElement: continue
        if not el.visible:        continue
        b = el.boundingBox
        verticalLines.push(   { pos: b.left,    kind: 'edge',   ownerId: el.id } )
        verticalLines.push(   { pos: b.centerX, kind: 'center', ownerId: el.id } )
        verticalLines.push(   { pos: b.right,   kind: 'edge',   ownerId: el.id } )
        horizontalLines.push( { pos: b.top,     kind: 'edge',   ownerId: el.id } )
        horizontalLines.push( { pos: b.centerY, kind: 'center', ownerId: el.id } )
        horizontalLines.push( { pos: b.bottom,  kind: 'edge',   ownerId: el.id } )

    return { verticalLines, horizontalLines }
```

---

## 2. PUNTOS DE SNAP DEL ELEMENTO ARRASTRADO

El elemento arrastrado expone 3 puntos por eje. Para cada uno se guarda el `offset`
respecto al origen del elemento, necesario para reposicionarlo sin "saltos":

```
function getDraggedSnapPoints(draggedElement):
    b   = draggedElement.boundingBox
    pos = draggedElement.position   // origen real del elemento (x, y)

    return {
        vertical: [   // se comparan contra verticalLines
            { value: b.left,    offset: pos.x - b.left,    type: 'left'    },
            { value: b.centerX, offset: pos.x - b.centerX, type: 'centerX' },
            { value: b.right,   offset: pos.x - b.right,   type: 'right'   },
        ],
        horizontal: [ // se comparan contra horizontalLines
            { value: b.top,     offset: pos.y - b.top,     type: 'top'     },
            { value: b.centerY, offset: pos.y - b.centerY, type: 'centerY' },
            { value: b.bottom,  offset: pos.y - b.bottom,  type: 'bottom'  },
        ],
    }
```

> Esto produce las 9 combinaciones por eje de tu spec original (3 puntos del elemento
> arrastrado × 3 líneas de cada referencia), pero de forma generalizada y correcta:
> `left→left`, `left→center`, `left→right`, `center→...`, `right→...`, etc., resultan
> automáticamente de cruzar cada punto con cada línea candidata.

---

## 3. BÚSQUEDA DEL MEJOR SNAP POR EJE (independiente por eje)

Cada eje se resuelve por separado. El criterio es la **mínima distancia EN ESE EJE**
(no distancia ortogonal). Esto reemplaza por completo el concepto erróneo de
"elemento ortogonalmente más cercano".

```
function findBestSnap(draggedPoints, referenceLines, threshold):
    best = null   // { line, point, distance }
    for line in referenceLines:
        for point in draggedPoints:
            d = Math.abs(line.pos - point.value)
            if d <= threshold:
                if best == null or d < best.distance:
                    best = { line, point, distance: d }
    return best   // null si nada está dentro del umbral
```

Se llama dos veces, una por eje:

```
bestV = findBestSnap(dragged.vertical,   refLines.verticalLines,   activeThreshold)
bestH = findBestSnap(dragged.horizontal, refLines.horizontalLines, activeThreshold)
```

**Ambos ejes pueden tener snap simultáneamente y eso es CORRECTO** (p.ej. esquina
alineada con esquina). Lo que evita ruido visual es el umbral pequeño + la histéresis
de la sección 4, NO la supresión de un eje.

---

## 4. HISTÉRESIS / COMPORTAMIENTO MAGNÉTICO (clave para que "se sienta como Canva")

Este es el corazón del comportamiento pegajoso. Se mantiene **estado de snap por eje**
entre frames:

```
state = {
    x: { snapped: false, linePos: null, offset: null, pointType: null },
    y: { snapped: false, linePos: null, offset: null, pointType: null },
}
```

Regla de DOBLE UMBRAL (patente Apple US8347238, el algoritmo estándar de la industria):

- Si el eje **NO está enganchado**: usar `snapIn` (≈5px) como umbral para enganchar.
- Si el eje **YA está enganchado**: usar `snapOut` (≈9px). El elemento permanece
  pegado a la línea mientras el cursor no se aleje más de `snapOut`. Esto crea la
  "zona de retención magnética".

Algoritmo por eje (ejemplo para X; idéntico para Y):

```
function resolveAxis(axisState, draggedPointsAxis, referenceLinesAxis,
                     pointerDeltaAxis):

    threshold = axisState.snapped ? snapOut : snapIn
    best = findBestSnap(draggedPointsAxis, referenceLinesAxis, threshold)

    if axisState.snapped:
        // ¿Seguimos cerca de la MISMA línea a la que estábamos pegados?
        stillNear = best != null
                    and Math.abs(best.line.pos - axisState.linePos) < 0.5
        // ¿El usuario ha "tirado" lo suficiente para liberar?
        pulledAway = Math.abs(accumulatedPull) > snapOut

        if best == null or pulledAway:
            // LIBERAR el snap
            axisState.snapped = false
            accumulatedPull   = 0
            return null
        else:
            // MANTENER el snap (re-aplicar cada frame; ver sección 5)
            return axisState   // sigue pegado a linePos con offset guardado

    else:
        if best != null:
            // ENGANCHAR
            axisState.snapped   = true
            axisState.linePos   = best.line.pos
            axisState.offset    = best.point.offset
            axisState.pointType = best.point.type
            axisState.refLine   = best.line   // para dibujar guía + indicadores
            accumulatedPull     = 0
            return axisState
        else:
            return null
```

Acumulación de "tirón" (`accumulatedPull`): mientras el eje está enganchado, sumar
en cada frame el delta del puntero en ese eje. Cuando su valor absoluto supera
`snapOut`, se libera. Al enganchar o liberar, se resetea a 0.

> **Bug que esto corrige:** si solo mueves el elemento una vez al engancharse y no
> re-aplicas la posición cada frame, el elemento se "despega" inmediatamente porque
> el siguiente `dragmove` lo mueve siguiendo el puntero. La posición pegada DEBE
> reimponerse en cada frame mientras `axisState.snapped` sea true (sección 5).

---

## 5. APLICACIÓN DE LA POSICIÓN (cada frame)

```
function onDragMove(event):
    // 1. Posición "libre" según el puntero (sin snap)
    freePos = computePointerPosition(event)
    draggedElement.position = freePos     // posición provisional

    // 2. Recalcular cajas y puntos con la posición libre
    refLines = collectReferenceLines(draggedElement, allElements, canvas)
    pts      = getDraggedSnapPoints(draggedElement)

    // 3. Resolver cada eje con histéresis
    accumulatedPull.x += event.dx
    accumulatedPull.y += event.dy
    resX = resolveAxis(state.x, pts.vertical,   refLines.verticalLines,   event.dx)
    resY = resolveAxis(state.y, pts.horizontal, refLines.horizontalLines, event.dy)

    // 4. Forzar posición en los ejes enganchados (SNAP DURO, cada frame)
    finalPos = { x: freePos.x, y: freePos.y }
    if resX:  finalPos.x = resX.linePos + resX.offset
    if resY:  finalPos.y = resY.linePos + resY.offset
    draggedElement.position = finalPos

    // 5. Dibujar guías + indicadores SOLO de los ejes enganchados
    clearGuides()
    if resX: drawGuide(resX, 'vertical');   drawDistanceIndicator(resX, 'vertical')
    if resY: drawGuide(resY, 'horizontal'); drawDistanceIndicator(resY, 'horizontal')

    // 6. Equidistancia (sección 7)
    drawEqualSpacing(draggedElement, allElements)
```

**Nunca acumular deltas "desde el último snap" para decidir el eje dominante.**
Ese concepto se elimina por completo. La posición se recalcula desde el puntero
real cada frame y el snap se aplica como override.

---

## 6. APARIENCIA DE LA GUÍA

- Línea de **1px** que cruza TODO el lienzo (de borde a borde), no solo entre los dos
  elementos. Para una guía vertical: de `y=0` a `y=canvasHeight` en `x=lineGuide`.
- Aparece en el mismo frame en que el eje engancha; desaparece en el mismo frame en
  que se libera o termina el drag.
- Solo UNA guía por eje a la vez (la del `best` ganador). Máximo 2 guías en pantalla
  (una vertical + una horizontal).
- Color/estilo: usar el color de acento del sistema de diseño existente. Sugerencia
  por defecto si no hay uno: magenta/rosa (`#E5326E`) para alineación con elementos,
  y un tono distinto (p.ej. azul `#00A8FF`) para alineación con el lienzo, replicando
  la convención de Canva (rosa = objetos, otro = centro de página).

---

## 7. INDICADORES DE DISTANCIA (OBLIGATORIO)

Se muestran SIEMPRE que haya una guía activa.

### 7a. Distancia borde-a-borde respecto al vecino más cercano

Para el eje enganchado, el indicador mide el **gap visible (espacio vacío)** entre el
elemento arrastrado y el elemento de referencia *más cercano en el eje ORTOGONAL al
de la guía* (este es el único lugar donde "ortogonal" es correcto: la guía define el
eje de alineación, y se mide la separación perpendicular a ella).

```
function nearestNeighborForIndicator(dragged, refLine, guideAxis):
    // guideAxis = 'vertical'  -> elementos comparten X, medimos GAP en Y
    // guideAxis = 'horizontal'-> elementos comparten Y, medimos GAP en X
    candidates = allElements
        .filter(e => e !== dragged && e.visible)
        .filter(e => e.id === refLine.ownerId or refLine.ownerId == null)
    // si la línea pertenece a un elemento concreto, ese ES el vecino;
    // si es una línea de lienzo, tomar el elemento alineado más cercano
    ...
    return elemento elegido

function gapBetween(a, b, guideAxis):
    if guideAxis == 'vertical':   // medir separación vertical
        if a.bottom <= b.top:  return b.top - a.bottom
        if b.bottom <= a.top:  return a.top - b.bottom
        return -(overlap)            // se solapan -> 0 o negativo
    else:                         // medir separación horizontal
        if a.right <= b.left:  return b.left - a.right
        if b.right <= a.left:  return a.left - b.right
        return -(overlap)
```

- Mostrar el número en las MISMAS UNIDADES del lienzo (px, cm…).
- Si los elementos se solapan, mostrar `0` (o el valor negativo del solape, según la
  convención del producto).
- **Prohibido** medir centro-a-centro. Siempre borde-a-borde (el gap visible).

### 7b. Formato de la etiqueta

- Etiqueta pequeña con el valor, **centrada dentro del gap**.
- Flechas en ambos extremos del gap tocando los bordes de cada elemento: `← 48 →`.
- Si el gap es demasiado pequeño para la etiqueta, colocarla fuera del gap con una
  pequeña línea líder hacia el espacio medido.
- Posicionamiento:
  - Guía **vertical** activa (elementos alineados en X): la etiqueta y las flechas
    se dibujan en el espacio VERTICAL entre ambos elementos, centradas en X sobre la
    zona de solape horizontal de las cajas.
  - Guía **horizontal** activa (elementos alineados en Y): la etiqueta y las flechas
    se dibujan en el espacio HORIZONTAL entre ambos, centradas en Y.

### 7c. Indicadores de equidistancia (3+ elementos)

Cuando el elemento arrastrado queda equidistante entre otros dos elementos en el eje
de medición (dentro de `EQUAL_SPACING_TOLERANCE = ±2px`):

- Detectar tríos `[A] gap1 [dragged] gap2 [B]` donde `|gap1 - gap2| <= 2`.
- Generalizar a cadenas: si existen varios gaps iguales consecutivos entre elementos
  alineados, marcarlos todos.
- Dibujar flechas dobles entre cada par con el mismo valor, replicando las
  "equal spacing guides" de Canva:  `[A] ←32→ [B] ←32→ [C]`.
- Estas guías de equidistancia usan un estilo visual distinto (cajas/corchetes en
  los extremos) para diferenciarlas del indicador de gap simple.

---

## 8. FIN DEL DRAG

```
function onDragEnd():
    clearGuides()
    clearDistanceIndicators()
    clearEqualSpacing()
    state.x = { snapped:false, ... }
    state.y = { snapped:false, ... }
    accumulatedPull = { x:0, y:0 }
```

---

## 9. MODIFICADOR PARA DESACTIVAR SNAP

Replicar Canva/Figma: mientras el usuario mantenga pulsada la tecla **Cmd/Ctrl**
durante el drag, omitir por completo las secciones 3–7 (movimiento libre, sin guías).
Al soltar la tecla, el snapping vuelve a activarse en el siguiente frame.

---

## 10. CHECKLIST DE LO QUE DEBE Y NO DEBE OCURRIR

DEBE:
- [x] Evaluar ambos ejes cada frame, de forma independiente.
- [x] Permitir snap simultáneo en X e Y (esquina con esquina).
- [x] Usar umbral en px de PANTALLA convertido por `zoomLevel`.
- [x] Re-aplicar la posición enganchada en CADA frame (no solo al enganchar).
- [x] Usar doble umbral (entrada ≈5px / salida ≈9px) = histéresis.
- [x] Liberar el snap solo cuando el "tirón" acumulado supere el umbral de salida.
- [x] Indicador de distancia SIEMPRE que haya guía, medido borde-a-borde.
- [x] Guía de 1px que cruza todo el lienzo.

NO DEBE:
- [ ] Decidir un "eje dominante" y suprimir el otro eje. (ERROR RAÍZ — eliminado)
- [ ] Elegir "un único elemento de referencia ortogonalmente más cercano" para el
      snap. (El snap se decide por mínima distancia en el eje, contra TODAS las
      líneas.)
- [ ] Acumular deltas "desde el último snap" para elegir eje. (Concepto eliminado.)
- [ ] Mover el elemento una sola vez al enganchar sin reimponer la posición.
- [ ] Mostrar la distancia de centro a centro.
- [ ] Mantener el snap activo cuando el usuario ya arrastró lejos del punto.
- [ ] Mostrar múltiples guías paralelas del mismo eje a la vez.

---

## APÉNDICE: Referencias del comportamiento real

- Patrón de recolección de líneas y `offset` de reposicionamiento: implementación
  oficial de Konva.js "Objects Snapping" (estándar de facto para editores web tipo
  Canva).
- Mecánica de doble umbral / zona de retención magnética ("gravity"): patente
  Apple US8347238 ("dynamic snapping of user interface elements to alignment
  guides"), base del comportamiento de Keynote/Pages que Canva y Figma replican.
- Distinción guía-de-objeto vs guía-de-centro-de-lienzo por color: convención común
  documentada en Canva, Venngage y BeFunky (rosa/magenta = objetos, segundo color =
  centro de página).
- Equal spacing guides: comportamiento de distribución equidistante documentado en
  Canva y Balsamiq ("equally-spaced" indicators).
