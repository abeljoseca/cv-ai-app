# Apify — Documento Técnico Experto

> **Propósito de este documento.** Este archivo está diseñado para ser cargado como contexto en un modelo de lenguaje (p. ej. Claude) y convertirlo en un experto operativo de la plataforma Apify: su arquitectura, sus componentes (Actors, Storage, Proxy, Schedules, Integraciones), su API REST, sus clientes oficiales (JS/Python), sus SDKs, su CLI y su integración con agentes de IA vía MCP. Está basado en la documentación oficial de `https://docs.apify.com` (mayo 2026).
>
> **Nota de versiones y datos cambiantes.** Precios, límites por plan, y nombres exactos de modelos/Actors pueden cambiar. Cuando una cifra sea crítica, verifícala en `https://apify.com/pricing`, `https://docs.apify.com/platform/limits` y la referencia de API. La documentación completa en un solo archivo está disponible en `https://docs.apify.com/llms-full.txt`, y cada página tiene una versión Markdown añadiendo `.md` a su URL (p. ej. `https://docs.apify.com/platform/storage/dataset.md`). El índice para LLMs está en `https://docs.apify.com/llms.txt`.

---

## 1. Qué es Apify (modelo mental)

**Apify es una plataforma cloud y un marketplace para extracción de datos web (web scraping), automatización y data pipelines.** El concepto central es el **Actor**: un programa serverless que se ejecuta en un contenedor Docker en la nube de Apify.

Idea esencial a interiorizar:

- Un **Actor** = programa serverless que recibe un **input JSON estructurado**, ejecuta una tarea (scraping, automatización de navegador, procesamiento de datos) y opcionalmente produce un **output estructurado**.
- Los Actors se ejecutan **manualmente, vía API, vía CLI o por programación (schedule)**, y se pueden encadenar entre sí para construir automatizaciones complejas.
- Apify aporta la infraestructura alrededor del código: **cómputo (Actors), almacenamiento (Datasets, Key-value stores, Request queues), proxies, scheduling, webhooks, monitorización, colaboración y seguridad**.
- Todo es controlable mediante una **API REST** y los **clientes oficiales** (`apify-client` para JS y Python).

Dos formas de empezar:
1. **Ejecutar Actors existentes** desde **Apify Store** (miles de Actors públicos; la vía más rápida).
2. **Construir tus propios Actors** y, si quieres, publicarlos y monetizarlos en el Store.

Relación con el ecosistema open source:
- **Crawlee** (`https://crawlee.dev`) es la librería open source de crawling/scraping (Node.js y Python) con autoscaling y gestión de proxies. Apify SDK se construye sobre estos cimientos; Crawlee corre localmente o en cualquier nube.
- **Fingerprint Suite**: generación/inyección de fingerprints de navegador realistas para Playwright/Puppeteer.
- **impit**: cliente HTTP en Rust con impersonación de navegador (bindings Node.js, Python, CLI).
- **proxy-chain**: servidor proxy Node.js con SSL, autenticación y encadenamiento de proxies upstream.

---

## 2. Mapa de la documentación oficial (para navegación y citación)

La documentación se divide en grandes bloques. Conocer esta estructura permite localizar cualquier detalle:

- **Platform** (`/platform`): Console, Actors, Schedules, Storage, Proxy, Integrations, Collaboration, Monitoring, Security, Limits.
- **API** (`/api`):
  - **Reference v2** (`/api/v2`): endpoints REST.
  - **Client for JavaScript** (`/api/client/js/docs`).
  - **Client for Python** (`/api/client/python/docs`).
- **SDK** (`/sdk`):
  - **SDK for JavaScript** (`/sdk/js/docs/overview`).
  - **SDK for Python** (`/sdk/python/docs/overview`).
- **CLI** (`/cli/docs`).
- **Academy** (`/academy`): cursos prácticos gratuitos (scraping básico/avanzado, anti-scraping, API scraping, Puppeteer/Playwright, despliegue, scraping experto, agentes de IA, marketing de Actors).
- **Open source** (`/open-source`): Crawlee, Fingerprint Suite, impit, MCP CLI, proxy-chain, Actor whitepaper.
- **Legal** (`/legal`): términos, política de privacidad, GDPR, uso aceptable, términos de publicación en Store, etc.

**Truco para ingestar documentación:** añade `.md` a cualquier URL de docs para obtener Markdown limpio. Usa `llms-full.txt` para todo el corpus de una sola vez.

---

## 3. Actors (el corazón de la plataforma)

### 3.1 Componentes de un Actor

Un Actor está compuesto por:

- **Dockerfile**: indica dónde está el código fuente, cómo construirlo y cómo ejecutarlo.
- **Documentación**: un `README.md`.
- **Esquemas de input y output**: describen qué input requiere el Actor y qué resultados produce.
- **Acceso al sistema de almacenamiento** integrado (datasets, key-value store, request queue).
- **Metadatos**: nombre, descripción, autor, versión.

La carpeta clave es **`.actor/`**, que contiene `actor.json` y puede referenciar el Dockerfile, README y esquemas. El esquema de input/output sirve para:
- Renderizar una **UI autogenerada** para ejecutar/testear el Actor manualmente.
- Generar **documentación de API** y ejemplos de integración.
- Facilitar la integración en flujos de automatización (Zapier, Make) con conectores inteligentes.

### 3.2 `actor.json` y definición del Actor

El archivo `.actor/actor.json` define el nombre del Actor, número de versión, build tag, y enlaces a los esquemas de input y output. Conceptos relacionados:

- **Input schema** (`.actor/INPUT_SCHEMA.json` o referenciado desde `actor.json`): valida el input y genera la UI. Tamaño máx. del esquema: **500 kB**. (El fallback a `INPUT_SCHEMA.json` sin declararlo en `actor.json` está **deprecado**.)
  - Soporta **campos secretos** (encriptados en reposo, desencriptados solo dentro del run): ideal para contraseñas y tokens.
  - Soporta **mensajes de error personalizados** para validación.
- **Dataset schema** (`.actor/dataset_schema.json`): controla estructura, validación y visualización del output (tabla "Overview" en Console). Permite **validación a nivel de campo** y **múltiples datasets**.
- **Key-value store schema**: organiza records en colecciones nombradas con validación de content type.
- **Output schema**: especifica dónde almacena resultados el Actor y cómo se muestran en Console y en el endpoint de API del run.
- **Dockerfile**: elige la imagen base según lenguaje/necesidades.
- **Dynamic Actor memory**: ajusta automáticamente la memoria según el tamaño del input y opciones del run.

### 3.3 Tipos de imágenes base (Docker)

Apify ofrece imágenes base oficiales según el escenario:
- Node.js puro.
- Node.js + Puppeteer + Chrome (`apify/actor-node-puppeteer-chrome`).
- Node.js + Playwright (Chrome/Firefox/WebKit).
- Python (con soporte para Scrapy, Selenium, Playwright, BeautifulSoup/HTTPX, Parsel/Impit).

### 3.4 Builds y Runs

- **Build**: proceso que crea la **imagen Docker** del Actor a partir del código. Tiene número de build y versionado. Hay caché de capas Docker para acelerar builds.
- **Run**: una **ejecución única** del Actor con un input específico, dentro de un contenedor Docker.
  - El run recibe el input vía el record **`INPUT`** de su **key-value store por defecto**.
  - Se inyectan **variables de entorno** al run.
  - Tiene **timeout** (en segundos) para evitar runs infinitos; el valor por defecto depende del template.
  - Estados del run (ciclo de vida): típicamente `READY` → `RUNNING` → `SUCCEEDED` / `FAILED` / `TIMED-OUT` / `ABORTED`.
  - **Resurrect**: relanzar un run finalizado (útil para reintentar solo lo que falló).
  - **Reboot**: reiniciar un run.
- **State persistence**: mantener el estado del Actor para sobrevivir a reinicios/migraciones inesperadas sin perder progreso. Crítico para scrapers de larga duración.

### 3.5 Interfaz de programación del Actor (Apify SDK)

Comandos y features fundamentales que ofrece el SDK:

- **Comandos básicos**: inicializar el Actor (`Actor.init()` / `async with Actor:`), leer/escribir storage, salir limpiamente (`Actor.exit()`).
- **Variables de entorno del Actor**: contexto pre-definido (p. ej. `APIFY_IS_AT_HOME` = "1" cuando corre en plataforma; IDs de storages por defecto; token; etc.). Prefijos `ACTOR_` y `APIFY_`.
- **System events**: la plataforma notifica al Actor eventos como **migración**, **abort**, **CPU overload**; el código puede manejarlos.
- **Metamorph**: transforma un run en un run de **otro Actor** con nuevo input, preservando los storages por defecto. Permite encadenar Actors de forma fluida.
- **Standby mode**: el Actor mantiene un **servidor HTTP persistente** en segundo plano para responder peticiones en tiempo real **sin cold start** en cada llamada. Ideal para exponer un Actor como API de baja latencia.
- **Container web server**: ejecutar un servidor web dentro del Actor que expone una URL única para acceso HTTP externo (UI o API).
- **Status messages**: mensajes de estado personalizados para informar del progreso al usuario.
- **ChargingManager** (JS): gestiona el cobro pay-per-event.

### 3.6 Comandos del SDK — comparativa JS / Python

| Acción | JavaScript (`apify`) | Python (`apify`) |
|---|---|---|
| Inicializar | `await Actor.init()` | `async with Actor:` |
| Leer input | `await Actor.getInput()` | `await Actor.get_input()` |
| Guardar valor en KV store | `await Actor.setValue(key, val)` | `await Actor.set_value(key, val)` |
| Leer valor de KV store | `await Actor.getValue(key)` | `await Actor.get_value(key)` |
| Añadir item(s) a dataset | `await Actor.pushData(item)` | `await Actor.push_data(item)` |
| Abrir dataset nombrado | `await Actor.openDataset('name')` | `await Actor.open_dataset(name='name')` |
| Crear config de proxy | `await Actor.createProxyConfiguration()` | `await Actor.create_proxy_configuration()` |
| Salir | `await Actor.exit()` | (al salir del `async with`) |

> **Importante (JS):** usa siempre `await` con `pushData()` para garantizar que el guardado termina antes de que el proceso del Actor finalice.

Ejemplo mínimo (JS):
```js
import { Actor } from 'apify';

await Actor.init();
const input = await Actor.getInput();
// ... lógica de scraping ...
await Actor.pushData({ foo: 'bar' });
await Actor.exit();
```

Ejemplo mínimo (Python):
```python
from apify import Actor

async def main():
    async with Actor:
        actor_input = await Actor.get_input()
        # ... lógica de scraping ...
        await Actor.push_data({'foo': 'bar'})
```

### 3.7 Desarrollo, despliegue y CI

- **Quick start**: crear el primer Actor con el **Web IDE** en Apify Console o **localmente con la Apify CLI**, partiendo de **templates** listos.
- **Build con IA**: se pueden crear/mejorar Actors usando herramientas de coding con IA, aportando el contexto correcto, prompts, Agent Skills y el **Apify MCP server**.
- **Desarrollo local**: con la CLI se crea el Actor, se configura input y storage, y se despliega.
- **Despliegue**: vía Apify CLI (`apify push`) o desde Console; se pueden disparar builds nuevos desde un **repositorio Git**.
- **Source types**: Web IDE, repositorio Git, archivo Zip, GitHub Gist.
- **CI/CD**: builds, despliegues y tests automatizados con **GitHub Actions, Bitbucket Pipelines, webhooks** o llamadas directas a la API.
- **Tests automatizados**: configurables con el **Actor Testing Actor**.
- **Performance**: optimizar con batch jobs, caché de capas Docker y uso eficiente de recursos para reducir costes.
- **Permissions**: declarar y gestionar permisos del Actor (modelo de **permisos limitados** con guía de migración mediante el SDK más reciente).

### 3.8 Ejecución de Actors (Running)

Vías de ejecución: **Apify Console (botón Start)**, **API**, **CLI**, **scheduler**, e **integraciones**.

- **Actors in Store**: explora `https://apify.com/store`, filtra por categoría o modelo de pricing.
- **Input y output**: configurable en Console, localmente o vía API. El input puede incluir **run options**: `build`, `timeout`, `memory`.
- **Tasks (tareas)**: configuraciones **reutilizables y guardadas** de un Actor para un caso concreto. Se ejecutan en schedule, vía API o desde Console. Útiles cuando ejecutas el mismo Actor con inputs distintos repetidamente.
- **Usage and resources**: memoria y CPU. La **CPU se asigna proporcionalmente a la memoria** (Docker resources). Más memoria = más CPU = más rápido (pero más coste).
- **Runs and builds**: ciclo de vida, tagging de versión, asignación de storage, opciones de compartición, retención de datos.

### 3.9 Publicación y monetización

- **Publicar**: completar descripción, README y campos de display; publicar para hacerlo público en el Store.
- **Modelos de monetización**:
  - **Pay-per-event (PPE)**: cobrar por acciones concretas (arranque del Actor, items de dataset, llamadas API). Es el modelo más flexible.
  - **Rental (alquiler)**: prueba gratuita + tarifa mensual plana.
  - **Pay-per-result (price per dataset item)**: cobrar por item de dataset producido.
  - **Free**: gratuito.
- **Actor quality score** (0–100): refleja fiabilidad, facilidad de uso y popularidad; influye en la visibilidad en el Store.
- **Status badge**: badge embebible en el README mostrando estado y uso.
- **Testing automatizado / QA**: el sistema de Apify testea Actors; pueden marcarse como "under maintenance" o "deprecated".

---

## 4. Storage (almacenamiento)

Tres tipos de storage, cada uno con su propósito. Cada run obtiene por defecto **un dataset** y **un key-value store** (y puede usar request queues).

### 4.1 Conceptos transversales

- **Storages nombrados vs sin nombrar**:
  - **Nombrados**: se retienen **indefinidamente**.
  - **Sin nombrar (unnamed)**: expiran tras **7 días** salvo configuración distinta.
- **Formato de ID**: `{ID}` o `username~store-name`. Si usas el formato `username~store-name` necesitas tu **API token**.
- **Autenticación**: preferir el header `Authorization: Bearer <TOKEN>` antes que el token en la URL.
- **Compartición entre runs**: cualquier run/task puede acceder a un storage si conoce su **nombre o ID** (`Actor.openDataset('name')`, etc.).
- **Pre-signed URLs**: URLs temporales para compartir records concretos cuando el acceso está restringido.

### 4.2 Dataset

- Almacenamiento **secuencial y append-only**: los datos solo se añaden; **no se modifican ni borran** una vez guardados.
- Cada objeto es una **fila**; sus atributos son **columnas**. Pensado para resultados de scraping/crawling/procesamiento.
- **Formatos de exportación**: `JSON`, `JSONL`, `CSV`, `XML`, `XLSX` (Excel), `HTML Table`, `RSS`.
- Acceso: Console, API, clientes (JS/Python), SDKs.
- **Endpoints API clave**:
  - `GET https://api.apify.com/v2/datasets` — listar datasets.
  - `GET https://api.apify.com/v2/datasets/{DATASET_ID}` — info del dataset.
  - `GET https://api.apify.com/v2/datasets/{DATASET_ID}/items` — obtener items.
  - `POST https://api.apify.com/v2/datasets/{DATASET_ID}/items` — añadir items (payload JSON array).
- **Parámetros de consulta útiles**: `format` (json por defecto), `fields` (incluir campos, separados por coma URL-encoded `%2C`), `omit` (excluir campos; si coincide con `fields`, **`omit` tiene prioridad**), `clean=1`/`skipHidden=1`, `xmlRoot`, `xmlRow`.
- **Campos ocultos**: los que empiezan por `#` se consideran ocultos (p. ej. `#error`, `#response`). Se excluyen con `clean=1` o `skipHidden=1`. Útiles para debug.
- **Formato XML/RSS**: las propiedades se convierten en tags; la propiedad `@` se exporta como atributos del elemento padre, y `#` aporta el valor cuando no hay hijos.
- **Límites del dataset**:
  - Formatos tabulares (HTML, CSV, EXCEL): máx. **3000 columnas**.
  - `pushData()`: objetos JSON < **9 MB** cada uno (sin límite en el tamaño total del array).
  - Nombre de dataset: máx. **63 caracteres**.
- **Rate limiting**:
  - Push de items vía API: **400 req/s** por dataset.
  - Resto de endpoints de dataset: **60 req/s** por dataset.

Métodos del SDK destacados: `pushData()`, `getData()`, `map()`, `reduce()` (y `forEach`). Ubicación local: `{APIFY_LOCAL_STORAGE_DIR}/datasets/{DATASET_ID}/{INDEX}.json`.

### 4.3 Key-value store (KV store)

- Almacena **datos no estructurados / sin relación**: JSON, imágenes, texto, binarios, resultados de run, screenshots, etc.
- Modelo **clave → valor** (con content type por record).
- El **input del Actor** se entrega como el record **`INPUT`** del KV store por defecto.
- Endpoints API: get/put/delete de records, listar keys, descargar todos los records como ZIP, comprobar si un record existe (HEAD).
- SDK: `Actor.setValue()`, `Actor.getValue()`, `Actor.getInput()`. Ubicación local bajo `{APIFY_LOCAL_STORAGE_DIR}/key_value_stores/...`.

### 4.4 Request queue

- **Cola de URLs/requests** que el Actor debe visitar; soporta **deep crawling** y se puede **compartir entre runs**.
- Operaciones: añadir request(s) (incluso en **batch**), obtener head (primeras requests), **lock** y **prolongar/borrar lock** de requests (para procesamiento concurrente seguro), marcar como handled, listar, borrar.
- Pensada para coordinar crawlers distribuidos sin reprocesar URLs.

### 4.5 Storage usage (resumen operativo)

Datasets, KV stores y request queues comparten conceptos de **retención** (nombrados vs sin nombrar), **rate limiting** y **compartición segura** (access rights, link sharing, pre-signed URLs).

---

## 5. Proxy

**Apify Proxy** cambia tu dirección IP al hacer scraping para reducir bloqueos por geolocalización o por reputación de IP. Monitoriza la salud del pool y **rota IPs de forma inteligente**.

### 5.1 Tipos de proxy

- **Datacenter proxy**: el más **rápido y barato**; IPs de datacenter. Mayor riesgo de bloqueo por actividad compartida con otros usuarios.
- **Residential proxy**: IPs de hogares/oficinas reales; **los menos propensos a bloqueo**; mayor anonimato y pool más amplio.
- **Google SERP proxy**: para recolectar resultados de Google Search (SERPs) con selección de país/idioma (resultados localizados).

### 5.2 Uso

- Configuración por **protocolo HTTP proxy** (username, password, hostname, port). Password y settings en la página **Proxy** de Console.
- **SDK** (recomendado): pocas líneas.
  - JS: `const proxyConfiguration = await Actor.createProxyConfiguration();` y pasarlo al crawler de Crawlee (`PuppeteerCrawler`, `PlaywrightCrawler`, `CheerioCrawler`, etc.).
  - Python: `proxy_configuration = await Actor.create_proxy_configuration()` → `proxy_url = await proxy_configuration.new_url()`.
- **Proxies propios**: puedes añadir tus URLs de proxy a los runs en Console o configurarlas en el SDK (`ProxyConfiguration`).
- **Rotación de sesiones**: combinar con **Session Management** del SDK para filtrar IPs bloqueadas y mantener sesiones coherentes.

Ejemplo (Python + requests):
```python
proxy_configuration = await Actor.create_proxy_configuration()
proxy_url = await proxy_configuration.new_url()
proxies = {'http': proxy_url, 'https': proxy_url}
response = requests.get('https://api.apify.com/v2/browser-info', proxies=proxies)
```

---

## 6. Schedules (programación)

- Inician **Actors y tasks automáticamente** en momentos definidos.
- Usan **expresiones cron**.
- Gestión desde Console o vía API (crear/listar/actualizar/borrar schedule, ver schedule log).
- Acciones programables: **run Actor** o **run Actor task**.

---

## 7. Integrations (integraciones)

Apify se conecta a servicios externos, data pipelines y flujos de automatización mediante **API, webhooks e integraciones de terceros**.

### 7.1 Webhooks

- Envían una petición **HTTP POST** cuando un run de Actor/task alcanza cierto estado.
- **Tipos de evento**: creación del run, éxito (`SUCCEEDED`), fallo (`FAILED`), terminación (`ABORTED`), timeout (`TIMED-OUT`).
- **Webhook actions**: el POST usa **payload templates** para inyectar datos dinámicos del run.
- **Ad-hoc webhooks**: webhooks de un solo uso para runs lanzados vía API o desde el código del Actor.
- **Idempotency key** y **dispatches** (registro de envíos) disponibles.
- Caso típico: crear un issue en GitHub o enviar alerta a Slack cuando un run falla; encadenar otro Actor cuando un run termina.

### 7.2 Integración con Actors entre sí

- **Integrating Actors via API**: conectar Actors/tasks usando webhooks; configurar campos para mostrar integraciones en Console.
- **Creating integration Actors**: Actors diseñados para funcionar como integraciones (manejan input dinámico, payload fields, datasets grandes).

### 7.3 Conectores de automatización y datos (selección)

- **Automatización no-code/low-code**: Make, Zapier, n8n, Activepieces, IFTTT, Gumloop, Windmill, Workato, Kestra, Bubble, Keboola, Airbyte.
- **Almacenamiento/colaboración**: Google Drive, Airtable, Gmail, Slack, Telegram (vía Zapier), GitHub.
- **Bases de datos vectoriales (RAG)**: Pinecone, Qdrant, Milvus.
- **Frameworks/IA** (ver sección 9): LangChain, LlamaIndex, Haystack, CrewAI, Flowise, Langflow, LangGraph, Agno, Mastra, Lindy, Dify, Google ADK, OpenAI Agents SDK, OpenAI Assistants, Amazon Bedrock, Vercel AI SDK, ChatGPT.

### 7.4 API integration (resumen)

Todo se controla por **REST API**. Recomendado usar los **clientes oficiales** (`apify-client` JS/Python) que implementan **backoff exponencial y rate limiting**. Autenticación con **token secreto** (página **API & Integrations** en Console). Reglas de oro: nunca compartir el token, no usar el mismo token para varios servicios, no usarlo en código client-side sin entender las consecuencias.

---

## 8. API REST de Apify (v2)

### 8.1 Fundamentos

- Base URL: `https://api.apify.com/v2`.
- **RESTful**, URLs orientadas a recursos, respuestas **JSON (UTF-8)**, códigos HTTP estándar, verbos estándar.
- Esquema **OpenAPI** descargable (YAML/JSON); código fuente en GitHub.
- Autenticación: token vía header `Authorization: Bearer <TOKEN>` (preferido) o query `?token=`.
- **Rate limiting** con backoff; ver `/api/v2#rate-limiting`.

### 8.2 Ejecutar un Actor: síncrono vs asíncrono

Regla práctica: si un run típico dura **≤ 5 minutos**, llámalo **síncrono**; si dura **más de 5 minutos**, llámalo **asíncrono** (y recoge resultados después, p. ej. vía webhook o polling).

**Endpoints de ejecución de Actor** (patrón `acts/{actorId}` con `~` en vez de `/`, p. ej. `compass~crawler-google-places`):

- Asíncrono (devuelve sin esperar): `POST /v2/acts/{actorId}/runs`
- Síncrono y devuelve output: `POST /v2/acts/{actorId}/run-sync`
- Síncrono y devuelve **items del dataset**: `POST /v2/acts/{actorId}/run-sync-get-dataset-items`
- Variantes GET equivalentes (sin input o con input mínimo).
- Último run: grupo de endpoints `acts/{actorId}/runs/last/...`.

Ejemplo cURL (síncrono, devuelve items del dataset):
```bash
echo '{ "searchStringsArray": ["Apify"] }' | curl -X POST -d @- \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <YOUR_API_TOKEN>' \
  -L 'https://api.apify.com/v2/acts/compass~crawler-google-places/run-sync-get-dataset-items'
```

Ejemplo arranque asíncrono (con token en URL):
```
https://api.apify.com/v2/acts/compass~crawler-google-places/runs?token=<YOUR_API_TOKEN>
```
El input va como **payload JSON** del POST; opciones extra (memory, build, timeout) como **query params**.

### 8.3 Grupos de endpoints principales

- **Actors**: crear/listar/obtener/actualizar/borrar Actors; versiones; variables de entorno; builds; runs; webhooks del Actor.
- **Actor builds**: build, abort, get, delete, log, OpenAPI definition, lista de builds.
- **Actor runs**: run, abort, delete, get, **metamorph**, **reboot**, **resurrect**, update (status message + nivel de acceso), lista de runs.
- **Actor tasks**: crear/obtener/actualizar/borrar tasks; get/update input; run (sync/async, con/ sin dataset items); listar runs; último run; webhooks.
- **Storage / Datasets**: CRUD de datasets; items (get/head/post); estadísticas; update.
- **Storage / Key-value stores**: CRUD de stores; records (get/put/post/delete/head); listar keys; descargar records (ZIP).
- **Storage / Request queues**: CRUD de colas; requests (add/get/update/delete, batch add/delete); head; head-and-lock; locks (put/delete); unlock; list.
- **Schedules**: CRUD; schedule log.
- **Webhooks** y **Webhook dispatches**: CRUD; test; dispatches y colección de dispatches.
- **Logs**: obtener logs de un build o run (`/v2/logs/...` o `actor-build-log-get`).
- **Store**: listar Actors públicos del Store (`GET /v2/store`, con `search`, etc.).
- **Users**: datos públicos de usuario; datos privados (`users/me`); **limits** (get/put); **monthly usage**.
- **Tools**: `browser-info` (IP/cabeceras del cliente), **encode-and-sign** y **decode-and-verify** objetos (firma con HMAC para webhooks/integraciones seguras).
- **Pay-per-event**: `post-charge-run` para cobrar eventos en runs de Actors PPE.

---

## 9. Integración con IA y agentes — Apify MCP Server

Apify expone un **servidor MCP (Model Context Protocol)** en **`mcp.apify.com`** que permite a aplicaciones y agentes de IA interactuar con la plataforma.

### 9.1 Qué permite

- **Descubrir y ejecutar Actors** del Apify Store.
- **Acceder a storages y resultados**.
- Dar a asistentes de coding acceso a la **documentación y tutoriales** de Apify.

### 9.2 Requisitos para conectar IA a Apify

1. **Cuenta de Apify** (hay registro gratuito).
2. **Token de API de Apify** (desde **API & Integrations** en Console). Autoriza al MCP a ejecutar Actors en tu nombre; mantenerlo seguro.
3. **Cliente MCP**: un agente/cliente que soporte MCP — p. ej. **Claude Desktop**, una extensión de **VS Code** con soporte MCP, o cualquier app que implemente la especificación MCP.

### 9.3 Categorías de tools y descubrimiento dinámico

- Con la categoría de tools **`actors`**, los clientes que soportan **descubrimiento dinámico de tools** (p. ej. Claude.ai web y VS Code) reciben automáticamente la tool **`add-actor`** en lugar de `call-actor`, para mejor descubrimiento de Actors.

### 9.4 Pagos agénticos (agentic payments)

El MCP soporta que agentes de IA paguen runs de Actors **sin necesidad de token de API de Apify**, mediante:
- **x402**: pagos on-chain directos en **USDC sobre la blockchain Base** (estándar abierto x402).
- **Skyfire**: tokens de pago gestionados a través de la plataforma Skyfire.

### 9.5 Frameworks de IA soportados

Apify mantiene integraciones documentadas con: **LangChain, LlamaIndex, Haystack, CrewAI, LangGraph, Flowise, Langflow, Agno, Mastra, Lindy, Dify, Google ADK, OpenAI Agents SDK, OpenAI Assistants, Amazon Bedrock Agents, Vercel AI SDK, ChatGPT**. Casos de uso típicos: alimentar bases vectoriales y LLMs con datos web crawleados, construir agentes que buscan/extraen/analizan datos en tiempo real, y RAG con el Actor **RAG Web Browser** o **Website Content Crawler**.

> El MCP recopila telemetría sobre llamadas a tools y clientes MCP para mejorar el servicio.

---

## 10. Clientes oficiales de la API

Dos paquetes `apify-client` (JS y Python). Implementan **reintentos automáticos con backoff exponencial**, manejo de **rate limiting**, paginación y conversión de tipos. Sus funciones se corresponden 1:1 con los endpoints de la API.

### 10.1 Patrón de uso (resource client vs collection client)

- **Collection client** (p. ej. `client.datasets()`, `client.actors()`): operar sobre la colección (listar, crear).
- **Resource/single client** (p. ej. `client.dataset(id)`, `client.actor(id)`, `client.run(id)`): operar sobre un recurso concreto.
- **Nested clients**: gestionar recursos relacionados sin construir endpoints a mano (p. ej. los runs de un Actor).

### 10.2 JavaScript (`apify-client`)

```js
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: 'YOUR_API_TOKEN' });

const input = { queries: 'Food in NYC' };

// .call() espera (smart polling) hasta que el run termina
const run = await client.actor('apify/google-search-scraper').call(input);

// Recuperar resultados del dataset del run
const { items } = await client.dataset(run.defaultDatasetId).listItems();
items.forEach((item) => console.dir(item));
```

- **Convenience functions**: `call()`, `waitForFinish()`.
- **Pagination**: paginar grandes resultados; iteración async.
- **Error handling**: lanza `ApifyApiError` en respuestas de error; `InvalidResponseBodyError` para JSON parcial; reintentos configurables.
- **Entornos bundled**: funciona en navegador, Cloudflare Workers y edge runtimes.
- **Clases principales**: `ApifyClient`, `ActorClient`, `RunClient`, `DatasetClient`, `KeyValueStoreClient`, `RequestQueueClient`, `TaskClient`, `ScheduleClient`, `WebhookClient`, `LogClient`, `StoreCollectionClient`, etc.

### 10.3 Python (`apify-client`)

```python
from apify_client import ApifyClient

client = ApifyClient('YOUR_API_TOKEN')

run_input = {'queries': 'Food in NYC'}

# .call() espera hasta que el run termina
run = client.actor('apify/google-search-scraper').call(run_input=run_input)

# Recuperar items del dataset
items = client.dataset(run['defaultDatasetId']).list_items().items
print(items)
```

- **Async**: `ApifyClientAsync` con `async/await` para operaciones no bloqueantes.
- **Convenience methods**, **retries** automáticos (errores de red, rate limit), **pagination** (`ListPage`), **streaming** de recursos grandes (dataset items, KV records, logs).
- **Logging**: logger `apify_client` configurable para debug.
- **Integración con Pandas**: cargar dataset items directamente en un DataFrame.
- **Tasks**: crear varias tasks con inputs distintos para reutilización.
- Enums útiles: `ActorJobStatus`, `ActorExitCodes`, `ActorPermissionLevel`, `WebhookEventType`, `ApifyEnvVars`, `ActorEnvVars`, `StorageGeneralAccess`, `RunGeneralAccess`, `MetaOrigin`.

---

## 11. SDKs (para construir Actors)

Los **SDKs** (no confundir con los **clientes de API**) son las librerías para **escribir el código del Actor** que corre dentro de la plataforma.

### 11.1 SDK for JavaScript (`apify`)

Se apoya en **Crawlee** para crawling/scraping. Conceptos clave:

- **Actor lifecycle**: `Actor.init()` → lógica → `Actor.exit()`; el objeto `Actor` o helpers estáticos.
- **Result storage**: `Dataset` (`pushData`, `getData`, `map`, `reduce`), `KeyValueStore`.
- **Request storage**: `RequestQueue` (deep crawling).
- **Proxy Management**: `ProxyConfiguration` / `Actor.createProxyConfiguration()`.
- **Session Management**: `SessionPool` para rotación de sesiones/IPs.
- **Environment variables**: lista expuesta al usuario.
- **Pay-per-event**: `ChargingManager` / `Actor.charge()`.
- **Docker images**: imágenes oficiales para distintos crawlers.
- **TypeScript**: tipado de las APIs públicas.
- Clases: `Actor`, `Dataset`, `KeyValueStore`, `RequestQueue`, `ProxyConfiguration`, `Configuration`, `PlatformEventManager`, `Log`.

Crawlers de Crawlee usables: `BasicCrawler`, `CheerioCrawler` (HTTP + parsing), `PuppeteerCrawler`, `PlaywrightCrawler` (navegador headless). Helper `enqueueLinks()` para añadir enlaces a la cola (con `pseudoUrls`/`globs` para filtrar).

### 11.2 SDK for Python (`apify`)

- **Actor lifecycle**: `async with Actor:`.
- **Actor input**: desde el record input del KV store por defecto.
- **Storages**: `Actor.open_dataset()`, `Actor.open_key_value_store()`, `Actor.open_request_queue()`.
- **Actor events & state persistence**: manejar eventos del sistema y persistir estado.
- **Proxy management**: `Actor.create_proxy_configuration()`.
- **Webhooks**: crear webhooks desde el código.
- **Interacting with other Actors**: llamar otros Actors/tasks, metamorph.
- **Pay-per-event**: monetización por evento.
- **Accessing Apify API**: usar el client para lo que el SDK no cubre.
- **Running a webserver** dentro del Actor.
- **Frameworks soportados en guías**: Crawlee, BeautifulSoup + HTTPX, Parsel + Impit, Playwright, Selenium, **Scrapy**.

---

## 12. CLI de Apify

Herramienta de línea de comandos para controlar la plataforma desde terminal/scripts. Flujo típico de desarrollo local:

```bash
# Crear un Actor desde template
apify create my-actor

# Ejecutar localmente (inyecta env vars y storage local)
apify run

# Iniciar sesión con tu token
apify login

# Desplegar y construir en la plataforma
apify push
```

- En local, inputs/outputs viven en el filesystem (carpeta `storage/`); en plataforma, vía API REST y env vars inyectadas automáticamente.
- `APIFY_LOCAL_STORAGE_DIR` define la ruta de storage local.

---

## 13. Colaboración, Console, Monitoring, Security y Limits

### 13.1 Apify Console

- Registro/login por email, Google o GitHub. **Two-factor authentication** con app autenticadora.
- **Billing**: facturas, uso del ciclo, suscripciones, límites, histórico.
- **Account settings**: integraciones, organizaciones, notificaciones.
- **Apify Store**: explorar/filtrar Actors; ejecutarlos o guardar settings (tasks).

### 13.2 Collaboration

- **Access rights**: permisos sobre recursos privados (Actors, runs, storages): leer, ejecutar, modificar, construir versiones.
- **General resource access**: control de compartición (acceso por ID abierto vs restringido; link sharing; pre-signed URLs).
- **List of permissions**: catálogo completo de permisos.
- **Organization account**: cuenta especializada para equipos; invitar miembros, asignar roles; convertir cuenta existente o crear una nueva; gestionar vía Console o API.

### 13.3 Monitoring

- Verificar que Actors/tasks rinden como se espera y devuelven datos correctos.
- **Alertas** cuando los jobs o sus métricas no alcanzan umbrales (p. ej. validación de calidad de datos).

### 13.4 Security

- Prácticas de seguridad y protección de datos para Actors, sus datos y la plataforma. Trust Center en `https://trust.apify.com`.
- **Secret input** (encriptado en reposo) y **encode-and-sign** para integraciones firmadas.

### 13.5 Limits

- Límites por defecto por **tier de plan**: memoria máxima, tamaño de disco, número de Actors y tasks por usuario, concurrencia, etc.
- Consultables/ajustables vía API (`users/me/limits`) y en la página **Limits** de Console.
- Verifica valores concretos en `https://docs.apify.com/platform/limits` (cambian por plan).

---

## 14. Anti-scraping (resumen del Academy — muy relevante para scraping robusto)

### 14.1 Técnicas de bloqueo que usan los sitios

- **Fingerprinting** del navegador (rastreo por características del cliente).
- **Browser challenges** (p. ej. challenge de Cloudflare).
- **CAPTCHAs**.
- **Rate-limiting** por IP.
- **Geolocalización** (bloqueo por país).
- **Firewalls de aplicación web (WAF)**.

### 14.2 Mitigación

- **Proxies** (datacenter/residential) y **rotación de IPs/sesiones**.
- **Generación de fingerprints** realistas (Fingerprint Suite) e inyección en Playwright/Puppeteer.
- **SessionPool** para descartar IPs bloqueadas.
- Imitar comportamiento humano (delays, headers/cookies/tokens correctos).
- Para APIs: localizar endpoints, manejar paginación, cabeceras, cookies y tokens; GraphQL (introspection, custom queries, modificar variables).

---

## 15. Patrones de uso end-to-end (recetas)

### 15.1 Ejecutar un Actor del Store y recoger datos (Python, async)

```python
from apify_client import ApifyClient

client = ApifyClient('YOUR_API_TOKEN')

run = client.actor('compass/crawler-google-places').call(
    run_input={'queries': 'apify'}
)

items = client.dataset(run['defaultDatasetId']).list_items().items
for item in items:
    print(item)
```

### 15.2 Ejecutar síncrono y obtener items directamente (cURL)

```bash
curl -X POST \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <YOUR_API_TOKEN>' \
  -d '{ "queries": "Food in NYC" }' \
  'https://api.apify.com/v2/acts/apify~google-search-scraper/run-sync-get-dataset-items'
```

### 15.3 Encadenar Actors con metamorph (dentro del código del Actor)

```js
import { Actor } from 'apify';
await Actor.init();
// Transforma este run en otro Actor con nuevo input, conservando storages
await Actor.metamorph('apify/other-actor', { someNewInput: true });
```

### 15.4 Disparar otro Actor al terminar (webhook)

Configurar un webhook con evento `ACTOR.RUN.SUCCEEDED` que haga POST a un endpoint o al endpoint de run de otro Actor, usando un **payload template** con `{{resource.defaultDatasetId}}`, etc.

### 15.5 Exponer un Actor como API de baja latencia (Standby)

Activar **Standby mode**: el Actor mantiene un servidor HTTP vivo y responde peticiones sin cold start. Útil para integrarlo como microservicio en tiempo real.

### 15.6 RAG / alimentar un LLM

1. Ejecutar **Website Content Crawler** o **RAG Web Browser** para obtener Markdown limpio.
2. Calcular embeddings y volcar a **Pinecone/Qdrant/Milvus**.
3. Conectar el LLM (LangChain/LlamaIndex/Haystack) o exponer todo vía **MCP** a un agente.

---

## 16. Glosario rápido

- **Actor**: programa serverless en Docker que recibe input JSON y produce output.
- **Run**: una ejecución concreta de un Actor con un input.
- **Build**: imagen Docker construida de una versión del Actor.
- **Task**: configuración guardada y reutilizable de un Actor.
- **Dataset**: almacenamiento tabular append-only para resultados.
- **Key-value store**: almacenamiento clave→valor (incluye el record `INPUT`).
- **Request queue**: cola de URLs/requests para crawling.
- **Metamorph**: convertir un run en un run de otro Actor conservando storages.
- **Standby**: Actor con servidor HTTP persistente (sin cold start).
- **Resurrect**: relanzar un run finalizado.
- **Webhook**: POST HTTP disparado por eventos de run.
- **MCP server**: `mcp.apify.com`, puente entre agentes de IA y la plataforma.
- **Apify Store**: marketplace de Actors públicos.
- **Apify Console**: interfaz web (`console.apify.com`).
- **Crawlee**: librería open source de scraping sobre la que se apoya el SDK.
- **`apify-client`**: cliente oficial de la API REST (JS/Python).
- **`apify` (SDK)**: librería para escribir el código de Actors (JS/Python).

---

## 17. Cómo profundizar (URLs canónicas)

- Documentación completa para LLMs: `https://docs.apify.com/llms-full.txt`
- Índice para LLMs: `https://docs.apify.com/llms.txt`
- Plataforma: `https://docs.apify.com/platform`
- Actors: `https://docs.apify.com/platform/actors`
- Storage: `https://docs.apify.com/platform/storage`
- Proxy: `https://docs.apify.com/platform/proxy`
- Integraciones: `https://docs.apify.com/platform/integrations`
- MCP: `https://docs.apify.com/platform/integrations/mcp`
- API v2: `https://docs.apify.com/api/v2`
- Cliente JS: `https://docs.apify.com/api/client/js/docs`
- Cliente Python: `https://docs.apify.com/api/client/python/docs`
- SDK JS: `https://docs.apify.com/sdk/js/docs/overview`
- SDK Python: `https://docs.apify.com/sdk/python/docs/overview`
- CLI: `https://docs.apify.com/cli/docs`
- Academy: `https://docs.apify.com/academy`
- Límites: `https://docs.apify.com/platform/limits`
- Pricing: `https://apify.com/pricing`

> **Recordatorio para el modelo que lea esto:** cuando un usuario pregunte por precios concretos, límites por plan, nombres exactos de Actors o features muy recientes, recupera la página `.md` correspondiente (o `llms-full.txt`) en lugar de confiar solo en este resumen, ya que esos datos cambian con el tiempo.
