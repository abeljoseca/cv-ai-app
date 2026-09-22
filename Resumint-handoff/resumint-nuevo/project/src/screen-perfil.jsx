const { useState, useEffect, useRef, useMemo, useLayoutEffect } = React;

// Mi Perfil — the moodboard-faithful screen: hero card, info cards, chat column.

function PerfilScreen({ user, profile, onNav, onUpdate }) {
  const [chatMessages, setChatMessages] = useState([
    { role: "ai", text: `Hola ${user.name.split(" ")[0]}, ¿hay algo nuevo que quieras contarme sobre tu experiencia?` },
    { role: "user", text: "Terminé un proyecto con React y TypeScript el mes pasado." },
    { role: "ai", text: "Anotado. ¿Fue en tu rol actual o fue un proyecto independiente?" },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [expandedHard, setExpandedHard] = useState(false);
  const [expandedSoft, setExpandedSoft] = useState(false);

  const hardSkills = ["React", "TypeScript", "Node.js", "PostgreSQL", "AWS", "Docker", "Figma", "Next.js", "GraphQL"];
  const softSkills = ["Liderazgo", "Comunicación", "Trabajo en equipo", "Resolución", "Creatividad", "Adaptabilidad", "Mentoría"];

  function sendChat() {
    const v = chatInput.trim(); if (!v) return;
    setChatMessages(m => [...m, { role: "user", text: v }]);
    setChatInput("");
    setTimeout(() => {
      setChatMessages(m => [...m, { role: "ai", text: "Perfecto, agregué eso a tu perfil. ¿Algo más?" }]);
    }, 900);
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20, maxWidth: 1340, margin: "0 auto" }}>

      {/* LEFT: profile content */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Hero deep-blue card */}
        <div style={{
          position: "relative",
          background: "linear-gradient(135deg, #1A2B4C 0%, #0F1E3A 100%)",
          borderRadius: 18, padding: "26px 28px",
          color: "#fff", overflow: "hidden",
          boxShadow: "var(--sh-2)",
        }}>
          {/* subtle constellation */}
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: .22 }}>
            <defs>
              <radialGradient id="glow" cx="80%" cy="30%" r="50%">
                <stop offset="0%" stopColor="#4B6BFB" stopOpacity=".8" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#glow)" />
            {Array.from({ length: 28 }).map((_, i) => (
              <circle key={i}
                cx={Math.random()*100+"%"} cy={Math.random()*100+"%"}
                r={Math.random()*1.4 + .3} fill="#C8D0FE" opacity={.3 + Math.random()*.6} />
            ))}
          </svg>

          <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 22 }}>
            <div style={{
              width: 96, height: 96, borderRadius: 14, overflow: "hidden",
              border: "3px solid rgba(255,255,255,.15)", flex: "none",
              background: user.photo ? `url(${user.photo}) center/cover` : "var(--lav)",
            }} />
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
                {user.name}
              </h2>
              <div style={{ marginTop: 6, fontSize: 15, color: "rgba(255,255,255,.72)", fontWeight: 400 }}>
                {profile.profesion || "Profesión"}
              </div>
              <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Badge tone="dark" style={{ background: "rgba(255,255,255,.1)", borderColor: "rgba(255,255,255,.15)", color: "#fff" }}>
                  <Ic.pin size={12} /> {profile.ciudad}, {profile.pais}
                </Badge>
                <Badge tone="dark" style={{ background: "rgba(34,197,94,.15)", borderColor: "rgba(34,197,94,.3)", color: "#86EFAC" }}>
                  Disponible
                </Badge>
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <Ring value={profile.completitud} size={96} stroke={8} />
              <div style={{ fontSize: 11.5, color: "rgba(255,255,255,.7)", marginTop: 8, fontWeight: 500 }}>
                Completitud
              </div>
            </div>
          </div>

          {/* completitud bar */}
          <div style={{ position: "relative", marginTop: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "rgba(255,255,255,.72)", marginBottom: 6 }}>
              <span>Sigue enriqueciendo tu perfil</span>
              <span style={{ fontWeight: 600, color: "#fff" }}>{profile.completitud}/100</span>
            </div>
            <div style={{ height: 6, background: "rgba(255,255,255,.12)", borderRadius: 999, overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${profile.completitud}%`,
                background: "linear-gradient(90deg, #4B6BFB, #8BA1FF)",
                borderRadius: 999, transition: "width 1s var(--ease)",
              }} />
            </div>
          </div>
        </div>

        {/* Info Personal */}
        <InfoCard title="Información Personal" icon={<Ic.user size={16} />}>
          <InfoRow icon={<Ic.pin size={16} />} label="Ciudad y País" value={`${profile.ciudad}, ${profile.pais}`} />
          <InfoRow icon={<Ic.phone size={16} />} label="Teléfono" value={profile.telefono} />
          <InfoRow icon={<Ic.mail size={16} />} label="Email" value={profile.emailCv} />
        </InfoCard>

        {/* Habilidades */}
        <InfoCard title="Habilidades" icon={<Ic.puzzle size={16} />}>
          <SkillGroup title="Habilidades Técnicas" icon={<Ic.brain size={15} />}
            items={hardSkills} expanded={expandedHard} onToggle={() => setExpandedHard(!expandedHard)}
            tone="lav" />
          <div style={{ height: 18 }} />
          <SkillGroup title="Habilidades Blandas" icon={<Ic.puzzle size={15} />}
            items={softSkills} expanded={expandedSoft} onToggle={() => setExpandedSoft(!expandedSoft)}
            tone="mint" />
        </InfoCard>

        {/* Experiencia */}
        <InfoCard title="Experiencia" icon={<Ic.briefcase size={16} />}>
          {profile.experiencia.map((e, i) => (
            <div key={i} style={{
              display: "flex", gap: 14, padding: "12px 0",
              borderTop: i === 0 ? "none" : "1px solid var(--line-soft)",
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: "var(--lav)", color: "var(--blue)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, fontSize: 13.5, flex: "none",
              }}>{e.empresa.slice(0, 2).toUpperCase()}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                  <div style={{ fontWeight: 600, color: "var(--deep)", fontSize: 14.5 }}>{e.cargo}</div>
                  <div style={{ fontSize: 12.5, color: "var(--mute)", flex: "none" }}>{e.periodo}</div>
                </div>
                <div style={{ fontSize: 13, color: "var(--mute)", marginBottom: 4 }}>{e.empresa} · {e.lugar}</div>
                <div style={{ fontSize: 13.5, color: "var(--ink)", lineHeight: 1.5 }}>{e.descripcion}</div>
              </div>
            </div>
          ))}
        </InfoCard>

        {/* Educación + Idiomas grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <InfoCard title="Educación" icon={<Ic.grad size={16} />}>
            {profile.educacion.map((e, i) => (
              <div key={i} style={{ padding: "8px 0", borderTop: i === 0 ? "none" : "1px solid var(--line-soft)" }}>
                <div style={{ fontWeight: 600, color: "var(--deep)", fontSize: 14 }}>{e.titulo}</div>
                <div style={{ fontSize: 13, color: "var(--mute)" }}>{e.institucion}</div>
                <div style={{ fontSize: 12, color: "var(--mute)", marginTop: 2 }}>{e.periodo}</div>
              </div>
            ))}
          </InfoCard>
          <InfoCard title="Idiomas" icon={<Ic.globe size={16} />}>
            {profile.idiomas.map((i, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
                <span style={{ fontSize: 14, color: "var(--deep)", fontWeight: 500 }}>{i.nombre}</span>
                <Chip tone="neutral">{i.nivel}</Chip>
              </div>
            ))}
          </InfoCard>
        </div>

        {/* Logros */}
        <InfoCard title="Logros" icon={<Ic.award size={16} />}>
          {profile.logros.map((l, i) => (
            <div key={i} style={{
              display: "flex", gap: 12, padding: "10px 0",
              borderTop: i === 0 ? "none" : "1px solid var(--line-soft)",
            }}>
              <span style={{
                width: 28, height: 28, borderRadius: 8,
                background: "var(--success-50)", color: "#148B3D",
                display: "flex", alignItems: "center", justifyContent: "center", flex: "none",
              }}><Ic.check size={16} /></span>
              <div style={{ fontSize: 14, color: "var(--ink)", lineHeight: 1.5 }}>
                <div style={{ fontWeight: 600, color: "var(--deep)" }}>{l.titulo}</div>
                <div style={{ color: "var(--mute)", fontSize: 13, marginTop: 2 }}>{l.descripcion}</div>
              </div>
            </div>
          ))}
        </InfoCard>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
          <Button variant="primary" leftIcon={<Ic.plus size={16} />}>Añadir información sobre mí</Button>
          <Button variant="secondary" leftIcon={<Ic.paperclip size={16} />}>Adjuntar documento</Button>
        </div>
      </div>

      {/* RIGHT: Chat column */}
      <aside style={{ position: "sticky", top: 20, alignSelf: "start", height: "calc(100vh - 120px)" }}>
        <Card style={{ padding: 0, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
          {/* header */}
          <div style={{
            padding: "16px 20px", borderBottom: "1px solid var(--line)",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: "var(--lav)", color: "var(--blue)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}><Ic.sparkles size={16} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: "var(--deep)" }}>Asistente IA</div>
              <div style={{ fontSize: 12, color: "var(--success)", fontWeight: 500 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--success)", display: "inline-block", marginRight: 6 }} />
                Disponible
              </div>
            </div>
          </div>

          {/* intro card */}
          <div style={{ padding: "18px 20px 0" }}>
            <div style={{ fontWeight: 600, color: "var(--deep)", fontSize: 16, marginBottom: 6 }}>
              ¡Hola, {user.name.split(" ")[0]}!
            </div>
            <div style={{ color: "var(--mute)", fontSize: 13, lineHeight: 1.5, marginBottom: 14 }}>
              Estoy aquí para ayudarte a construir y potenciar tu perfil profesional.
            </div>
            <div style={{
              background: "var(--surface-2)", borderRadius: 12, padding: 14,
              border: "1px solid var(--line-soft)",
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--deep)", marginBottom: 8 }}>
                Puedes contarme sobre:
              </div>
              {["Tu experiencia laboral", "Tus estudios y logros", "Tus habilidades", "Objetivos alcanzados"].map((t) => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--ink)", padding: "3px 0" }}>
                  <span style={{
                    width: 16, height: 16, borderRadius: "50%", background: "var(--blue-50)",
                    color: "var(--blue)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none",
                  }}><Ic.check size={11} /></span>
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* messages */}
          <div className="scroll" style={{
            flex: 1, overflowY: "auto", padding: "16px 20px",
            display: "flex", flexDirection: "column", gap: 12,
          }}>
            {chatMessages.map((m, i) => (
              <div key={i} style={{
                display: "flex", gap: 8,
                flexDirection: m.role === "user" ? "row-reverse" : "row",
              }}>
                {m.role === "ai" ? (
                  <div style={{
                    width: 26, height: 26, borderRadius: "50%",
                    background: "var(--lav)", color: "var(--blue)",
                    display: "flex", alignItems: "center", justifyContent: "center", flex: "none", fontSize: 11,
                  }}><Ic.sparkles size={12} /></div>
                ) : (
                  <Avatar src={user.photo} name={user.name} size={26} />
                )}
                <div style={{
                  background: m.role === "user" ? "var(--blue-50)" : "var(--surface-2)",
                  color: m.role === "user" ? "var(--deep)" : "var(--ink)",
                  border: "1px solid " + (m.role === "user" ? "#DDE3FE" : "var(--line-soft)"),
                  padding: "8px 12px", borderRadius: 10,
                  fontSize: 13, lineHeight: 1.5, maxWidth: "80%",
                }}>{m.text}</div>
              </div>
            ))}
          </div>

          {/* input */}
          <div style={{ padding: "12px 14px", borderTop: "1px solid var(--line)", background: "var(--surface-2)" }}>
            <div style={{
              display: "flex", gap: 8, alignItems: "center",
              background: "var(--surface)", border: "1px solid var(--line)",
              borderRadius: 12, padding: "6px 6px 6px 12px",
            }}>
              <input
                value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendChat()}
                placeholder="Escribe tu mensaje..."
                style={{
                  flex: 1, border: "none", outline: "none", fontSize: 13,
                  background: "transparent", color: "var(--ink)", padding: "4px 0",
                }} />
              <button onClick={sendChat} className="focus-ring" style={{
                width: 32, height: 32, borderRadius: 8, border: "none",
                background: chatInput.trim() ? "var(--blue)" : "var(--line)",
                color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
              }}><Ic.send size={14} /></button>
              <button title="Adjuntar" className="focus-ring" style={{
                width: 32, height: 32, borderRadius: 8, border: "1px solid var(--line)",
                background: "var(--surface)", color: "var(--mute)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}><Ic.pdf size={14} /></button>
            </div>
          </div>
        </Card>
      </aside>
    </div>
  );
}

function InfoCard({ title, icon, action, children }) {
  return (
    <Card style={{ padding: "20px 22px" }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 14, gap: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            width: 30, height: 30, borderRadius: 8,
            background: "var(--surface-2)", color: "var(--deep)",
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "1px solid var(--line-soft)",
          }}>{icon}</span>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "var(--deep)" }}>{title}</h3>
        </div>
        {action}
      </div>
      <div>{children}</div>
    </Card>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14,
      padding: "10px 0", borderTop: "1px solid var(--line-soft)",
    }}>
      <span style={{ color: "var(--mute)", display: "flex" }}>{icon}</span>
      <span style={{ color: "var(--mute)", fontSize: 13, width: 120 }}>{label}</span>
      <span style={{ color: "var(--deep)", fontSize: 14, fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function SkillGroup({ title, icon, items, expanded, onToggle, tone }) {
  const visible = expanded ? items : items.slice(0, 7);
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, color: "var(--deep)", fontSize: 13.5, fontWeight: 600 }}>
        <span style={{ color: "var(--mute)" }}>{icon}</span> {title}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {visible.map(s => <Chip key={s} tone={tone}>{s}</Chip>)}
        {items.length > 7 && (
          <button onClick={onToggle} style={{
            background: "transparent", border: "1px solid var(--line)",
            padding: "6px 12px", borderRadius: 8, cursor: "pointer",
            color: "var(--mute)", fontSize: 12, fontWeight: 600,
          }}>{expanded ? "VER MENOS" : "VER MÁS"}</button>
        )}
      </div>
    </div>
  );
}


window.PerfilScreen = PerfilScreen;
