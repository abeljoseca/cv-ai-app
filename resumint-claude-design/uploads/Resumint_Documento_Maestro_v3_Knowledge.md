# Resumint — Documento Maestro de Producto v3

## Propósito del documento

Este documento define la visión, reglas, flujos, decisiones cerradas y criterios operativos de Resumint.

Su función es servir como fuente única de verdad para producto, diseño, arquitectura, prompts e implementación.

Todo lo descrito aquí debe considerarse contexto base antes de redactar instrucciones para desarrollo o abrir nuevas discusiones funcionales.

---

## Qué es Resumint

Resumint es una aplicación web SaaS que usa inteligencia artificial para ayudar a cualquier persona a crear un CV profesional de alta calidad, sin necesidad de saber diseño ni redacción.

El usuario entrega información sobre su trayectoria conversando con la IA o subiendo un documento, y la aplicación genera un CV listo para usar.

El producto permite dos resultados principales:

- Un CV general, fiel al perfil profesional del usuario.
- Un CV optimizado para una vacante específica, adaptado al cargo objetivo usando únicamente información real del usuario.

### Propuesta de valor

En menos de 10 minutos, cualquier persona puede tener un CV bien estructurado, claro y profesional, sin depender de conocimientos de diseño ni de redacción.

### Audiencia

Resumint está pensado para cualquier persona que necesite un CV:

- Recién graduados sin experiencia laboral.
- Personas en su primera búsqueda de empleo.
- Profesionales con experiencia que necesitan actualizar su CV.
- Usuarios que desean personalizar su CV para una vacante concreta.

---

## Principios del producto

Estos principios no son opcionales. Deben orientar todas las decisiones de diseño, producto y desarrollo.

- El producto debe sentirse simple, directo y profesional.
- El usuario nunca debe sentirse perdido, castigado ni obligado a entender lógica técnica.
- Toda la información del usuario debe vivir en un único perfil acumulativo.
- El sistema nunca debe inventar datos del usuario.
- La IA puede reorganizar, resumir y optimizar, pero no fabricar experiencia, educación, logros, habilidades o cargos inexistentes.
- El MVP debe priorizar claridad, velocidad de validación, bajo costo operativo y arquitectura sostenible.
- Ninguna funcionalidad debe construirse si su comportamiento normal, sus casos borde y sus restricciones no están definidos.

---

## Stack técnico de referencia

- Framework: Next.js 14 con App Router
- Lenguaje: TypeScript
- Base de datos, autenticación y almacenamiento: Supabase
- Inteligencia artificial: API de Anthropic Claude
- Modelo base del MVP: Claude Haiku
- Deploy: Vercel
- Generación de documentos DOCX: librería `docx` de npm
- Exportación PDF: flujo basado en render HTML/CSS del CV
- Gráficos del panel administrativo: Recharts

### Estrategia de costo del MVP

Durante el MVP, Claude Haiku se utilizará en todos los contextos del sistema:

- Chat del onboarding
- Chat de actualización de perfil
- Parser de documentos
- Generación de CVs
- Cálculo de match con vacante
- Revisión ortográfica y gramatical tras edición manual

Solo si la calidad de los CVs generados resulta insuficiente en uso real, se evaluará migrar exclusivamente los prompts de generación final a un modelo superior.

---

## Módulos del producto

Resumint tiene dos grandes módulos:

1. Experiencia del usuario final.
2. Panel administrativo.

### Experiencia del usuario final

Incluye:

- Registro e inicio de sesión.
- Onboarding.
- Construcción del perfil con IA.
- Generación de CVs.
- Historial de CVs.
- Seguimiento de aplicaciones.
- Gestión del plan.

### Panel administrativo

Es un módulo exclusivo del equipo interno de Resumint.

No forma parte del MVP inicial del usuario final y se desarrolla al final.

---

## Flujo completo del producto

1. Registro.
2. Primer acceso.
3. Onboarding de configuración básica.
4. Chat con IA para construir perfil.
5. Evaluación de completitud.
6. Selección de intención del CV.
7. Selección de estilo.
8. Generación de previsualización.
9. Edición manual opcional.
10. Revisión silenciosa.
11. Confirmación final.
12. Guardado automático.
13. Descarga.
14. Historial y seguimiento.

---

## Registro y primer acceso

El usuario crea su cuenta con correo electrónico y contraseña.

Al registrarse por primera vez, es redirigido obligatoriamente al onboarding.

Mientras no complete los campos obligatorios del onboarding, no puede acceder al resto de la aplicación.

Cuando un usuario inicia sesión, el sistema siempre verifica si ya completó los datos obligatorios del onboarding.

- Si no los completó, vuelve al onboarding.
- Si ya los completó, entra directamente a Mi Perfil.

---

## Onboarding — Configurar perfil

El onboarding existe únicamente para capturar la identidad básica del usuario.

En esta pantalla no se suben documentos, no se genera CV y no se toman decisiones sobre intención o estilo.

### Campos del formulario

- Foto de perfil.
- Nombre, obligatorio.
- Apellido, obligatorio.
- Profesión o especialización, opcional.
- Teléfono, opcional.
- Ciudad y país, opcional.
- Correo que aparecerá en el CV, obligatorio; se autocompleta con el correo de registro pero es editable.

### Reglas del onboarding

- Nombre, apellido y correo del CV son obligatorios.
- Si faltan campos obligatorios, se muestran errores debajo de cada campo vacío.
- El usuario no puede continuar hasta guardar correctamente.
- Al guardar correctamente, se activa el botón “Continuar”.

### Foto de perfil

La foto es opcional, pero debe aceptar formatos comunes de imagen.

Si la subida falla, el sistema debe mostrar un mensaje simple, no técnico, y permitir reintento.

---

## Perfil único acumulativo

Toda la información del usuario vive en una única estructura acumulativa.

Ese perfil es la fuente de verdad para:

- La barra de completitud.
- La experiencia de Mi Perfil.
- La generación de CVs.
- El cálculo de match con vacantes.
- El historial y la evolución del usuario.

### Estructura conceptual del perfil

```ts
perfil = {
  informacion_personal: {
    nombre,
    apellido,
    foto_url,
    telefono,
    ciudad,
    pais,
    email_cv,
    profesion_perfil
  },
  profesiones_inferidas: [],
  resumen_profesional,
  experiencia: [],
  educacion: [],
  habilidades: [],
  logros: [],
  idiomas: [],
  puntaje_completitud
}
```

### Regla principal de profesión

La profesión que el usuario escriba manualmente en la configuración de perfil se guarda como `profesion_perfil`.

Esa es:

- La profesión que aparece siempre en la cabecera de Mi Perfil.
- La profesión de referencia para el CV general.

Si un documento o una conversación revelan otras profesiones, esas se guardan en `profesiones_inferidas[]` como contexto interno.

Nunca deben reemplazar automáticamente `profesion_perfil`.

Nunca deben mostrarse como profesión principal del perfil.

---

## Puntaje de completitud

La barra de completitud se calcula sobre 100 puntos.

El almacenamiento del perfil es ilimitado, pero el cálculo del puntaje tiene topes por sección para evitar que una sola categoría complete artificialmente el perfil.

### Capa 1 — Datos básicos del onboarding (máximo 30 puntos)

| Campo | Puntos |
|---|---:|
| Nombre + Apellido | 10 |
| Email del CV | 5 |
| Foto de perfil | 5 |
| Profesión | 5 |
| Teléfono + Ciudad/País | 5 |

### Capa 2 — Perfil profesional (máximo 70 puntos)

| Sección | Regla | Puntos máximos |
|---|---|---:|
| Experiencia laboral | 15 puntos por entrada, máximo 2 entradas contabilizadas | 30 |
| Educación | 10 puntos por entrada, máximo 2 entradas contabilizadas | 20 |
| Habilidades | 5 puntos si hay al menos 3 habilidades | 5 |
| Logros | 5 puntos si hay al menos 1 logro | 5 |
| Idiomas | 5 puntos si hay al menos 1 idioma | 5 |
| Resumen profesional | 5 puntos si tiene al menos 30 palabras útiles | 5 |

### Reglas de cálculo

- Si el usuario guarda más de 2 experiencias, todas se almacenan, pero el puntaje de experiencia se mantiene topado en 30.
- Si el usuario guarda más de 2 entradas de educación, todas se almacenan, pero el puntaje de educación se mantiene topado en 20.
- El puntaje se recalcula en tiempo real cada vez que el perfil cambia.
- El objetivo del sistema no es premiar volumen, sino equilibrio del perfil.

---

## Chat con IA — Construcción del perfil

Después del onboarding, el usuario llega a la pantalla principal de construcción del perfil.

### Elementos visibles

- Chat con la IA como elemento central.
- Panel superior con dos acciones principales: Adjuntar documento y Generar CV.

### Mensaje inicial del asistente

Vamos a generar tu CV. Puedes contarme sobre tu experiencia o subir un documento (CV antiguo, LinkedIn en PDF, carta de presentación).

### Principio del flujo

No hay modos intermedios ni ramas artificiales.

La lógica del producto en esta etapa es:

información acumulada → evaluación de suficiencia → decisión de generación.

---

## Reglas generales del chat

Estas reglas aplican a todos los prompts conversacionales del sistema.

1. Máximo 2 líneas en la respuesta visible al usuario.
2. Nunca repetir lo que el usuario acaba de decir.
3. Nunca volver a preguntar algo que ya fue respondido.
4. No usar saludos después del primer mensaje.
5. Hacer solo una pregunta por mensaje.
6. Mantener tono directo, natural y sin relleno.
7. No usar markdown, viñetas ni asteriscos en la respuesta visible.
8. Nunca inventar datos.
9. Si se necesita aclaración, usar una sola línea breve.
10. Cerrar naturalmente cuando el perfil ya esté suficientemente completo.
11. Si una respuesta del usuario cubre varios campos, registrar todo al mismo tiempo.

---

## Carga y parseo de documentos

El usuario puede subir documentos como CV antiguo, carta de presentación o perfil exportado.

El sistema debe extraer información útil y fusionarla con el perfil acumulativo.

### Reglas de merge

- Un documento nunca sobrescribe automáticamente un dato que el usuario haya definido manualmente.
- `profesion_perfil` nunca puede ser reemplazada por contenido extraído del documento.
- Las profesiones detectadas en documentos se agregan a `profesiones_inferidas[]`.
- El sistema puede completar campos vacíos.
- El sistema puede agregar nuevas entradas a experiencia, educación, habilidades, logros e idiomas.
- Si detecta duplicados obvios, debe fusionarlos.
- Si el procesamiento falla, no se guarda información parcial.

### Respuesta visible tras éxito

He analizado tu documento y ya integré la información en tu perfil. Puedes seguir añadiendo detalles o generar tu CV cuando quieras.

---

## Evaluación antes de generar CV

El botón “Generar CV” dispara la evaluación de completitud del perfil.

### Reglas por rango

| Rango | Comportamiento |
|---|---|
| Menos de 30% | Se redirige a completar perfil; no se permite continuar |
| 30%–35% | Se informa que el CV será muy básico, pero se permite continuar |
| 35%–50% | Se informa que sería ideal completar más información |
| 51%–75% | Se informa que se puede generar un buen CV, aunque puede mejorar |
| 76%–85% | Se informa que se puede generar un CV muy bueno |
| Más de 85% | No se muestra advertencia; se continúa directamente |

### Regla operativa

Entre 30% y 100%, el sistema siempre deja continuar.

---

## Selección de intención del CV

Después de la evaluación, el usuario elige uno de dos caminos.

### Modo 1 — CV para vacante específica

Se usa cuando el usuario ya tiene una oferta concreta y quiere un CV optimizado para ese cargo.

### Modo 2 — CV general

Se usa cuando el usuario quiere un CV base, fiel a su trayectoria, sin una vacante específica como referencia.

---

## Modo 1 — CV para vacante específica

### Entradas requeridas

- Descripción completa de la vacante.
- Estilo visual del CV.

El botón “Previsualizar CV” inicia desactivado hasta que ambos campos estén completos.

### Lógica de generación

- La IA analiza la vacante.
- Extrae keywords ATS, habilidades clave y señales de prioridad.
- Cruza esa información con el perfil del usuario.
- Genera un CV optimizado usando exclusivamente datos reales del usuario.
- El título profesional del CV se adapta al cargo objetivo de la vacante.

### Match con la vacante

En la pantalla de previsualización de este modo debe mostrarse un porcentaje de match entre el CV y la vacante.

Ese porcentaje es orientativo, no una garantía de contratación.

#### Rangos de match

| Rango | Interpretación |
|---|---|
| 80–100% | Excelente compatibilidad |
| 55–79% | Buena compatibilidad, mejorable |
| Menos de 55% | Compatibilidad baja |

El sistema debe acompañar el número con un mensaje corto de contexto.

---

## Modo 2 — CV general

### Entradas requeridas

- Estilo visual del CV.

El botón “Previsualizar CV” se activa cuando el usuario selecciona un estilo.

### Lógica de generación

- La IA genera un CV general fiel al perfil acumulado.
- El título profesional toma como base `profesion_perfil`.
- Si `profesion_perfil` está vacío, la IA puede inferir un título usando primero formación académica y luego experiencia reciente.

---

## Estilos de CV

El producto asume 5 estilos visuales de CV.

Cada estilo debe tener:

- Nombre.
- Vista previa.
- Descripción de uso ideal.
- Componente visual React propio.
- Instrucciones de formato específicas para el sistema de generación.

Los estilos no crean prompts de negocio adicionales.

Se tratan como una variable de formato que se inyecta en los prompts de generación.

---

## Pantalla de previsualización

La pantalla de previsualización debe funcionar igual sin importar si el CV viene del modo general o del modo para vacante.

### Elementos activos

- CV renderizado con el estilo elegido.
- Botón “Editar”.
- Botón “Crear CV”.
- Botón “Atrás”.
- Indicador de match, solo en Modo 1.
- Branding sutil en el footer, solo si el usuario es gratuito.

---

## Edición manual del CV

Cuando el usuario hace clic en “Editar”, puede modificar el texto directamente.

Mientras está editando:

- El botón “Crear CV” se desactiva.
- El botón principal pasa a llamarse “Guardar y revisar”.

### Guardar y revisar

Cuando el usuario hace clic en “Guardar y revisar”:

1. Se guarda el texto editado.
2. La IA revisa ortografía y gramática de forma interna.
3. Solo puede corregir errores evidentes.
4. No puede inventar contenido.
5. No puede cambiar hechos, nombres, fechas o afirmaciones del usuario.
6. No debe reescribir por estilo si no es estrictamente necesario.
7. Si se hicieron correcciones, se muestra un indicador sutil avisando que se corrigieron errores menores.
8. Luego el botón vuelve a “Editar” y “Crear CV” se reactiva.

---

## Retroceso en la generación

La pantalla de previsualización puede incluir un botón “Atrás”.

Si el usuario lo usa, debe aparecer un modal de confirmación.

### Mensaje del modal

Volver atrás generará un CV nuevo y consumirá una generación adicional. ¿Deseas continuar?

### Reglas

- “Sí, volver” regresa al paso anterior.
- “Cancelar” mantiene al usuario en la previsualización.
- Volver atrás cuenta como una nueva generación, porque implica volver a procesar y consumir tokens.

---

## Confirmación final y guardado

Cuando el usuario hace clic en “Crear CV”, confirma esa versión como final.

En ese momento:

- El CV se guarda automáticamente en Mis CVs.
- Se registra intención, estilo, contenido final y metadatos relevantes.
- Si aplica, se descuenta una generación del plan.

### Regla crítica

Nunca se deben descontar créditos o generaciones por intentos fallidos de la IA.

El descuento ocurre solamente cuando la previsualización fue exitosa y el proceso llega correctamente al estado final.

---

## Pantalla de descarga

Después de confirmar el CV, el usuario llega a una pantalla independiente de éxito.

La pantalla puede incluir una animación de confeti.

### Acciones disponibles

- Descargar documento.
- Enviar CV por email.
- Generar otro CV.
- Ver CVs creados.

### Reglas por plan

#### Gratuito

- Descarga PDF.
- Branding sutil en footer.

#### Pro

- Descarga PDF.
- Descarga DOCX.
- Sin branding.

---

## Branding del plan gratuito

No se usará marca de agua invasiva.

El branding del plan gratuito será un texto pequeño y sutil en el footer del CV:

Creado con Resumint

Esto permite visibilidad de marca sin dañar la percepción del documento.

---

## Navegación principal

La aplicación usa una estructura clásica SaaS:

- Sidebar izquierdo fijo.
- Header superior.
- Área principal de contenido.

### Sidebar

Debe mostrar:

- Foto del usuario.
- Nombre completo.
- Profesión principal.
- Badge del plan activo.

### Header

Debe mostrar:

- Logo Resumint.
- Botón “Mejorar Cuenta”.
- Botón “Cerrar sesión”.

### Secciones principales

- Mi Perfil
- Crear CV
- Mis CVs
- Seguimiento de Aplicaciones
- Mejorar Cuenta

### Regla cerrada de nomenclatura

La sección oficial se llama Mi Perfil.

No deben convivir “Sobre mí” y “Mi Perfil” como nombres alternos dentro de la navegación.

---

## Mi Perfil

Es la sección principal de identidad y evolución del usuario.

### Debe mostrar

- Foto.
- Nombre y apellido.
- Profesión principal tomada de `profesion_perfil`.
- Barra de completitud.
- Tarjetas de datos de contacto, habilidades, experiencia, educación, idiomas y demás información relevante.

### Columna de chat

Debe incluir:

- Botón “Añadir información nueva sobre mí”.
- Botón “Adjuntar información”.

El chat debe estar siempre disponible como mecanismo de actualización del perfil.

---

## Crear CV

Es una página independiente.

Su responsabilidad es:

- Evaluar el puntaje de completitud.
- Mostrar el mensaje contextual correspondiente.
- Permitir al usuario continuar hacia la selección de intención si está dentro del rango permitido.

---

## Mis CVs

Es el archivo histórico de documentos creados por el usuario.

### Parte superior

Debe mostrar KPIs personales:

- CVs generados.
- Trabajos aplicados.
- Entrevistas conseguidas.

### Tarjetas de CV

Cada tarjeta debe mostrar:

- Título profesional o cargo.
- Fecha de generación.
- Intención del CV.
- Si aplica, empresa o cargo objetivo detectado en la vacante.

### Acciones por tarjeta

- Descargar.
- Enviar por email.
- Eliminar.
- Apliqué con este CV.

### Registro de aplicaciones desde la tarjeta

Si el usuario marca “Apliqué con este CV”, aparece un mini formulario con:

- Puesto.
- Empresa.
- Fecha.
- Estado.
- Nota.

Si el CV era para vacante específica, los datos se precompletan cuando sea posible.

Si era un CV general, aparecen vacíos.

---

## Seguimiento de Aplicaciones

Es el tablero personal de gestión de búsqueda laboral.

### Debe incluir

- Botón “Agregar aplicación” siempre visible.
- Selección obligatoria del CV asociado.
- Campos de empresa, cargo, fecha, estado y nota.
- Filtro por estado.
- Ordenamiento.
- Búsqueda en tiempo real.

### Estados permitidos

- En espera
- Entrevistando
- Contratado
- Rechazado
- Sin respuesta

### Límites por plan

#### Gratuito

Hasta 5 aplicaciones registradas.

#### Pro

Seguimiento ilimitado.

---

## Mejorar Cuenta

Esta sección presenta la oferta de planes y también sirve para validación comercial inicial.

### Plan Gratuito — $0/mes

- 2 CVs generales por mes.
- 2 CVs para vacante específica por mes.
- 2 estilos de CV disponibles.
- Descarga en PDF.
- Historial de los últimos 3 CVs.
- Seguimiento de hasta 5 aplicaciones.
- Branding sutil en footer.
- Chat con IA para construir perfil.

### Plan Pro — $9,99/mes o $24/trimestre

- CVs generales ilimitados.
- CVs para vacante específica ilimitados.
- Los 5 estilos de CV disponibles.
- Descarga en PDF y DOCX.
- Historial completo.
- Seguimiento ilimitado de aplicaciones.
- Prioridad en cola de generación cuando exista carga.
- Sin branding.
- Soporte prioritario.

### Estado comercial inicial

En la fase inicial, el plan Pro puede mostrarse como “Próximamente” para validar interés y construir lista de espera.

---

## Arquitectura de prompts

Resumint no puede funcionar con un único prompt universal.

El sistema necesita prompts separados por contexto y responsabilidad.

### Prompts del sistema

1. **P1 — Chat de onboarding**  
   Construye el perfil desde cero durante el primer acceso.

2. **P2 — Chat de Mi Perfil**  
   Actualiza información en usuarios recurrentes sin repetir preguntas ya resueltas.

3. **P3 — Parser de documentos**  
   Extrae información estructurada desde PDFs y devuelve salida usable por backend.

4. **P4 — Generación de CV para vacante específica con experiencia**  
   Genera un CV ATS-optimizado para usuario con experiencia laboral.

5. **P5 — Generación de CV para vacante específica sin experiencia**  
   Genera un CV ATS-optimizado priorizando educación, habilidades, proyectos y logros.

6. **P6 — Generación de CV general con experiencia**  
   Genera un CV general fiel a la trayectoria profesional del usuario.

7. **P7 — Generación de CV general sin experiencia**  
   Genera un CV general orientado a primer empleo o perfil junior.

8. **P8 — Cálculo de match con vacante**  
   Calcula porcentaje orientativo de compatibilidad entre CV y vacante.

9. **P9 — Corrección tras edición manual**  
   Corrige ortografía y gramática sin alterar hechos ni inventar contenido.

### Regla sobre estilos de CV

Los estilos no agregan prompts nuevos.

Cada prompt de generación recibe instrucciones de formato del estilo elegido como variable de entrada.

---

## Lógica de activación de prompts

- Primer acceso: P1
- Usuario recurrente en Mi Perfil: P2
- Documento subido: P3
- Vacante específica con experiencia: P4
- Vacante específica sin experiencia: P5
- CV general con experiencia: P6
- CV general sin experiencia: P7
- Previsualización de CV para vacante: P8
- Guardar y revisar tras edición: P9

---

## Manejo de errores de IA

### Nivel 1 — Error en chat

- Mostrar mensaje simple para reintentar.
- No perder historial.

### Nivel 2 — Error en parser de documento

- Informar que el documento no pudo procesarse.
- Permitir reintento o uso del chat.
- No guardar datos parciales.

### Nivel 3 — Error en generación de CV

- Reintentar automáticamente una vez.
- Si vuelve a fallar, mostrar mensaje simple.
- No descontar créditos o generaciones.

### Regla transversal

Nunca mostrar mensajes técnicos crudos al usuario.

---

## Renderizado y exportación de CVs

Para mantener bajo el costo y evitar complejidad innecesaria:

- La previsualización del CV debe renderizarse con componentes React por estilo.
- El PDF debe derivarse de esa misma representación visual HTML/CSS.
- El DOCX debe generarse por separado y solo estar disponible en el plan Pro.

Esto evita duplicar sistemas de diseño durante el MVP.

---

## Panel administrativo

El panel administrativo es interno y no forma parte de la prioridad del MVP.

### Visión del módulo

- KPIs de usuarios.
- KPIs de CVs generados.
- Usuarios activos.
- Entrevistas reportadas.
- Nuevos usuarios.
- Tabla de gestión de usuarios.
- Exportación CSV.
- Tendencias visuales.
- Métricas demográficas.
- Métricas de monetización.
- Actividad reciente.

---

## Diseño visual

La aplicación debe sentirse clara, limpia y premium.

Las referencias de tono son productos SaaS sobrios como Stripe, Linear o Bear.

### Principios visuales

- Solo modo claro.
- Fondos blancos y grises suaves.
- Bordes redondeados.
- Sombras muy sutiles.
- Sin gradientes llamativos.
- Sin decoración innecesaria.
- Tipografía limpia con jerarquía clara.

### Sensación general

La interfaz debe comunicar confianza, competencia y cuidado.

Cada pantalla debe tener un propósito obvio y no debe abrumar al usuario.

---

## Qué no debe hacer el sistema

- No inventar datos del usuario.
- No sobrescribir la profesión principal con información extraída de un documento.
- No descontar generaciones por errores de la IA.
- No mostrar mensajes técnicos crudos.
- No usar nombres inconsistentes para la misma sección.
- No usar branding agresivo en el plan gratuito.
- No priorizar el panel administrativo antes del flujo principal del usuario.

---

## Decisiones cerradas

Las siguientes decisiones quedan aprobadas como fuente de verdad:

- Fórmula exacta del puntaje de completitud.
- Tope de puntuación por sección con almacenamiento ilimitado.
- Profesión principal controlada por el usuario.
- Uso de `profesiones_inferidas[]` como contexto interno.
- Retroceso con costo de nueva generación.
- Plan Gratuito y Plan Pro definidos.
- Footer sutil “Creado con Resumint” en el plan gratuito.
- Arquitectura de 9 prompts.
- Match con vacante en previsualización.
- Guardar y revisar con corrección silenciosa controlada.
- Claude Haiku para todo el MVP.
- Render React + PDF desde HTML/CSS + DOCX solo Pro.

---

## Estado actual del producto

Con este documento, Resumint tiene una base suficientemente sólida para pasar a la siguiente fase de trabajo:

- redacción de prompts definitivos,
- diseño de base de datos,
- definición de arquitectura de pantallas,
- y creación de instrucciones para Claude Code.
