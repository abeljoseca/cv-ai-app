const { useState, useEffect, useRef, useMemo, useLayoutEffect } = React;

// Crear CV: evaluation → intent → style picker.

function CrearScreen({ profile, onPreview, onNav, plan }) {
  const [intent, setIntent] = useState(null); // 'vacancy' | 'general'
  const [jobDesc, setJobDesc] = useState("");
  const [style, setStyle] = useState(null);

  const pct = profile.completitud;
  const stage = pct < 30 ? "blocked" : pct < 35 ? "warn" : pct < 50 ? "low" : pct < 76 ? "mid" : pct < 86 ? "good" : "ok";

  const ranges = {
    blocked: { tone: "danger", title: "Perfil incompleto", msg: "Necesitamos más información para generar un CV útil. Completa tu perfil primero." },
    warn:    { tone: "warn",   title: "Tu CV será muy básico", msg: "Con la información actual podemos generar algo, pero faltan detalles importantes." },
    low:     { tone: "warn",   title: "Sería ideal completar más", msg: "Agregar más experiencia y habilidades mejorará notablemente el resultado." },
    mid:     { tone: "blue",   title: "Podemos generar un buen CV", msg: "Tienes suficiente para crear un CV sólido. Aún puede mejorar con más detalle." },
    good:    { tone: "success",title: "Excelente base", msg: "Con tu perfil actual podemos generar un CV muy bueno." },
    ok:      { tone: "success",title: "Tu perfil está listo", msg: "Perfecto estado. Continuamos directamente al siguiente paso." },
  };
  const stg = ranges[stage];

  const availableStyles = plan === "free" ? CV_STYLES.slice(0, 2) : CV_STYLES;
  const lockedStyles = plan === "free" ? CV_STYLES.slice(2) : [];

  const canPreview =
    (intent === "general" && style) ||
    (intent === "vacancy" && style && jobDesc.trim().length > 30);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Completitud banner */}
      <Card style={{
        padding: 22, display: "flex", gap: 22, alignItems: "center",
        borderLeft: `4px solid ${{ danger: "var(--danger)", warn: "var(--warn)", blue: "var(--blue)", success: "var(--success)" }[stg.tone]}`,
      }}>
        <div style={{ position: "relative" }}>
          <Ring value={pct} size={80} stroke={8}
            color={{ danger: "#EF4444", warn: "#F59E0B", blue: "#4B6BFB", success: "#22C55E" }[stg.tone]}
            track="#EEF1F5" showPct={false} />
          <div style={{
            position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: 20, color: "var(--deep)", letterSpacing: "-0.02em",
          }}>{pct}%</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12.5, color: "var(--mute)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em" }}>Tu perfil</div>
          <div style={{ fontSize: 20, fontWeight: 600, color: "var(--deep)", marginTop: 2 }}>{stg.title}</div>
          <div style={{ fontSize: 14, color: "var(--mute)", marginTop: 4, maxWidth: 640 }}>{stg.msg}</div>
        </div>
        {stage === "blocked" ? (
          <Button variant="primary" onClick={() => onNav("perfil")}>Completar perfil</Button>
        ) : (
          <Button variant="secondary" onClick={() => onNav("perfil")}>Ver mi perfil</Button>
        )}
      </Card>

      {stage !== "blocked" && (
        <>
          {/* Intent selector */}
          <div>
            <h2 style={{ margin: "4px 0 4px", fontSize: 18, fontWeight: 600, color: "var(--deep)", letterSpacing: "-0.01em" }}>
              ¿Qué tipo de CV quieres generar?
            </h2>
            <div style={{ color: "var(--mute)", fontSize: 14, marginBottom: 14 }}>
              Elige entre un CV general o uno optimizado para una vacante específica.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <IntentCard
                active={intent === "general"} onClick={() => setIntent("general")}
                icon={<Ic.file size={22} />} title="CV General"
                desc="Fiel a tu trayectoria. Ideal para tener una versión base lista."
                bullets={["Basado en tu profesión principal", "Útil para múltiples oportunidades", "Disponible siempre"]} />
              <IntentCard
                active={intent === "vacancy"} onClick={() => setIntent("vacancy")}
                icon={<Ic.target size={22} />} title="CV para vacante específica"
                desc="Optimizado para ATS. Adaptado al cargo objetivo."
                bullets={["Extrae keywords de la vacante", "Cruza con tu perfil real", "Muestra match con la vacante"]}
                badge="Recomendado" />
            </div>
          </div>

          {/* Job description (vacancy only) */}
          {intent === "vacancy" && (
            <Card style={{ padding: 22 }}>
              <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 600, color: "var(--deep)" }}>Descripción de la vacante</h3>
              <div style={{ color: "var(--mute)", fontSize: 13, marginBottom: 12 }}>
                Pega aquí la descripción completa del puesto al que quieres aplicar.
              </div>
              <Textarea value={jobDesc} onChange={(e) => setJobDesc(e.target.value)}
                rows={6} placeholder="Ej. Buscamos un Senior Frontend Engineer con 4+ años de experiencia en React, TypeScript..."
                hint={`${jobDesc.length} caracteres${jobDesc.length < 30 ? " · mínimo 30" : ""}`} />
            </Card>
          )}

          {/* Style picker — accordion + floating preview */}
          {intent && (
            <div>
              <div style={{ marginBottom: 14 }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "var(--deep)", letterSpacing: "-0.01em" }}>
                  Elige el estilo visual
                </h2>
                <div style={{ color: "var(--mute)", fontSize: 14, marginTop: 2 }}>
                  {plan === "free" ? "2 estilos en tu plan gratuito. Desbloquea los 5 con Pro." : "Los 5 estilos están disponibles en tu plan."}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, alignItems: "flex-start" }}>
                {/* Accordion */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {availableStyles.map(s => (
                    <StyleAccordionCard key={s.id} meta={s}
                      expanded={style === s.id}
                      onToggle={() => setStyle(style === s.id ? null : s.id)} />
                  ))}
                  {lockedStyles.map(s => (
                    <StyleAccordionCard key={s.id} meta={s} locked />
                  ))}
                </div>

                {/* Floating preview */}
                <div style={{ position: "sticky", top: 24 }}>
                  <StylePreviewPanel
                    meta={style ? CV_STYLES.find(s => s.id === style) : null} />
                </div>
              </div>
            </div>
          )}

          {/* Action bar */}
          {intent && (
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 4 }}>
              <Button variant="secondary" onClick={() => { setIntent(null); setStyle(null); setJobDesc(""); }}>
                Volver
              </Button>
              <Button variant="primary" disabled={!canPreview}
                rightIcon={<Ic.chevR size={16} />}
                onClick={() => onPreview({ intent, style, jobDesc })}>
                Generar y previsualizar CV
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function IntentCard({ active, onClick, icon, title, desc, bullets, badge }) {
  return (
    <Card onClick={onClick} selected={active} hover
      style={{ padding: 24, cursor: "pointer", position: "relative" }}>
      {badge && (
        <Badge tone="lav" style={{ position: "absolute", top: 14, right: 14 }}>{badge}</Badge>
      )}
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: active ? "var(--blue)" : "var(--lav)",
        color: active ? "#fff" : "var(--blue)",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all .2s var(--ease)", marginBottom: 16,
      }}>{icon}</div>
      <div style={{ fontSize: 17, fontWeight: 600, color: "var(--deep)", marginBottom: 4 }}>{title}</div>
      <div style={{ color: "var(--mute)", fontSize: 13.5, marginBottom: 14, lineHeight: 1.5 }}>{desc}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {bullets.map(b => (
          <div key={b} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--ink)" }}>
            <span style={{ width: 16, height: 16, borderRadius: "50%", background: "var(--success-50)", color: "var(--success)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
              <Ic.check size={11} />
            </span>
            {b}
          </div>
        ))}
      </div>
    </Card>
  );
}

function StyleAccordionCard({ meta, expanded, onToggle, locked }) {
  return (
    <Card
      onClick={locked ? null : onToggle}
      hover={!locked}
      style={{
        padding: expanded ? 22 : 16,
        cursor: locked ? "not-allowed" : "pointer",
        opacity: locked ? .55 : 1,
        borderColor: expanded ? "var(--blue)" : "var(--line)",
        borderWidth: expanded ? 2 : 1,
        boxShadow: expanded ? "0 1px 2px rgba(15,23,42,.04), 0 8px 24px -12px rgba(75,107,251,.25)" : "var(--sh-1)",
        transition: "all .2s var(--ease)",
      }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: expanded ? 16 : 14.5, fontWeight: 600,
            color: "var(--deep)", letterSpacing: "-0.01em",
            transition: "font-size .2s var(--ease)",
          }}>{meta.name}</div>
          {!expanded && (
            <div style={{ fontSize: 12.5, color: "var(--mute)", marginTop: 3, lineHeight: 1.4 }}>
              <span style={{ fontWeight: 600, color: "var(--ink)" }}>Ideal para:</span> {meta.idealPara}
            </div>
          )}
        </div>
        {locked && <Badge tone="lav" leftIcon={<Ic.crown size={11} />}>Pro</Badge>}
      </div>

      {expanded && !locked && (
        <div style={{ marginTop: 14, animation: "fadeUp .3s var(--ease)" }}>
          <div style={{ fontSize: 13.5, color: "var(--ink)", lineHeight: 1.55, marginBottom: 12 }}>
            {meta.tagline}
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 14px", display: "flex", flexDirection: "column", gap: 7 }}>
            {meta.bullets.map(b => (
              <li key={b} style={{ display: "flex", gap: 8, fontSize: 13, color: "var(--ink)", lineHeight: 1.45 }}>
                <span style={{
                  flex: "none", marginTop: 6, width: 4, height: 4, borderRadius: "50%",
                  background: "var(--blue)",
                }} />
                {b}
              </li>
            ))}
          </ul>
          <div style={{
            paddingTop: 12, borderTop: "1px solid var(--line-soft)",
            fontSize: 12.5, color: "var(--mute)", lineHeight: 1.5,
          }}>
            <span style={{ fontWeight: 600, color: "var(--ink)" }}>Ideal para:</span> {meta.idealPara}
          </div>
        </div>
      )}
    </Card>
  );
}

function StylePreviewPanel({ meta }) {
  if (!meta) {
    return (
      <div style={{
        background: "var(--surface-2)", border: "1px dashed var(--line)",
        borderRadius: 14, aspectRatio: "3/4",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: 24, textAlign: "center",
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, background: "var(--lav)",
          color: "var(--blue)", display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 12,
        }}><Ic.eye size={20} /></div>
        <div style={{ fontSize: 13.5, color: "var(--deep)", fontWeight: 600 }}>Selecciona un estilo</div>
        <div style={{ fontSize: 12.5, color: "var(--mute)", marginTop: 4, maxWidth: 220 }}>
          Verás aquí una vista previa del formato.
        </div>
      </div>
    );
  }
  return (
    <div style={{
      background: "var(--surface)", borderRadius: 14, padding: 14,
      border: "1px solid var(--line)", boxShadow: "var(--sh-2)",
      animation: "fadeIn .25s var(--ease)",
    }}>
      <div style={{
        aspectRatio: "3/4", borderRadius: 8, overflow: "hidden",
        background: "#F1F5F9",
        boxShadow: "0 1px 2px rgba(15,23,42,.04), 0 16px 36px -18px rgba(15,23,42,.18)",
      }}>
        <img src={meta.preview} alt={meta.name}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      </div>
      <div style={{
        marginTop: 12, fontSize: 12, color: "var(--mute)",
        textAlign: "center", letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 600,
      }}>
        Vista previa · {meta.name.replace("Estilo ", "")}
      </div>
    </div>
  );
}

window.CrearScreen = CrearScreen;
