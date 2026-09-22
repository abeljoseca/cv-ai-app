const { useState, useEffect, useRef, useMemo, useLayoutEffect } = React;

// 5 CV visual styles, rendered as React components.
// Each renders at a "page" aspect; scales via CSS transform in thumbnails.

const CV_STYLES = [
  {
    id: "harvard",
    name: "Estilo Harvard",
    tagline: "Uno de los formatos más influyentes en el mundo profesional.",
    bullets: [
      "Es limpio, altamente estructurado y enfocado en logros medibles.",
      "Cada experiencia incluye resultados concretos.",
      "Prioriza impacto sobre tareas.",
      "Máxima compatibilidad con ATS.",
    ],
    idealPara: "Consultoría · Finanzas · Roles estratégicos y analíticos · Perfiles de alto rendimiento",
    preview: "assets/cv-preview-harvard.png",
  },
  {
    id: "stanford",
    name: "Estilo Stanford",
    tagline: "Diseño moderno con personalidad, sin perder rigor profesional.",
    bullets: [
      "Acento de color que aporta carácter sin distraer.",
      "Estructura clara para destacar visión y logros.",
      "Combina narrativa con datos concretos.",
      "Buena legibilidad en pantalla y papel.",
    ],
    idealPara: "Startups · Tecnología · Innovación · Product managers, founders",
    preview: "assets/cv-preview-stanford.png",
  },
  {
    id: "europeo",
    name: "Estilo Europeo",
    tagline: "Formato Europass adaptado, ordenado y formal.",
    bullets: [
      "Estructura por columnas con foto opcional.",
      "Secciones extendidas para idiomas y formación.",
      "Compatible con instituciones públicas y becas.",
      "Tonos sobrios y tipografía neutra.",
    ],
    idealPara: "Aplicaciones en Europa · Instituciones públicas · ONG · Programas académicos o becas",
    preview: "assets/cv-preview-europeo.png",
  },
  {
    id: "siliconvalley",
    name: "Estilo Silicon Valley",
    tagline: "Moderno, técnico y orientado a impacto.",
    bullets: [
      "Diseño oscuro y compacto, alta densidad informativa.",
      "Bloques de tecnologías y stack al frente.",
      "Métricas y resultados destacados.",
      "Sección clara de proyectos y open source.",
    ],
    idealPara: "Desarrolladores · Data scientists · Ingenieros · Startups y Big Tech",
    preview: "assets/cv-preview-siliconvalley.png",
  },
  {
    id: "ejecutivo",
    name: "Estilo Ejecutivo",
    tagline: "Formato premium para roles de liderazgo y alta dirección.",
    bullets: [
      "Tipografía elegante y márgenes generosos.",
      "Énfasis en logros estratégicos y P&L.",
      "Tono sobrio, papel cálido, alta jerarquía.",
      "Pensado para perfiles con trayectoria sólida.",
    ],
    idealPara: "CEOs · Directores · Gerentes senior · Roles de liderazgo",
    preview: "assets/cv-preview-ejecutivo.png",
  },
];

function CvDocument({ style, profile, showBranding = true, editable = false, onEdit }) {
  const S = CV_STYLES_IMPL[style] || CV_STYLES_IMPL.harvard;
  return <S profile={profile} showBranding={showBranding} editable={editable} onEdit={onEdit} />;
}

// Shared style frame: 794x1123 ~= A4 at 96dpi (actual px)
const PAGE = { width: 794, minHeight: 1123, background: "#fff", position: "relative", margin: "0 auto" };

const ed = (editable, onEdit, field) => editable ? {
  contentEditable: true, suppressContentEditableWarning: true,
  onBlur: (e) => onEdit?.(field, e.currentTarget.innerText),
  style: { outline: "none" },
} : {};

// ─── Moderno: left sidebar color, right main content ──────────────────
const Moderno = ({ profile, showBranding, editable, onEdit }) => (
  <div style={{ ...PAGE, display: "flex", fontFamily: "Inter", color: "#0F172A" }}>
    <div style={{ width: 260, background: "#1A2B4C", color: "#fff", padding: "40px 28px", display: "flex", flexDirection: "column", gap: 22 }}>
      <div style={{
        width: 120, height: 120, borderRadius: "50%",
        background: profile.photo ? `url(${profile.photo}) center/cover` : "#4B6BFB",
        margin: "0 auto", border: "3px solid rgba(255,255,255,.15)",
      }} />
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.01em" }}>{profile.nombre} {profile.apellido}</div>
        <div style={{ fontSize: 13, color: "#C8D0FE", marginTop: 4 }}>{profile.profesion}</div>
      </div>
      <SidebarSection title="CONTACTO">
        <SidebarLine icon="✉" text={profile.emailCv} />
        <SidebarLine icon="☎" text={profile.telefono} />
        <SidebarLine icon="◉" text={`${profile.ciudad}, ${profile.pais}`} />
      </SidebarSection>
      <SidebarSection title="HABILIDADES">
        {profile.skillsHard.slice(0, 6).map(s => <div key={s} style={{ fontSize: 12, padding: "3px 0" }}>• {s}</div>)}
      </SidebarSection>
      <SidebarSection title="IDIOMAS">
        {profile.idiomas.map(i => <div key={i.nombre} style={{ fontSize: 12, padding: "3px 0" }}>{i.nombre} — <span style={{ color: "#C8D0FE" }}>{i.nivel}</span></div>)}
      </SidebarSection>
    </div>
    <div style={{ flex: 1, padding: "42px 36px" }}>
      <Section title="Perfil Profesional" line="#4B6BFB">
        <p {...ed(editable, onEdit, "resumen")} style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>{profile.resumen}</p>
      </Section>
      <Section title="Experiencia" line="#4B6BFB">
        {profile.experiencia.map((e, i) => (
          <div key={i} style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontWeight: 600, fontSize: 13.5 }}>{e.cargo}</div>
              <div style={{ fontSize: 12, color: "#64748B" }}>{e.periodo}</div>
            </div>
            <div style={{ fontSize: 12.5, color: "#4B6BFB", fontWeight: 500 }}>{e.empresa} · {e.lugar}</div>
            <p style={{ fontSize: 12.5, margin: "6px 0 0", lineHeight: 1.55 }}>{e.descripcion}</p>
          </div>
        ))}
      </Section>
      <Section title="Educación" line="#4B6BFB">
        {profile.educacion.map((e, i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{e.titulo}</div>
            <div style={{ fontSize: 12, color: "#64748B" }}>{e.institucion} · {e.periodo}</div>
          </div>
        ))}
      </Section>
      {showBranding && <Branding />}
    </div>
  </div>
);

// ─── Clásico: centered header, serif ─────────────────────────────────
const Clasico = ({ profile, showBranding, editable, onEdit }) => (
  <div style={{ ...PAGE, padding: "56px 64px", fontFamily: "'Georgia', serif", color: "#0F172A" }}>
    <div style={{ textAlign: "center", borderBottom: "2px solid #0F172A", paddingBottom: 18 }}>
      <h1 style={{ margin: 0, fontSize: 32, fontWeight: 700, letterSpacing: "0.02em" }}>
        {profile.nombre.toUpperCase()} {profile.apellido.toUpperCase()}
      </h1>
      <div style={{ fontSize: 14, fontStyle: "italic", color: "#475569", marginTop: 4 }}>{profile.profesion}</div>
      <div style={{ fontSize: 12, color: "#64748B", marginTop: 10 }}>
        {profile.emailCv} · {profile.telefono} · {profile.ciudad}, {profile.pais}
      </div>
    </div>
    <ClsSection title="Perfil Profesional">
      <p style={{ fontSize: 12.5, lineHeight: 1.65, textAlign: "justify" }}>{profile.resumen}</p>
    </ClsSection>
    <ClsSection title="Experiencia">
      {profile.experiencia.map((e, i) => (
        <div key={i} style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div style={{ fontWeight: 700, fontSize: 13.5 }}>{e.cargo}, {e.empresa}</div>
            <div style={{ fontSize: 12, fontStyle: "italic" }}>{e.periodo}</div>
          </div>
          <div style={{ fontSize: 12, color: "#64748B", fontStyle: "italic" }}>{e.lugar}</div>
          <p style={{ fontSize: 12.5, margin: "6px 0 0", lineHeight: 1.6 }}>{e.descripcion}</p>
        </div>
      ))}
    </ClsSection>
    <ClsSection title="Educación">
      {profile.educacion.map((e, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12.5 }}>
          <div><strong>{e.titulo}</strong>, {e.institucion}</div>
          <div style={{ fontStyle: "italic" }}>{e.periodo}</div>
        </div>
      ))}
    </ClsSection>
    <ClsSection title="Habilidades">
      <div style={{ fontSize: 12.5, lineHeight: 1.8 }}>{profile.skillsHard.join(" · ")}</div>
    </ClsSection>
    {showBranding && <Branding />}
  </div>
);

// ─── Minimal: monochrome, tight ──────────────────────────────────────
const Minimal = ({ profile, showBranding }) => (
  <div style={{ ...PAGE, padding: "72px 72px 56px", fontFamily: "Inter", color: "#0F172A" }}>
    <div style={{ marginBottom: 40 }}>
      <div style={{ fontSize: 11, letterSpacing: "0.18em", color: "#64748B", textTransform: "uppercase", marginBottom: 8 }}>Curriculum Vitae</div>
      <h1 style={{ margin: 0, fontSize: 40, fontWeight: 300, letterSpacing: "-0.02em", lineHeight: 1 }}>{profile.nombre} <strong style={{ fontWeight: 700 }}>{profile.apellido}</strong></h1>
      <div style={{ fontSize: 14, color: "#64748B", marginTop: 10 }}>{profile.profesion}</div>
      <div style={{ fontSize: 11.5, color: "#94A3B8", marginTop: 6, display: "flex", gap: 16 }}>
        <span>{profile.emailCv}</span><span>{profile.telefono}</span><span>{profile.ciudad}, {profile.pais}</span>
      </div>
    </div>
    <MinSection label="01" title="Sobre mí">
      <p style={{ fontSize: 12.5, lineHeight: 1.7, margin: 0, color: "#334155" }}>{profile.resumen}</p>
    </MinSection>
    <MinSection label="02" title="Experiencia">
      {profile.experiencia.map((e, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 24, marginBottom: 18, paddingBottom: 18, borderBottom: i === profile.experiencia.length-1 ? "none" : "1px solid #E2E8F0" }}>
          <div style={{ fontSize: 11.5, color: "#64748B", fontVariantNumeric: "tabular-nums" }}>{e.periodo}</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13.5 }}>{e.cargo}</div>
            <div style={{ fontSize: 12, color: "#64748B", marginBottom: 6 }}>{e.empresa} · {e.lugar}</div>
            <p style={{ fontSize: 12.5, margin: 0, lineHeight: 1.6, color: "#334155" }}>{e.descripcion}</p>
          </div>
        </div>
      ))}
    </MinSection>
    <MinSection label="03" title="Educación">
      {profile.educacion.map((e, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 24, fontSize: 12.5, marginBottom: 10 }}>
          <div style={{ color: "#64748B" }}>{e.periodo}</div>
          <div><strong>{e.titulo}</strong> — {e.institucion}</div>
        </div>
      ))}
    </MinSection>
    {showBranding && <Branding subtle />}
  </div>
);

// ─── Editorial: two-column magazine feel ────────────────────────────
const Editorial = ({ profile, showBranding }) => (
  <div style={{ ...PAGE, fontFamily: "Inter", color: "#0F172A" }}>
    {/* header band */}
    <div style={{ padding: "40px 48px 32px", borderBottom: "1px solid #E2E8F0" }}>
      <div style={{ fontSize: 11, letterSpacing: "0.16em", color: "#4B6BFB", textTransform: "uppercase", fontWeight: 600 }}>Curriculum</div>
      <h1 style={{ margin: "6px 0 0", fontSize: 36, fontWeight: 700, letterSpacing: "-0.02em" }}>{profile.nombre} {profile.apellido}</h1>
      <div style={{ fontSize: 15, color: "#64748B", marginTop: 4 }}>{profile.profesion}</div>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 36, padding: "32px 48px" }}>
      <aside>
        <EdiBlock title="Contacto">
          <div style={{ fontSize: 12, color: "#334155", lineHeight: 1.8 }}>
            {profile.emailCv}<br />{profile.telefono}<br />{profile.ciudad}, {profile.pais}
          </div>
        </EdiBlock>
        <EdiBlock title="Habilidades">
          {profile.skillsHard.slice(0, 8).map(s => (
            <div key={s} style={{ fontSize: 12, color: "#334155", padding: "2px 0" }}>— {s}</div>
          ))}
        </EdiBlock>
        <EdiBlock title="Idiomas">
          {profile.idiomas.map(i => (
            <div key={i.nombre} style={{ fontSize: 12, color: "#334155", padding: "2px 0" }}>
              {i.nombre} <span style={{ color: "#64748B" }}>— {i.nivel}</span>
            </div>
          ))}
        </EdiBlock>
      </aside>
      <div>
        <EdiBlock title="Perfil">
          <p style={{ fontSize: 13, margin: 0, lineHeight: 1.65, color: "#334155" }}>{profile.resumen}</p>
        </EdiBlock>
        <EdiBlock title="Experiencia">
          {profile.experiencia.map((e, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11.5, letterSpacing: "0.08em", color: "#4B6BFB", textTransform: "uppercase", fontWeight: 600 }}>{e.periodo}</div>
              <div style={{ fontWeight: 600, fontSize: 14, marginTop: 2 }}>{e.cargo} · {e.empresa}</div>
              <p style={{ fontSize: 12.5, margin: "6px 0 0", lineHeight: 1.6, color: "#334155" }}>{e.descripcion}</p>
            </div>
          ))}
        </EdiBlock>
        <EdiBlock title="Educación">
          {profile.educacion.map((e, i) => (
            <div key={i} style={{ marginBottom: 6 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{e.titulo}</div>
              <div style={{ fontSize: 12, color: "#64748B" }}>{e.institucion} · {e.periodo}</div>
            </div>
          ))}
        </EdiBlock>
      </div>
    </div>
    {showBranding && <Branding />}
  </div>
);

// ─── Vibrante: navy header band ──────────────────────────────────────
const Vibrante = ({ profile, showBranding }) => (
  <div style={{ ...PAGE, fontFamily: "Inter", color: "#0F172A" }}>
    <div style={{
      background: "linear-gradient(135deg, #1A2B4C, #0F1E3A)", color: "#fff",
      padding: "40px 48px 36px", display: "flex", gap: 24, alignItems: "center",
    }}>
      <div style={{
        width: 96, height: 96, borderRadius: 14,
        background: profile.photo ? `url(${profile.photo}) center/cover` : "#4B6BFB",
        border: "3px solid rgba(255,255,255,.15)", flex: "none",
      }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.16em", color: "#8BA1FF", textTransform: "uppercase", fontWeight: 600 }}>Currículum</div>
        <h1 style={{ margin: "4px 0 0", fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em" }}>{profile.nombre} {profile.apellido}</h1>
        <div style={{ fontSize: 14, color: "rgba(255,255,255,.75)", marginTop: 4 }}>{profile.profesion}</div>
      </div>
      <div style={{ fontSize: 11.5, color: "rgba(255,255,255,.75)", lineHeight: 1.8, textAlign: "right" }}>
        {profile.emailCv}<br />{profile.telefono}<br />{profile.ciudad}, {profile.pais}
      </div>
    </div>
    <div style={{ padding: "32px 48px" }}>
      <VibSection title="Perfil" color="#4B6BFB">
        <p style={{ fontSize: 12.5, margin: 0, lineHeight: 1.65 }}>{profile.resumen}</p>
      </VibSection>
      <VibSection title="Experiencia" color="#4B6BFB">
        {profile.experiencia.map((e, i) => (
          <div key={i} style={{ marginBottom: 14, display: "grid", gridTemplateColumns: "110px 1fr", gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#4B6BFB" }}>{e.periodo}</div>
              <div style={{ fontSize: 11, color: "#64748B" }}>{e.lugar}</div>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13.5 }}>{e.cargo}</div>
              <div style={{ fontSize: 12, color: "#64748B" }}>{e.empresa}</div>
              <p style={{ fontSize: 12.5, margin: "4px 0 0", lineHeight: 1.55 }}>{e.descripcion}</p>
            </div>
          </div>
        ))}
      </VibSection>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30 }}>
        <VibSection title="Educación" color="#4B6BFB">
          {profile.educacion.map((e, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <div style={{ fontWeight: 600, fontSize: 12.5 }}>{e.titulo}</div>
              <div style={{ fontSize: 11.5, color: "#64748B" }}>{e.institucion} · {e.periodo}</div>
            </div>
          ))}
        </VibSection>
        <VibSection title="Habilidades" color="#4B6BFB">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {profile.skillsHard.slice(0, 10).map(s => (
              <span key={s} style={{ fontSize: 11, padding: "3px 8px", background: "#EEF1FE", color: "#4B6BFB", borderRadius: 4 }}>{s}</span>
            ))}
          </div>
        </VibSection>
      </div>
    </div>
    {showBranding && <Branding />}
  </div>
);

const CV_STYLES_IMPL = {
  harvard: Clasico,        // Harvard → centered serif, formal
  stanford: Moderno,       // Stanford → sidebar, modern
  europeo: Editorial,      // Europeo → two-column with photo
  siliconvalley: Vibrante, // Silicon Valley → bold dark header
  ejecutivo: Minimal,      // Ejecutivo → minimal, generous margins
};

// Helpers
const Section = ({ title, line, children }) => (
  <div style={{ marginBottom: 20 }}>
    <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1A2B4C", textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: `2px solid ${line}`, paddingBottom: 6, marginBottom: 10 }}>{title}</h2>
    {children}
  </div>
);
const ClsSection = ({ title, children }) => (
  <div style={{ marginTop: 22 }}>
    <h2 style={{ margin: "0 0 10px", fontSize: 16, fontWeight: 700, fontFamily: "Georgia, serif", letterSpacing: "0.05em", textTransform: "uppercase" }}>{title}</h2>
    {children}
  </div>
);
const MinSection = ({ label, title, children }) => (
  <div style={{ marginBottom: 32, display: "grid", gridTemplateColumns: "50px 1fr", gap: 20 }}>
    <div style={{ fontSize: 11, color: "#94A3B8", letterSpacing: "0.1em" }}>{label}</div>
    <div>
      <h2 style={{ margin: "0 0 12px", fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.16em" }}>{title}</h2>
      {children}
    </div>
  </div>
);
const EdiBlock = ({ title, children }) => (
  <div style={{ marginBottom: 22 }}>
    <h2 style={{ margin: "0 0 8px", fontSize: 10.5, fontWeight: 700, color: "#1A2B4C", textTransform: "uppercase", letterSpacing: "0.14em" }}>{title}</h2>
    {children}
  </div>
);
const VibSection = ({ title, color, children }) => (
  <div style={{ marginBottom: 20 }}>
    <h2 style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.14em" }}>{title}</h2>
    {children}
  </div>
);
const SidebarSection = ({ title, children }) => (
  <div>
    <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.16em", color: "#8BA1FF", marginBottom: 8 }}>{title}</div>
    <div>{children}</div>
  </div>
);
const SidebarLine = ({ icon, text }) => (
  <div style={{ fontSize: 11.5, color: "rgba(255,255,255,.82)", padding: "3px 0", display: "flex", gap: 8 }}>
    <span style={{ color: "#8BA1FF" }}>{icon}</span>{text}
  </div>
);
const Branding = ({ subtle }) => (
  <div style={{
    position: "absolute", bottom: 20, left: 0, right: 0, textAlign: "center",
    fontSize: 10, color: subtle ? "#CBD5E1" : "#94A3B8", letterSpacing: "0.04em",
  }}>Creado con Resumint</div>
);

window.CV_STYLES = CV_STYLES;
window.CvDocument = CvDocument;
