Necesito tu **análisis y feedback** antes de escribir cualquier código. **No quiero que codees todavía**, quiero que primero analices muy bien la situación, hagas preguntas si algo no está claro, identifiques riesgos, edge cases, y me des tu opinión sobre la mejor forma de implementarlo. Después de tu análisis decidiré si avanzamos.

## **Nueva funcionalidad a añadir**

Quiero añadir importación de datos de LinkedIn **vía URL del perfil**, usando la API de **Bright Data** (concretamente su producto "LinkedIn People Profile Scraper API"). El precio es \~$0.0015 por perfil en pay-as-you-go.

## **La experiencia que quiero crear (clave: que parezca magia)**

En el onboarding, ya existe un campo donde el usuario puede pegar su URL de LinkedIn. Lo que quiero es lo siguiente:

1. **El usuario pega su URL de LinkedIn** en el onboarding y sigue rellenando el resto del formulario normalmente.

2. **Por detrás, sin avisar al usuario, sin loaders, sin spinners visibles, sin mensajes**: se dispara una llamada a Bright Data para obtener los datos del perfil. Esto ocurre en background mientras el usuario sigue su flujo normal.

3. **Una IA procesa, cura y estructura** la información obtenida de LinkedIn para que encaje con el modelo de datos de Resumint (probablemente reusando o adaptando la lógica que ya existe para el parsing de PDF).

4. **El formulario de onboarding se autocompleta** con los datos obtenidos en los campos que el usuario aún no haya rellenado, sin sobrescribir nada que el usuario haya escrito manualmente. La precedencia siempre es: lo que el usuario escribió \> lo que vino de LinkedIn.

5. **La sección /perfil del usuario también queda cargada** con la información estructurada de LinkedIn, sin que el usuario tenga que hacer nada extra. Cuando termina el onboarding y entra a su perfil, encuentra todo ya rellenado.

6. **La foto de perfil**: si el usuario subió una foto en el onboarding, esa permanece. Si NO subió ninguna, automáticamente se carga la foto que venga del LinkedIn, tanto el formulario del onboarding como en todos los lugares donde va el avatar del usuario, el cambio debe ser instantaneo.

## **Casos donde NO debe hacer nada (failure silencioso)**

Esto es importantísimo: la funcionalidad debe ser **completamente opcional e invisible si falla**. El usuario nunca debe enterarse de que hubo un intento de scraping si:

* No puso URL de LinkedIn en el onboarding.  
* La URL es inválida o el perfil es privado.  
* Bright Data devuelve error, timeout, o datos vacíos.  
* El perfil existe pero no devuelve información útil (perfil casi vacío).

En todos estos casos, el onboarding sigue funcionando exactamente como lo hace ahora. **Cero impacto en la UX actual si esto falla**.

## **Optimización de coste obligatoria: caché compartida**

Para minimizar costes de Bright Data, necesito **caché compartida entre usuarios** en Supabase:

* Antes de llamar a Bright Data, comprobar si esa URL ya está en una tabla `linkedin_profiles_cache`.  
* Si está y tiene menos de 60 días, usar el dato cacheado (coste $0).  
* Si no, llamar a Bright Data, guardar el resultado en caché, y usarlo.

Esto permite que si dos usuarios tienen el mismo LinkedIn (improbable pero posible), o si un mismo usuario reimporta, no se pague dos veces. Más importante: si Bright Data falla en una llamada futura sobre el mismo perfil, tenemos respaldo en caché.

## **Lo que quiero de ti antes de codear**

1. **Analiza el código actual de Resumint** y entiende cómo funciona el flujo de onboarding, el parsing del PDF, el modelo de datos del CV/perfil, y cómo está estructurado todo. No asumas nada, mira el código real.

2. **Identifica riesgos y edge cases** que yo no haya mencionado. Por ejemplo: ¿qué pasa si el scraping tarda más que el onboarding completo del usuario? ¿qué pasa si el usuario sale antes de que termine? ¿cómo manejamos la concurrencia? ¿qué ocurre si la IA de procesamiento devuelve datos malformados?

3. **Propón la arquitectura concreta**: dónde vive cada pieza, qué archivos crear, qué archivos modificar, cómo se comunican, si necesita ser síncrono o asíncrono (background job), si conviene usar Server Actions, API Routes, Edge Functions, etc.

4. **Evalúa la propuesta de caché**: ¿60 días es razonable? ¿debería invalidarse en algún caso? ¿es legalmente seguro guardar datos de LinkedIn en nuestra BD aunque la persona no sea usuaria nuestra?

5. **Cuestiona mis decisiones si crees que hay opciones mejores**. Por ejemplo, si crees que usar una IA para "curar" los datos es excesivo y un mapeo directo de campos sería suficiente (porque Bright Data ya devuelve JSON estructurado), dímelo.

6. **Pregúntame lo que necesites saber** antes de proponer la solución. Hay cosas del código actual que tú puedes ver y yo no.

7. **NO escribas código todavía**. Quiero leer tu análisis primero, decidir contigo el plan, y luego pasamos a implementación.

