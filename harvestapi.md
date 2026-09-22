# Actor: `harvestapi/linkedin-profile-scraper` — Documento Técnico para Claude Code (v2)

> **Para qué sirve este documento.** Ficha técnica del Actor de Apify **"LinkedIn Profile Scraper + Email ✅ No Cookies"** (`harvestapi/linkedin-profile-scraper`), lista para cargarse como contexto en **Claude Code** y escribir integraciones correctas sin alucinar nombres de campos, endpoints, ni estructura de output.
>
> **Cambios importantes en v2 (corregidos contra la Console real del Actor):**
> - El campo de input es **`queries`** (no `profiles`).
> - El modo "barato" se llama exactamente **`"Profile details no email ($4 per 1k)"`** (incluye "no email" y el sufijo de precio).
> - Añadida sección de **producción asíncrona + webhook** para lotes grandes.
>
> **Fuentes:** snippet oficial de la pestaña *API clients* en Apify Console, página del Actor (`https://apify.com/harvestapi/linkedin-profile-scraper`), repo open source (`https://github.com/HarvestAPI/apify-linkedin-profile`), y la referencia de la API de Apify. Verificado a mayo 2026.
>
> **Aviso:** precios, `actorId` interno y valores enum pueden variar entre builds. Para producción, valida el input schema en vivo (`/input-schema`) o haz un run de prueba con 1–2 perfiles antes de fijar literales en código.

---

## 1. Identidad del Actor

| Atributo | Valor |
|---|---|
| **Nombre legible** | LinkedIn Profile Scraper + Email ✅ No Cookies |
| **Slug público** | `harvestapi/linkedin-profile-scraper` |
| **ID en API REST (tilde)** | `harvestapi~linkedin-profile-scraper` |
| **Actor ID interno** | `LpVuK3Zozwuipa5bp` |
| **Desarrollador** | HarvestAPI |
| **Categorías** | Lead generation, Social media, Open source |
| **Repo** | `https://github.com/HarvestAPI/apify-linkedin-profile` (TypeScript/Node.js) |
| **Pricing** | **Pay-per-event (PPE)** — ~**$4 / 1.000 perfiles** o ~**$10 / 1.000** con email |
| **Auth LinkedIn** | **Ninguna** — sin cookies ni cuenta |

> **`client.actor(...)` acepta ambos identificadores** — slug (`harvestapi/linkedin-profile-scraper`) o ID interno (`LpVuK3Zozwuipa5bp`). Recomendado usar el **slug** por legibilidad.

**Qué hace:** dado un lote de identificadores de perfil de LinkedIn (usernames, URLs o IDs internos), devuelve un objeto JSON estructurado por perfil con experiencia laboral, educación, skills, certificaciones, proyectos, ubicación, métricas sociales y (opcionalmente) email validado.

**Qué NO hace:** no busca por keywords/filtros (para eso: `harvestapi/linkedin-profile-search`); no extrae emails *desde* el perfil (LinkedIn no los publica) — la búsqueda de email es un proceso independiente con validación SMTP y **no garantiza** encontrarlo en todos los casos.

---

## 2. INPUT — esquema y semántica

El Actor acepta **un objeto JSON** con dos campos relevantes: `queries` (qué scrapear) y `profileScraperMode` (con o sin email).

### 2.1 Campo `queries` (requerido) ⚠️ nombre exacto

- Tipo: **array de strings**.
- Cada elemento puede ser **cualquiera de estos tres formatos** (mezclables en el mismo array):
  1. **URL completa del perfil**: `"https://www.linkedin.com/in/williamhgates"` ← formato del ejemplo oficial.
  2. **Public identifier (username)**: `"williamhgates"`.
  3. **Profile ID interno de LinkedIn**: `"ACoAAA8BYqEBCGLg_vT_ca6mMEqkpp9nVffJ3hc"`.

> ⚠️ **No es `profiles`, es `queries`.** Aunque el README del repo hermano usa `profiles`, la Console muestra `queries` para este Actor — y el snippet de la Console es la fuente de verdad.

### 2.2 Campo `profileScraperMode` (modo) ⚠️ valores exactos

Controla el nivel de extracción y el coste:

| Valor exacto (string literal) | Qué hace | Coste |
|---|---|---|
| `"Profile details no email ($4 per 1k)"` | Detalles del perfil **sin** búsqueda de email | ~$4 / 1.000 |
| `"Profile details + email search ($10 per 1k)"` | Detalles + búsqueda+validación SMTP de email | ~$10 / 1.000 |

> Los strings llevan el sufijo de precio y "no email" / "+ email search" — cópialos literales. Si no envías el campo, suele aplicar un default (el barato), pero **explicítalo siempre** en código de producción.

### 2.3 Ejemplo de input — sin email (lo más habitual)

```json
{
  "profileScraperMode": "Profile details no email ($4 per 1k)",
  "queries": [
    "https://www.linkedin.com/in/williamhgates",
    "https://www.linkedin.com/in/towhid-rahman"
  ]
}
```

### 2.4 Ejemplo de input — con email search

```json
{
  "profileScraperMode": "Profile details + email search ($10 per 1k)",
  "queries": [
    "https://www.linkedin.com/in/williamhgates"
  ]
}
```

---

## 3. OUTPUT — estructura del dataset

Cada **item del dataset = un perfil**. Algunos campos pueden ser `null` o faltar si LinkedIn no los expone. Esta es la "fuente de verdad" para tipar/parsear.

### 3.1 Campos de nivel raíz

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | string | Profile ID interno de LinkedIn (`ACoAA...`). |
| `publicIdentifier` | string | Username público (`williamhgates`). |
| `linkedinUrl` | string | URL canónica del perfil. |
| `firstName` | string | Nombre. |
| `lastName` | string | Apellido (puede incluir sufijos: "Rahman, PharmD"). |
| `headline` | string | Titular profesional. |
| `about` | string | Texto "Acerca de" (puede contener `\n`). |
| `openToWork` | boolean | Marca "Open to work". |
| `hiring` | boolean | Marca "Hiring". |
| `photo` | string (URL) | Foto de perfil (URL firmada de `media.licdn.com` — expira). |
| `premium` | boolean | Cuenta Premium. |
| `influencer` | boolean | Estatus influencer. |
| `verified` | boolean | Perfil verificado. |
| `registeredAt` | string (ISO 8601) | Fecha de alta en LinkedIn. |
| `topSkills` | string | Skills destacadas, separadas por `•`. |
| `connectionsCount` | number | Nº de conexiones. |
| `followerCount` | number | Nº de seguidores. |
| `location` | object | Ubicación (ver 3.2). |
| `currentPosition` | array<object> | Puesto(s) actual(es); cada uno con `companyName`. |
| `experience` | array<object> | Historial laboral (ver 3.3). |
| `education` | array<object> | Formación (ver 3.4). |
| `certifications` | array<object> | Certificaciones (ver 3.5). |
| `projects` | array<object> | Proyectos (ver 3.6). |
| `email` | string \| null | **Solo en modo email search.** Email validado o `null`. |

### 3.2 Objeto `location`

```jsonc
{
  "linkedinText": "Los Angeles, California, United States",
  "countryCode": "US",
  "parsed": {
    "text": "Los Angeles, CA, United States",
    "countryCode": "US",
    "regionCode": null,
    "country": "United States",
    "countryFull": "United States of America",
    "state": "California",
    "city": "Los Angeles"
  }
}
```

### 3.3 Items de `experience[]`

| Campo | Tipo | Notas |
|---|---|---|
| `position` | string | Cargo. |
| `companyName` | string | Empresa. |
| `companyLinkedinUrl` | string | URL de la empresa (o URL de búsqueda si no hay página). |
| `companyId` | string | ID de empresa de LinkedIn (puede faltar). |
| `companyUniversalName` | string | Slug universal de la empresa (puede faltar). |
| `location` | string | Ubicación del puesto. |
| `employmentType` | string | `Full-time`, `Part-time`, `Internship`, etc. |
| `workplaceType` | string \| null | `On-site`, `Hybrid`, `Remote`. |
| `duration` | string | Texto legible ("1 yr 7 mos"). |
| `description` | string | Descripción (puede contener `\n`). |
| `skills` | array<string> | Skills asociadas al puesto. |
| `startDate` | object | `{ month?, year, text }`. |
| `endDate` | object | `{ month?, year?, text }` — `text` puede ser `"Present"`. |

### 3.4 Items de `education[]`

| Campo | Tipo |
|---|---|
| `schoolName` | string |
| `schoolLinkedinUrl` | string |
| `degree` | string |
| `fieldOfStudy` | string \| null |
| `skills` | array<string> |
| `startDate` | object `{ month?, year, text }` |
| `endDate` | object `{ month?, year, text }` |
| `period` | string ("Aug 2018 - May 2022") |

### 3.5 Items de `certifications[]`

| Campo | Tipo |
|---|---|
| `title` | string |
| `issuedAt` | string ("Issued Sep 2023") |
| `issuedBy` | string |
| `issuedByLink` | string (URL) |

### 3.6 Items de `projects[]`

| Campo | Tipo |
|---|---|
| `title` | string |
| `description` | string |
| `duration` | string |
| `startDate` | object `{ month?, year, text }` |
| `endDate` | object `{ month?, year, text }` |

### 3.7 Patrón `startDate` / `endDate`

Repetido en experience/education/projects. **No es una fecha ISO**, es un objeto:

```jsonc
{ "month": "Jan", "year": 2024, "text": "Jan 2024" }   // month opcional
{ "year": 2015, "text": "2015" }                         // sin month
{ "text": "Present" }                                    // endDate en curso
```

> Para ordenar cronológicamente, parsea `year`/`month` con fallback y trata `"Present"` como "ahora".

---

## 4. Tipos TypeScript listos para usar

```ts
// Tipos derivados del input/output reales del Actor harvestapi/linkedin-profile-scraper

export type ProfileScraperMode =
  | "Profile details no email ($4 per 1k)"
  | "Profile details + email search ($10 per 1k)";

export interface ActorInput {
  /** Array de strings: URLs de perfil, usernames o profile IDs internos. */
  queries: string[];
  /** Modo de scraping (controla coste y si se busca email). */
  profileScraperMode?: ProfileScraperMode;
}

export interface LinkedInDate {
  month?: string;       // "Jan", "Feb", ... (puede faltar)
  year?: number;        // puede faltar si text === "Present"
  text: string;         // "Jan 2024" | "2015" | "Present"
}

export interface LinkedInExperience {
  position: string;
  companyName: string;
  companyLinkedinUrl?: string;
  companyId?: string;
  companyUniversalName?: string;
  location?: string;
  employmentType?: string;
  workplaceType?: string | null;
  duration?: string;
  description?: string;
  skills?: string[];
  startDate?: LinkedInDate;
  endDate?: LinkedInDate;
}

export interface LinkedInEducation {
  schoolName: string;
  schoolLinkedinUrl?: string;
  degree?: string;
  fieldOfStudy?: string | null;
  skills?: string[];
  startDate?: LinkedInDate;
  endDate?: LinkedInDate;
  period?: string;
}

export interface LinkedInCertification {
  title: string;
  issuedAt?: string;
  issuedBy?: string;
  issuedByLink?: string;
}

export interface LinkedInProject {
  title: string;
  description?: string;
  duration?: string;
  startDate?: LinkedInDate;
  endDate?: LinkedInDate;
}

export interface LinkedInLocation {
  linkedinText?: string;
  countryCode?: string;
  parsed?: {
    text?: string;
    countryCode?: string;
    regionCode?: string | null;
    country?: string;
    countryFull?: string;
    state?: string;
    city?: string;
  };
}

export interface LinkedInProfile {
  id: string;
  publicIdentifier: string;
  linkedinUrl: string;
  firstName: string;
  lastName: string;
  headline?: string;
  about?: string;
  openToWork?: boolean;
  hiring?: boolean;
  photo?: string;
  premium?: boolean;
  influencer?: boolean;
  verified?: boolean;
  registeredAt?: string;          // ISO 8601
  topSkills?: string;
  connectionsCount?: number;
  followerCount?: number;
  location?: LinkedInLocation;
  currentPosition?: { companyName: string }[];
  experience?: LinkedInExperience[];
  education?: LinkedInEducation[];
  certifications?: LinkedInCertification[];
  projects?: LinkedInProject[];
  email?: string | null;          // solo en modo "+ email search"
}
```

---

## 5. Cómo ejecutarlo — API REST de Apify

Base: `https://api.apify.com/v2`. Autenticación con **API token** (Console → Integrations). Preferible el header `Authorization: Bearer <TOKEN>`; el `?token=` en URL funciona para webhooks/GET.

### 5.1 Endpoints relevantes

| Acción | Método | URL |
|---|---|---|
| **Run síncrono + dataset items** (lotes pequeños) | POST | `/v2/acts/harvestapi~linkedin-profile-scraper/run-sync-get-dataset-items` |
| **Run asíncrono** (lotes grandes — recomendado para producción) | POST | `/v2/acts/harvestapi~linkedin-profile-scraper/runs` |
| **Obtener run** | GET | `/v2/actor-runs/{runId}` |
| **Obtener items del dataset** | GET | `/v2/datasets/{datasetId}/items` |
| **Metadatos del Actor (incluye input schema)** | GET | `/v2/acts/harvestapi~linkedin-profile-scraper` |

> **Regla síncrono vs asíncrono:** síncrono cuando el run típico dura ≤ 5 min (lotes pequeños, < ~50 perfiles). Para más, **asíncrono + webhook**.

### 5.2 cURL síncrono

```bash
curl -X POST \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <YOUR_API_TOKEN>' \
  -d '{
    "profileScraperMode": "Profile details no email ($4 per 1k)",
    "queries": [
      "https://www.linkedin.com/in/williamhgates",
      "https://www.linkedin.com/in/towhid-rahman"
    ]
  }' \
  'https://api.apify.com/v2/acts/harvestapi~linkedin-profile-scraper/run-sync-get-dataset-items'
```

### 5.3 cURL asíncrono

```bash
curl -X POST \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <YOUR_API_TOKEN>' \
  -d '{
    "profileScraperMode": "Profile details no email ($4 per 1k)",
    "queries": ["..."]
  }' \
  'https://api.apify.com/v2/acts/harvestapi~linkedin-profile-scraper/runs'
```

Respuesta incluye `data.id` (runId) y `data.defaultDatasetId`. Recoge los items después.

---

## 6. Integración con `apify-client` (recomendado en producción)

### 6.1 JavaScript / TypeScript — síncrono (lotes pequeños)

Versión del snippet oficial de la Console, endurecida para producción:

```ts
import { ApifyClient } from 'apify-client';
import type { ActorInput, LinkedInProfile } from './types';

const client = new ApifyClient({
  token: process.env.APIFY_TOKEN!,  // nunca hardcodear
});

const input: ActorInput = {
  profileScraperMode: "Profile details no email ($4 per 1k)",
  queries: [
    "https://www.linkedin.com/in/williamhgates",
    "https://www.linkedin.com/in/towhid-rahman",
  ],
};

async function scrapeProfiles(): Promise<LinkedInProfile[]> {
  try {
    const run = await client
      .actor("harvestapi/linkedin-profile-scraper")
      .call(input);

    if (run.status !== "SUCCEEDED") {
      throw new Error(`Run finished with status ${run.status}`);
    }

    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    return items as unknown as LinkedInProfile[];
  } catch (err) {
    console.error("Apify run failed:", err);
    throw err;
  }
}

const profiles = await scrapeProfiles();
console.log(`Scraped ${profiles.length} profiles`);
```

### 6.2 Python — síncrono

```python
import os
from apify_client import ApifyClient

client = ApifyClient(os.environ["APIFY_TOKEN"])

run_input = {
    "profileScraperMode": "Profile details no email ($4 per 1k)",
    "queries": [
        "https://www.linkedin.com/in/williamhgates",
        "https://www.linkedin.com/in/towhid-rahman",
    ],
}

run = client.actor("harvestapi/linkedin-profile-scraper").call(run_input=run_input)

if run["status"] != "SUCCEEDED":
    raise RuntimeError(f"Run finished with status {run['status']}")

items = client.dataset(run["defaultDatasetId"]).list_items().items
for p in items:
    print(p.get("publicIdentifier"), p.get("headline"), p.get("email"))
```

---

## 7. Arquitectura asíncrona + webhook (producción para lotes grandes)

Para procesar **>~50 perfiles por lote** o cuando no quieres mantener un HTTP request abierto durante minutos. Es la arquitectura recomendada en producción.

### 7.1 Flujo

```
┌───────────┐   1. POST /runs (input)           ┌──────────────┐
│ Tu API    │ ───────────────────────────────►  │ Apify (Actor) │
│ /scrape   │ ◄─── runId, datasetId ─────────── │              │
└───────────┘                                   └──────┬───────┘
      ▲                                                 │
      │                                                 │ procesa
      │                                                 ▼
      │     2. POST webhook payload          ┌──────────────────┐
      │  ◄───────────────────────────────── │ run SUCCEEDED    │
      │     (eventType, resource…)          └──────────────────┘
      │
┌─────┴─────────────┐ 3. GET /datasets/{id}/items
│ Tu webhook handler │ ───────────────────────────► Apify
│ /webhooks/apify    │ ◄── perfiles JSON ──────────
└────────────────────┘
```

### 7.2 Paso 1 — Lanzar el run con webhook ad-hoc (JS)

```ts
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: process.env.APIFY_TOKEN! });

export async function startScrapeJob(queries: string[], jobId: string) {
  const run = await client
    .actor("harvestapi/linkedin-profile-scraper")
    .start(
      {
        profileScraperMode: "Profile details no email ($4 per 1k)",
        queries,
      },
      {
        webhooks: [
          {
            eventTypes: ["ACTOR.RUN.SUCCEEDED", "ACTOR.RUN.FAILED", "ACTOR.RUN.TIMED_OUT"],
            requestUrl: `${process.env.PUBLIC_URL}/webhooks/apify`,
            payloadTemplate: JSON.stringify({
              jobId,                              // tu ID interno para correlacionar
              runId: "{{resource.id}}",
              datasetId: "{{resource.defaultDatasetId}}",
              status: "{{resource.status}}",
              eventType: "{{eventType}}",
              startedAt: "{{resource.startedAt}}",
              finishedAt: "{{resource.finishedAt}}",
            }),
            // Recomendado: firma HMAC con secret compartido
            // headersTemplate puede llevar Authorization si tu webhook lo valida
          },
        ],
      },
    );

  return { runId: run.id, datasetId: run.defaultDatasetId };
}
```

> `start()` no espera, devuelve inmediatamente con `id` y `defaultDatasetId`. Guarda esos IDs en tu base de datos junto al `jobId` para correlacionar.

### 7.3 Paso 2 — Handler del webhook (Express)

```ts
import express from 'express';
import { ApifyClient } from 'apify-client';
import type { LinkedInProfile } from './types';

const app = express();
app.use(express.json());

const client = new ApifyClient({ token: process.env.APIFY_TOKEN! });

app.post('/webhooks/apify', async (req, res) => {
  // 1) Responde rápido — Apify reintenta si tardas
  res.status(200).send('ok');

  // 2) Valida (firma HMAC si la configuraste, IP, secret en header, etc.)
  const { jobId, runId, datasetId, status, eventType } = req.body;
  if (!jobId || !datasetId) return;

  try {
    if (eventType === 'ACTOR.RUN.SUCCEEDED') {
      // 3) Pagina el dataset por bloques (evita cargar todo en memoria)
      const all: LinkedInProfile[] = [];
      let offset = 0;
      const limit = 500;
      while (true) {
        const page = await client.dataset(datasetId).listItems({ offset, limit });
        all.push(...(page.items as unknown as LinkedInProfile[]));
        if (page.items.length < limit) break;
        offset += limit;
      }
      await saveProfilesForJob(jobId, all);  // tu lógica
    } else {
      await markJobFailed(jobId, status);    // FAILED / TIMED_OUT
    }
  } catch (err) {
    console.error('Webhook processing error:', err);
    await markJobErrored(jobId, String(err));
  }
});

app.listen(3000);
```

### 7.4 Notas operativas del flujo asíncrono

- **Responde 200 inmediatamente.** Apify reintenta el webhook si tu endpoint tarda demasiado o falla.
- **Idempotencia.** Usa un `Idempotency-Key` por webhook (Apify lo incluye en los headers) — guárdalo en BD y descarta duplicados.
- **Seguridad del webhook.** Configura un header secreto compartido o firma HMAC (`encode-and-sign` + `decode-and-verify` de la API) para verificar que el POST viene de Apify.
- **Paginación.** Para datasets grandes usa `{ offset, limit }` o `format=jsonl` con streaming.
- **Cancelaciones / timeouts.** Maneja `ACTOR.RUN.FAILED` y `ACTOR.RUN.TIMED_OUT`. Puedes hacer `resurrect` del run para reintentar.

---

## 8. Pricing y control de costes

- Modelo **PPE**: se cobra por **perfil scrapeado**, no por tiempo de cómputo.
- **~$4 / 1.000 perfiles** (sin email) · **~$10 / 1.000 perfiles** (con email).
- **Coste adaptativo del email:** si un perfil no es lo bastante completo para intentar email, **no se cobra** esa búsqueda. El email **no está garantizado** para todos.
- Implicaciones de ingeniería:
  - **Deduplica `queries`** antes de lanzar el run — la lista pasa tal cual, paga por cada entrada.
  - **Activa email search solo cuando lo necesites** (lead gen/recruiting), no por defecto.
  - **Pon límites de gasto** en la página *Limits* de tu cuenta Apify para evitar sustos.
  - Considera **batchear queries** (p. ej. lotes de 500 perfiles) si quieres trocear costes y tener checkpoints frecuentes vía webhook.

---

## 9. Errores comunes a evitar (checklist para Claude Code)

- [ ] El campo de input es **`queries`**, no `profiles` ni `urls`.
- [ ] `profileScraperMode` debe ser exactamente uno de los dos strings (con sufijo de precio).
- [ ] `queries` es **array de strings**, no string único ni array de objetos.
- [ ] Para llamadas REST usa el slug con `~`: `harvestapi~linkedin-profile-scraper`. Para `apify-client` usa el slug con `/`: `harvestapi/linkedin-profile-scraper`.
- [ ] Para >~50 perfiles, **asíncrono + webhook**, no `run-sync` (timeout de ~5 min).
- [ ] No asumir formato ISO en fechas de experience/education/projects — son objetos `{month?, year?, text}`.
- [ ] No asumir que `email` existe ni que es no nulo.
- [ ] Deduplicar `queries` para no pagar de más (PPE).
- [ ] Guardar `APIFY_TOKEN` en variable de entorno, nunca hardcodeado ni en client-side.
- [ ] Verificar `run.status === "SUCCEEDED"` antes de leer el dataset.
- [ ] Webhook handler: responder 200 rápido y procesar en background.
- [ ] URLs de foto (`photo`) **expiran** — descárgalas/rehospéda si necesitas conservarlas.
- [ ] Datos personales → considera GDPR/CCPA, base legal, derecho de borrado.

---

## 10. Recetas rápidas

### 10.1 Enriquecer un TXT de URLs → JSON de perfiles (Node.js, asíncrono)

```ts
import { ApifyClient } from 'apify-client';
import fs from 'node:fs';

const client = new ApifyClient({ token: process.env.APIFY_TOKEN! });

const urls = fs.readFileSync('linkedin-urls.txt', 'utf8')
  .split('\n').map(s => s.trim()).filter(Boolean);

const unique = [...new Set(urls)];  // dedupe → control de coste PPE

const run = await client.actor('harvestapi/linkedin-profile-scraper').call({
  profileScraperMode: "Profile details no email ($4 per 1k)",
  queries: unique,
});

const { items } = await client.dataset(run.defaultDatasetId).listItems();
fs.writeFileSync('profiles.json', JSON.stringify(items, null, 2));
console.log(`Saved ${items.length} profiles`);
```

### 10.2 Exportar dataset directo a CSV (API)

```
GET https://api.apify.com/v2/datasets/{DATASET_ID}/items?format=csv&clean=1
```

Formatos: `json`, `jsonl`, `csv`, `xlsx`, `xml`, `html`, `rss`. `clean=1` excluye campos ocultos (`#…`).

### 10.3 Lanzar y obtener `runId` para procesar luego

```ts
const run = await client
  .actor('harvestapi/linkedin-profile-scraper')
  .start({ profileScraperMode: "Profile details no email ($4 per 1k)", queries: [...] });

// Guarda run.id y run.defaultDatasetId en tu BD
console.log(run.id, run.defaultDatasetId);
```

---

## 11. Actors hermanos de HarvestAPI

| Caso de uso | Actor correcto |
|---|---|
| Tengo URLs/usernames/IDs y quiero detalles | **`harvestapi/linkedin-profile-scraper`** (este) |
| Buscar perfiles por filtros (título, geo, empresa) | `harvestapi/linkedin-profile-search` |
| Buscar perfiles por nombre | `harvestapi/linkedin-profile-search-by-name` |
| Empleados de una empresa | `harvestapi/linkedin-company-employees` |
| Posts de un perfil/empresa | `harvestapi/linkedin-profile-posts` |
| Comentarios de un post | `harvestapi/linkedin-post-comments` |
| Ofertas de empleo | `harvestapi/linkedin-job-search` |

---

## 12. Referencias canónicas

- Página del Actor: `https://apify.com/harvestapi/linkedin-profile-scraper`
- Input schema en vivo: `https://apify.com/harvestapi/linkedin-profile-scraper/input-schema`
- Pricing: `https://apify.com/harvestapi/linkedin-profile-scraper/pricing`
- API + ejemplos por lenguaje: `https://apify.com/harvestapi/linkedin-profile-scraper/api`
- Código fuente: `https://github.com/HarvestAPI/apify-linkedin-profile`
- Docs HarvestAPI: `https://docs.harvest-api.com`
- Apify — Run Actor (asíncrono): `https://docs.apify.com/api/v2/act-runs-post`
- Apify — Run sync + dataset items: `https://docs.apify.com/api/v2/act-run-sync-get-dataset-items-post`
- Apify — Webhooks: `https://docs.apify.com/platform/integrations/webhooks`
- Cliente JS: `https://docs.apify.com/api/client/js/docs`
- Cliente Python: `https://docs.apify.com/api/client/python/docs`

> **Recordatorio para Claude Code:** antes de fijar valores literales en producción (especialmente `profileScraperMode`), ejecuta un run de prueba con 1–2 perfiles y valida los campos reales del dataset. El esquema puede evolucionar entre builds del Actor.
