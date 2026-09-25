import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createAnthropicClient } from '@/lib/anthropic';
import { after } from 'next/server';
import { NextRequest, NextResponse } from 'next/server';
import { normalizeProfileDate } from '@/lib/profile-date';
import { findExperienciaIdByEmpresa, LOGRO_EMPRESA_RULE } from '@/lib/profile-import';

const PROVIDER_URL =
  'https://api.apify.com/v2/acts/harvestapi~linkedin-profile-scraper/run-sync-get-dataset-items';

const CACHE_TTL_DAYS = 60;

interface ExtDate {
  month?: string;
  year?: number;
  text: string;
}

interface ExtExperience {
  position: string;
  companyName: string;
  description?: string;
  skills?: string[];
  startDate?: ExtDate;
  endDate?: ExtDate;
  employmentType?: string;
  workplaceType?: string | null;
  location?: string;
}

interface ExtEducation {
  schoolName: string;
  degree?: string;
  fieldOfStudy?: string | null;
  skills?: string[];
  startDate?: ExtDate;
  endDate?: ExtDate;
  period?: string;
}

interface ExtCertification {
  title: string;
  issuedAt?: string;
  issuedBy?: string;
}

interface ExtLocation {
  linkedinText?: string;
  countryCode?: string;
  parsed?: {
    city?: string;
    country?: string;
    countryCode?: string;
    state?: string;
  };
}

interface ExtProfile {
  id?: string;
  publicIdentifier?: string;
  linkedinUrl?: string;
  firstName?: string;
  lastName?: string;
  headline?: string;
  about?: string;
  photo?: string;
  topSkills?: string | Array<string | { name?: string }>;
  skills?: Array<string | { name?: string }>;
  location?: ExtLocation;
  experience?: ExtExperience[];
  education?: ExtEducation[];
  certifications?: ExtCertification[];
  [key: string]: unknown;
}

// Bump when the structuring prompt changes: cached curated_data from an older version is
// re-structured instead of reused (v2: dates keep the month; logros report their company).
const STRUCTURED_VERSION = 2;

interface StructuredData {
  _v?:         number;
  experiencia: Array<{ empresa: string; cargo: string; fecha_inicio: string | null; fecha_fin: string | null; descripcion: string | null }>;
  educacion:   Array<{ institucion: string; titulo: string; area: string | null; fecha_inicio: string | null; fecha_fin: string | null }>;
  habilidades: Array<{ nombre: string; tipo: 'tecnica' | 'blanda' }>;
  idiomas:     Array<{ nombre: string; nivel: 'Básico' | 'Intermedio' | 'Avanzado' | 'Nativo' | null }>;
  logros:      Array<{ descripcion: string; empresa?: string | null }>;
  resumen:     string | null;
  profesion:   string | null;
  ciudad:      string | null;
  pais:        string | null;
}

function resolveSource(raw: string): string | null {
  const m = raw.match(/linkedin\.com\/in\/([a-zA-Z0-9\-_%]+)/i);
  if (!m) return null;
  return `https://www.linkedin.com/in/${m[1]}/`;
}

function consolidateSkills(profile: ExtProfile): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const push = (s: string) => {
    const key = s.toLowerCase().trim();
    if (key && !seen.has(key)) { seen.add(key); out.push(s.trim()); }
  };
  const pushEntry = (entry: string | { name?: string }) => {
    if (typeof entry === 'string') push(entry);
    else if (entry?.name) push(entry.name);
  };
  // El actor de Apify ha devuelto topSkills como string ("A • B • C") en
  // versiones anteriores y como array de objetos {name} en la actual —
  // soportamos ambas formas en vez de asumir una.
  if (typeof profile.topSkills === 'string') {
    for (const s of profile.topSkills.split('•')) push(s);
  } else if (Array.isArray(profile.topSkills)) {
    for (const entry of profile.topSkills) pushEntry(entry);
  }
  for (const entry of profile.skills ?? []) pushEntry(entry);
  for (const exp of profile.experience ?? []) {
    for (const s of exp.skills ?? []) push(s);
  }
  return out;
}

function preparePayload(profile: ExtProfile): Record<string, unknown> {
  const OMIT = new Set([
    'id', 'publicIdentifier', 'linkedinUrl', 'photo',
    'topSkills', 'skills',
    'openToWork', 'hiring', 'premium', 'influencer', 'verified',
    'registeredAt', 'connectionsCount', 'followerCount',
    'currentPosition', 'projects',
  ]);
  return Object.fromEntries(
    Object.entries(profile).filter(([k]) => !OMIT.has(k))
  );
}

const STRUCTURE_PROMPT = `Eres un experto en recursos humanos digitales. Recibes datos JSON de un perfil de LinkedIn y debes estructurarlos para un CV profesional.

Devuelve SOLAMENTE un objeto JSON válido con esta estructura (sin texto antes ni después):
{
  "experiencia": [{"empresa":"string","cargo":"string","fecha_inicio":"string|null","fecha_fin":"string|null","descripcion":"string|null"}],
  "educacion":   [{"institucion":"string","titulo":"string","area":"string|null","fecha_inicio":"string|null","fecha_fin":"string|null"}],
  "habilidades": [{"nombre":"string","tipo":"tecnica"|"blanda"}],
  "idiomas":     [{"nombre":"string","nivel":"Básico"|"Intermedio"|"Avanzado"|"Nativo"|null}],
  "logros":      [{"descripcion":"string","empresa":"string|null"}],
  "resumen":     "string|null",
  "profesion":   "string|null",
  "ciudad":      "string|null",
  "pais":        "string|null"
}

EXPERIENCIA
- Fuente: experience[]. Null/vacío → [].
- companyName → empresa. position → cargo.
- fecha_inicio: "AAAA-MM" con startDate.year y el número de mes de startDate.month (ej. "Jul" → "2021-07").
  Si no hay month → solo "AAAA". Sin año → null. NUNCA inventes el mes.
- fecha_fin: si endDate.text === "Present" → null. Si no → mismo formato con endDate. Sin año → null.
- descripcion: usa description si aporta valor real; si no → null.

EDUCACIÓN
- Fuente: education[]. Null/vacío → [].
- schoolName → institucion. degree → titulo (si falta → "Estudios universitarios"). fieldOfStudy → area.
- fecha_inicio / fecha_fin: mismo formato que en experiencia ("AAAA-MM", o "AAAA" si no hay mes). Si texto es "Present" → null.

HABILIDADES
- Fuente: el campo skills_list (array de strings inyectado en el prompt).
- Clasifica cada skill como "tecnica" o "blanda":
  · tecnica: herramientas, lenguajes, tecnologías, software, frameworks, metodologías, disciplinas técnicas.
  · blanda: habilidades interpersonales, liderazgo, comunicación, trabajo en equipo, adaptabilidad, etc.
- Devuelve todas. Si skills_list está vacío → [].

IDIOMAS
- Fuente: campo about únicamente. Extrae idiomas mencionados explícitamente.
- Nivel: native/bilingual → "Nativo", advanced → "Avanzado", intermediate → "Intermedio", basic → "Básico". Sin nivel claro → null.
- Si no se mencionan idiomas → [].

LOGROS
- Busca en experience[].description y en about logros CUANTIFICABLES y concretos.
- Fórmula para cada logro: Verbo + Resultado + Métrica + Cómo.
  Ejemplo: "Lideré el rediseño del módulo de pagos, reduciendo el tiempo de checkout en 35% mediante optimización de queries SQL"
- Solo incluye logros que tengan al menos una métrica concreta (%, cifras, tiempos, dinero, usuarios).
- Construye el logro en español con la fórmula, nunca copies la descripción literal.
${LOGRO_EMPRESA_RULE}
- Si no hay logros cuantificables detectados → [].
- certifications[] NO son logros — se gestionan en otra sección, ignóralas aquí.

RESUMEN
- Fuente: about. NUNCA lo copies literal — reescríbelo en tono profesional de CV.
- Elimina muletillas de LinkedIn ("apasionado por…", "actualmente buscando…", emojis, hashtags,
  llamados a la acción tipo "¡Conectemos!"), primera persona informal excesiva, y saltos de línea
  decorativos.
- Condensa a un párrafo de 2-4 líneas que resuma perfil, área de expertise y valor diferencial.
- REGLA ABSOLUTA (igual que el resto del sistema): no inventes logros, empresas, años de
  experiencia, tecnologías ni cifras que no estén ya en el "about" original. Reescribir el tono,
  nunca el contenido factual.
- Si "about" está vacío, es puramente decorativo (solo emojis/hashtags) o termina en "…" sin
  contenido aprovechable → null.

PROFESIÓN
- Usa headline si es un título profesional real y específico.
- Descarta genéricos: "Freelancer", "Profesional independiente", "Consultor" sin más detalle.
- Sin info útil → null.

CIUDAD
- Fuente: location.parsed.city. Solo ciudad, no región ni país.
- Si no existe → null.

PAÍS
- Fuente: location.countryCode o location.parsed.country. Convierte a nombre en español:
  VE→Venezuela, CO→Colombia, MX→México, AR→Argentina, CL→Chile, PE→Perú, EC→Ecuador,
  BO→Bolivia, UY→Uruguay, PY→Paraguay, CR→Costa Rica, PA→Panamá, GT→Guatemala, HN→Honduras,
  SV→El Salvador, NI→Nicaragua, DO→República Dominicana, CU→Cuba, PR→Puerto Rico,
  US→Estados Unidos, ES→España, GB→Reino Unido, BR→Brasil, DE→Alemania, FR→Francia,
  IT→Italia, PT→Portugal, CA→Canadá, AU→Australia.
- Sin info → null.

REGLA ABSOLUTA: Nunca inventes datos. Arrays vacíos [] y null son respuestas válidas.`;

async function structureWithAI(profile: ExtProfile): Promise<StructuredData | null> {
  const anthropic  = createAnthropicClient();
  const base       = preparePayload(profile);
  const skillsList = consolidateSkills(profile);
  const payload    = { ...base, skills_list: skillsList };

  try {
    const res = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      system: STRUCTURE_PROMPT,
      messages: [{
        role: 'user',
        content: `Convierte estos datos de LinkedIn en el JSON estructurado para CV:\n\n${JSON.stringify(payload, null, 2)}`,
      }],
    });

    console.log(`[enrich] tokens — input: ${res.usage.input_tokens}, output: ${res.usage.output_tokens}, total: ${res.usage.input_tokens + res.usage.output_tokens}`);
    const text  = res.content[0]?.type === 'text' ? res.content[0].text : '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;

    const parsed = JSON.parse(match[0]) as StructuredData;
    parsed._v = STRUCTURED_VERSION;
    parsed.experiencia = Array.isArray(parsed.experiencia) ? parsed.experiencia : [];
    parsed.educacion   = Array.isArray(parsed.educacion)   ? parsed.educacion   : [];
    parsed.habilidades = Array.isArray(parsed.habilidades) ? parsed.habilidades : [];
    parsed.idiomas     = Array.isArray(parsed.idiomas)     ? parsed.idiomas     : [];
    parsed.logros      = Array.isArray(parsed.logros)      ? parsed.logros      : [];
    return parsed;
  } catch {
    return null;
  }
}

async function uploadAvatar(
  photoUrl: string,
  userId: string,
  admin: ReturnType<typeof createAdminClient>
): Promise<string | null> {
  try {
    const res = await fetch(photoUrl, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const ext    = contentType.includes('png') ? 'png' : 'jpg';
    const buffer = Buffer.from(await res.arrayBuffer());
    const { error } = await admin.storage
      .from('avatars')
      .upload(`${userId}.${ext}`, buffer, { upsert: true, contentType });
    if (error) return null;
    return admin.storage.from('avatars').getPublicUrl(`${userId}.${ext}`).data.publicUrl;
  } catch {
    return null;
  }
}

async function fetchExtProfile(url: string): Promise<ExtProfile | null> {
  const apiKey = process.env.APIFY_TOKEN;
  if (!apiKey) return null;
  try {
    const res = await fetch(PROVIDER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        profileScraperMode: 'Profile details no email ($4 per 1k)',
        queries: [url],
      }),
      signal: AbortSignal.timeout(120_000),
    });
    if (!res.ok) return null;
    const data    = await res.json();
    const profile = Array.isArray(data) ? data[0] : null;
    if (!profile?.firstName && !profile?.publicIdentifier) return null;
    return profile as ExtProfile;
  } catch {
    return null;
  }
}

async function processProfile(
  canonicalUrl: string,
  userId: string,
  currentPhotoUrl: string | null
): Promise<{ formFields: Record<string, string>; completitudEstimada: number } | null> {
  const admin = createAdminClient();

  let rawProfile: ExtProfile | null = null;
  let structured: StructuredData | null = null;
  const { data: cached } = await admin
    .from('linkedin_profiles_cache')
    .select('raw_data, curated_data, scraped_at')
    .eq('linkedin_url', canonicalUrl)
    .single();

  if (cached?.raw_data && cached.scraped_at) {
    const ageDays = (Date.now() - new Date(cached.scraped_at).getTime()) / 86_400_000;
    if (ageDays <= CACHE_TTL_DAYS) {
      rawProfile = cached.raw_data as ExtProfile;
      const curated = cached.curated_data as StructuredData | null;
      if (curated?._v === STRUCTURED_VERSION) structured = curated;
    }
  }

  if (!rawProfile) {
    rawProfile = await fetchExtProfile(canonicalUrl);
    if (!rawProfile) return null;
    await admin.from('linkedin_profiles_cache').upsert(
      { linkedin_url: canonicalUrl, raw_data: rawProfile, scraped_at: new Date().toISOString() },
      { onConflict: 'linkedin_url' }
    );
  }

  if (!structured) {
    structured = await structureWithAI(rawProfile);
    if (!structured) return null;
    await admin.from('linkedin_profiles_cache').update({ curated_data: structured })
      .eq('linkedin_url', canonicalUrl);
  }

  const finalSkills = structured.habilidades;

  let photoUrl = currentPhotoUrl;
  if (!photoUrl && rawProfile.photo) {
    photoUrl = await uploadAvatar(rawProfile.photo, userId, admin);
  }

  const [
    { data: existing },
    { data: existingExp },
    { data: existingEdu },
    { data: existingHab },
    { data: existingIdioma },
    { data: existingLogro },
    { data: existingCert },
  ] = await Promise.all([
    admin.from('profiles').select('resumen_profesional, profesion_perfil, ciudad, pais, foto_url').eq('id', userId).single(),
    admin.from('experiencia').select('empresa, cargo').eq('user_id', userId),
    admin.from('educacion').select('institucion, titulo').eq('user_id', userId),
    admin.from('habilidades').select('nombre').eq('user_id', userId),
    admin.from('idiomas').select('nombre').eq('user_id', userId),
    admin.from('logros').select('descripcion').eq('user_id', userId),
    admin.from('certificaciones').select('titulo').eq('user_id', userId),
  ]);

  const expSet    = new Set((existingExp    ?? []).map(e => `${e.empresa?.toLowerCase().trim()}|${e.cargo?.toLowerCase().trim()}`));
  const eduSet    = new Set((existingEdu    ?? []).map(e => `${e.institucion?.toLowerCase().trim()}|${e.titulo?.toLowerCase().trim()}`));
  const habSet    = new Set((existingHab    ?? []).map(e => e.nombre?.toLowerCase().trim()));
  const idiomaSet = new Set((existingIdioma ?? []).map(e => e.nombre?.toLowerCase().trim()));
  const logroSet  = new Set((existingLogro  ?? []).map(e => e.descripcion?.toLowerCase().trim()));
  const certSet   = new Set((existingCert   ?? []).map(e => e.titulo?.toLowerCase().trim()));

  let expInserted = existingExp?.length ?? 0;
  for (const exp of structured.experiencia) {
    if (!exp.empresa?.trim() || !exp.cargo?.trim()) continue;
    const key = `${exp.empresa.toLowerCase().trim()}|${exp.cargo.toLowerCase().trim()}`;
    if (expSet.has(key)) continue;
    await admin.from('experiencia').insert({
      user_id:      userId,
      empresa:      exp.empresa.trim(),
      cargo:        exp.cargo.trim(),
      fecha_inicio: normalizeProfileDate(exp.fecha_inicio),
      fecha_fin:    normalizeProfileDate(exp.fecha_fin),
      descripcion:  exp.descripcion?.trim() || null,
    });
    expSet.add(key);
    expInserted++;
  }

  let eduInserted = existingEdu?.length ?? 0;
  for (const edu of structured.educacion) {
    if (!edu.institucion?.trim() || !edu.titulo?.trim()) continue;
    const key = `${edu.institucion.toLowerCase().trim()}|${edu.titulo.toLowerCase().trim()}`;
    if (eduSet.has(key)) continue;
    await admin.from('educacion').insert({
      user_id:      userId,
      institucion:  edu.institucion.trim(),
      titulo:       edu.titulo.trim(),
      area:         edu.area?.trim()    || null,
      fecha_inicio: normalizeProfileDate(edu.fecha_inicio),
      fecha_fin:    normalizeProfileDate(edu.fecha_fin),
    });
    eduSet.add(key);
    eduInserted++;
  }

  const VALID_TIPOS = new Set(['tecnica', 'blanda']);
  let habCount = existingHab?.length ?? 0;
  for (const hab of finalSkills) {
    if (!hab.nombre?.trim()) continue;
    const key = hab.nombre.toLowerCase().trim();
    if (habSet.has(key)) continue;
    await admin.from('habilidades').insert({
      user_id: userId,
      nombre:  hab.nombre.trim(),
      tipo:    VALID_TIPOS.has(hab.tipo) ? hab.tipo : null,
    });
    habSet.add(key);
    habCount++;
  }

  const VALID_NIVELES = new Set(['Básico', 'Intermedio', 'Avanzado', 'Nativo']);
  let idiomasInserted = existingIdioma?.length ?? 0;
  for (const idioma of structured.idiomas) {
    if (!idioma.nombre?.trim()) continue;
    const key = idioma.nombre.toLowerCase().trim();
    if (idiomaSet.has(key)) continue;
    await admin.from('idiomas').insert({
      user_id: userId,
      nombre:  idioma.nombre.trim(),
      nivel:   VALID_NIVELES.has(idioma.nivel ?? '') ? idioma.nivel : null,
    });
    idiomaSet.add(key);
    idiomasInserted++;
  }

  let logrosCount = existingLogro?.length ?? 0;
  const { data: expsForLink } = await admin.from('experiencia').select('id, empresa').eq('user_id', userId);
  for (const logro of structured.logros) {
    if (!logro.descripcion?.trim()) continue;
    const key = logro.descripcion.toLowerCase().trim();
    if (logroSet.has(key)) continue;
    await admin.from('logros').insert({
      user_id:        userId,
      descripcion:    logro.descripcion.trim(),
      experiencia_id: findExperienciaIdByEmpresa(expsForLink ?? [], logro.empresa),
    });
    logroSet.add(key);
    logrosCount++;
  }

  for (const cert of rawProfile.certifications ?? []) {
    if (!cert.title?.trim()) continue;
    const key = cert.title.toLowerCase().trim();
    if (certSet.has(key)) continue;
    const yearMatch = cert.issuedAt?.match(/\d{4}/);
    await admin.from('certificaciones').insert({
      user_id:     userId,
      titulo:      cert.title.trim(),
      institucion: cert.issuedBy?.trim() || 'Sin institución',
      anio_egreso: yearMatch ? yearMatch[0] : null,
    });
    certSet.add(key);
  }

  const profilePatch: Record<string, unknown> = { id: userId, updated_at: new Date().toISOString() };
  if (structured.resumen   && !existing?.resumen_profesional) profilePatch.resumen_profesional = structured.resumen;
  if (structured.profesion && !existing?.profesion_perfil)    profilePatch.profesion_perfil    = structured.profesion;
  if (structured.ciudad    && !existing?.ciudad)              profilePatch.ciudad              = structured.ciudad;
  if (structured.pais      && !existing?.pais)                profilePatch.pais                = structured.pais;
  if (photoUrl             && !existing?.foto_url)            profilePatch.foto_url            = photoUrl;
  if (Object.keys(profilePatch).length > 2) {
    await admin.from('profiles').upsert(profilePatch, { onConflict: 'id' });
  }

  let estimada = 0;
  if (structured.profesion) estimada += 5;
  if (photoUrl)             estimada += 5;
  estimada += Math.min(expInserted, 2) * 15;
  estimada += Math.min(eduInserted, 2) * 10;
  if (habCount       >= 6) estimada += 7; else if (habCount       >= 3) estimada += 5;
  if (logrosCount    >= 3) estimada += 8; else if (logrosCount    >= 1) estimada += 5;
  if (idiomasInserted >= 1) estimada += 5;

  const formFields: Record<string, string> = {};
  if (rawProfile.firstName?.trim())  formFields.nombre    = rawProfile.firstName.trim();
  if (rawProfile.lastName?.trim())   formFields.apellido  = rawProfile.lastName.trim();
  if (structured.profesion)          formFields.profesion = structured.profesion;
  if (structured.ciudad)             formFields.ciudad    = structured.ciudad;
  if (structured.pais)               formFields.pais      = structured.pais;
  if (photoUrl)                      formFields.foto_url  = photoUrl;

  return { formFields, completitudEstimada: Math.min(estimada, 100) };
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  let body: { uri?: string; async?: boolean };
  try { body = await request.json(); }
  catch { return NextResponse.json({ ok: false }, { status: 400 }); }

  const canonicalUrl = resolveSource(body.uri?.trim() || '');
  if (!canonicalUrl) return NextResponse.json({ ok: false });

  if (body.async === true) {
    const userId = user.id;
    after(async () => {
      try { await processProfile(canonicalUrl, userId, null); } catch { /* silent */ }
    });
    return NextResponse.json({ ok: true }, { status: 202 });
  }

  const { data: existingProfile } = await supabase
    .from('profiles').select('foto_url').eq('id', user.id).single();

  let result;
  try {
    result = await processProfile(canonicalUrl, user.id, existingProfile?.foto_url || null);
  } catch (err) {
    console.error('[hydrate] processProfile falló:', err);
    return NextResponse.json({ ok: false });
  }
  if (!result) return NextResponse.json({ ok: false });

  return NextResponse.json({ ok: true, patch: result.formFields, q: result.completitudEstimada });
}