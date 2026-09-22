const { useState, useEffect, useRef, useMemo, useLayoutEffect } = React;

// Onboarding — 2-step flow rendered inside the Shell.
// Step 1: identity form. Sidebar nav disabled, only "Mejorar cuenta" active.
// Step 2: AI chat. Sidebar fully active.

function SectionLabel({ children }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      margin: "6px 0 14px",
    }}>
      <span style={{
        fontSize: 11, fontWeight: 600, letterSpacing: "0.08em",
        textTransform: "uppercase", color: "var(--blue)",
      }}>{children}</span>
      <span style={{ flex: 1, height: 1, background: "var(--line-soft)" }} />
    </div>
  );
}

function OnboardingForm({ email, onContinue }) {
  const [form, setForm] = useState({
    nombre: "", apellido: "", profesion: "",
    emailCv: email || "",
    telefono: "", ciudad: "", pais: "",
    photo: null,
  });
  const [photoHover, setPhotoHover] = useState(false);
  const fileRef = useRef();

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function onPhoto(e) {
    const f = e.target.files?.[0]; if (!f) return;
    set("photo", URL.createObjectURL(f));
  }

  const emailValid = /^\S+@\S+\.\S+$/.test(form.emailCv);
  const canContinue = !!form.nombre && !!form.apellido && emailValid;

  function submit(e) {
    e.preventDefault();
    if (!canContinue) return;
    onContinue(form);
  }

  function clearPhoto(e) { e.stopPropagation(); set("photo", null); if (fileRef.current) fileRef.current.value = ""; }

  return (
    <div style={{ maxWidth: 820, margin: "8px auto 60px" }}>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {/* header band */}
        <div style={{
          padding: "28px 40px 22px",
          background: "linear-gradient(180deg, #F7F8FE 0%, #FFFFFF 100%)",
          borderBottom: "1px solid var(--line-soft)",
        }}>
          <h2 style={{
            margin: "0 0 6px", fontSize: 22, fontWeight: 700,
            color: "var(--deep)", letterSpacing: "-0.015em",
          }}>
            Vamos a crear tu CV
          </h2>
          <p style={{ margin: 0, color: "var(--mute)", fontSize: 13.5, lineHeight: 1.55 }}>
            Primero, cuéntanos sobre ti. Estos datos nos ayudarán a generar tu CV profesional.
          </p>
        </div>

        <div style={{ padding: "28px 40px 32px" }}>
          <form onSubmit={submit}>
            {/* PHOTO ROW — its own block, centered, with helper meta on the right */}
            <div style={{
              display: "flex", alignItems: "center", gap: 20,
              padding: "18px 20px",
              background: "var(--surface-2)",
              border: "1px solid var(--line-soft)",
              borderRadius: 14,
              marginBottom: 26,
            }}>
              {/* photo well */}
              <div
                onMouseEnter={() => setPhotoHover(true)}
                onMouseLeave={() => setPhotoHover(false)}
                onClick={() => fileRef.current?.click()}
                role="button" tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileRef.current?.click(); } }}
                className="focus-ring"
                style={{
                  width: 88, height: 88, borderRadius: "50%",
                  background: form.photo ? `url(${form.photo}) center/cover` : "linear-gradient(180deg, #F0F1FE 0%, #E5E8FD 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--blue)", cursor: "pointer", position: "relative",
                  border: form.photo ? "3px solid #fff" : ("2px dashed " + (photoHover ? "var(--blue)" : "#C9D0EC")),
                  boxShadow: form.photo
                    ? "0 0 0 1px var(--line), var(--sh-2)"
                    : (photoHover ? "0 0 0 4px rgba(75,107,251,.12)" : "none"),
                  transition: "all .18s var(--ease)",
                  flex: "none", overflow: "hidden",
                }}>
                {!form.photo && <Ic.user size={32} />}
                {form.photo && photoHover && (
                  <div style={{
                    position: "absolute", inset: 0, borderRadius: "50%",
                    background: "rgba(15,23,42,.55)", color: "#fff",
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", gap: 2,
                    fontSize: 11, fontWeight: 500,
                  }}>
                    <Ic.camera size={16} />
                    Cambiar
                  </div>
                )}
                {/* small camera badge when empty */}
                {!form.photo && (
                  <div style={{
                    position: "absolute", right: 2, bottom: 2,
                    width: 26, height: 26, borderRadius: "50%",
                    background: "var(--blue)", color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    border: "2px solid #fff",
                    boxShadow: "0 2px 6px rgba(75,107,251,.4)",
                  }}><Ic.camera size={13} /></div>
                )}
                <input ref={fileRef} type="file" accept="image/*" onChange={onPhoto} style={{ display: "none" }} />
              </div>

              {/* meta */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                  <span style={{ fontWeight: 600, fontSize: 14.5, color: "var(--deep)" }}>Foto de perfil</span>
                  <Badge tone="neutral" style={{ fontSize: 11, padding: "2px 8px" }}>Opcional</Badge>
                </div>
                <div style={{ color: "var(--mute)", fontSize: 12.5, lineHeight: 1.5 }}>
                  Una buena foto aumenta la confianza de los reclutadores.<br />
                  Formato JPG o PNG · mínimo 200×200 px.
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <Button type="button" variant="secondary" size="sm"
                    leftIcon={<Ic.upload size={13} />}
                    onClick={() => fileRef.current?.click()}>
                    {form.photo ? "Cambiar foto" : "Subir foto"}
                  </Button>
                  {form.photo && (
                    <Button type="button" variant="ghost" size="sm"
                      leftIcon={<Ic.trash size={13} />}
                      onClick={clearPhoto}>
                      Quitar
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION — datos personales */}
            <SectionLabel>Datos personales</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <Input label="Nombre" required placeholder="Ej. María"
                value={form.nombre} onChange={(e) => set("nombre", e.target.value)} />
              <Input label="Apellido" required placeholder="Ej. González"
                value={form.apellido} onChange={(e) => set("apellido", e.target.value)} />
              <Input label="Profesión" placeholder="Ej. Diseñadora de producto"
                hint="Se mostrará como tu título principal en el CV"
                value={form.profesion} onChange={(e) => set("profesion", e.target.value)}
                wrapStyle={{ gridColumn: "1 / -1" }} />
            </div>

            {/* SECTION — contacto */}
            <SectionLabel>Contacto</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <Input label="Correo electrónico" required type="email"
                hint="Aparecerá en tu CV"
                leftIcon={<Ic.mail size={15} />}
                placeholder="correo@ejemplo.com"
                value={form.emailCv} onChange={(e) => set("emailCv", e.target.value)}
                wrapStyle={{ gridColumn: "1 / -1" }} />
              <Input label="Teléfono" placeholder="+57 300 000 0000"
                leftIcon={<Ic.phone size={15} />}
                value={form.telefono} onChange={(e) => set("telefono", e.target.value)}
                wrapStyle={{ gridColumn: "1 / -1" }} />
            </div>

            {/* SECTION — ubicación */}
            <SectionLabel>Ubicación</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 28 }}>
              <Input label="Ciudad" placeholder="Bogotá"
                leftIcon={<Ic.pin size={15} />}
                value={form.ciudad} onChange={(e) => set("ciudad", e.target.value)} />
              <Input label="País" placeholder="Colombia"
                leftIcon={<Ic.globe size={15} />}
                value={form.pais} onChange={(e) => set("pais", e.target.value)} />
            </div>

            {/* footer actions */}
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              gap: 16, paddingTop: 18, borderTop: "1px solid var(--line-soft)",
            }}>
              <div style={{ color: "var(--mute)", fontSize: 12.5 }}>
                <span style={{ color: "var(--danger)" }}>*</span> Campos obligatorios
              </div>
              <Button variant="primary" type="submit" size="lg" disabled={!canContinue}
                rightIcon={<Ic.chevR size={16} />}
                style={{ minWidth: 200 }}>
                Continuar
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}

function OnboardingChat({ user, onGenerate }) {
  const firstName = (user.name || "").split(" ")[0] || "Nombre";
  const [messages, setMessages] = useState([
    {
      role: "user",
      text: `Hola ${firstName}, ¿Me dejas hablar con tu consultor para hablarte sobre tu experiencia en CV?`,
      action: "Terminar el proyecto con Resin y Topo Script\nde mi proyecto",
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef();

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, typing]);

  function send() {
    const v = input.trim(); if (!v) return;
    setMessages(m => [...m, { role: "user", text: v }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      const replies = [
        "Perfecto, anotado. ¿En qué año iniciaste y cuánto tiempo estuviste en ese rol?",
        "Genial. ¿Cuáles fueron tus principales logros o responsabilidades?",
        "Entendido. ¿Qué herramientas o tecnologías usabas día a día?",
      ];
      setMessages(m => [...m, { role: "ai", text: replies[m.length % replies.length] }]);
    }, 900);
  }

  const bullets = [
    "Tu experiencia laboral",
    "Tus estudios y logros académicos",
    "Tus habilidades",
    "Objetivos y resultados alcanzados",
    "Cualquier otro aspecto de tu trayectoria a resaltar",
  ];

  return (
    <div style={{
      maxWidth: 640, margin: "8px auto 60px",
      display: "flex", flexDirection: "column", gap: 14,
    }}>
      <Card style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>

        {/* HEADER BAND — matches the Editar Perfil / Vamos a crear tu CV style */}
        <div style={{
          padding: "22px 28px 20px",
          background: "linear-gradient(180deg, #F7F8FE 0%, #FFFFFF 100%)",
          borderBottom: "1px solid var(--line-soft)",
          display: "flex", alignItems: "center", gap: 14,
        }}>
          <div style={{
            position: "relative",
            width: 44, height: 44, borderRadius: 12,
            background: "linear-gradient(135deg, #4B6BFB 0%, #7C8EFF 100%)",
            color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 6px 14px -4px rgba(75,107,251,.45)",
            flex: "none",
          }}>
            <Ic.sparkles size={22} />
            <span style={{
              position: "absolute", right: -2, bottom: -2,
              width: 12, height: 12, borderRadius: "50%",
              background: "var(--success)",
              border: "2.5px solid #fff",
            }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
              <h2 style={{
                margin: 0, fontSize: 17, fontWeight: 700,
                color: "var(--deep)", letterSpacing: "-0.01em",
              }}>
                Asistente IA
              </h2>
              <Badge tone="lav" style={{ fontSize: 10.5, padding: "2px 8px" }}>
                <span style={{
                  width: 5, height: 5, borderRadius: "50%",
                  background: "var(--success)", display: "inline-block", marginRight: 4,
                }} />
                Disponible
              </Badge>
            </div>
            <p style={{ margin: 0, color: "var(--mute)", fontSize: 12.5, lineHeight: 1.45 }}>
              Cuéntanos sobre tu trayectoria. Lo usaré para construir tu CV.
            </p>
          </div>
        </div>

        {/* INTRO — bullets of what to share */}
        <div style={{ padding: "20px 28px 16px" }}>
          <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 600, color: "var(--deep)" }}>
            ¡Hola, {firstName}!
          </h3>
          <p style={{ margin: "0 0 14px", color: "var(--mute)", fontSize: 13.5, lineHeight: 1.55 }}>
            Estoy aquí para ayudarte a construir y potenciar tu perfil profesional.
          </p>
          <div style={{
            background: "var(--surface-2)",
            border: "1px solid var(--line-soft)",
            borderRadius: 12, padding: "12px 14px",
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--deep)", marginBottom: 8 }}>
              Puedes contarme sobre:
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
              {bullets.map((b, i) => (
                <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: "var(--ink)", lineHeight: 1.45 }}>
                  <span style={{
                    width: 16, height: 16, borderRadius: "50%",
                    background: "var(--success-50)", color: "#148B3D",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    flex: "none", marginTop: 1,
                  }}>
                    <Ic.check size={10} />
                  </span>
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* DIVIDER LABEL — conversación */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "4px 28px 0",
        }}>
          <span style={{
            fontSize: 11, fontWeight: 600, letterSpacing: "0.08em",
            textTransform: "uppercase", color: "var(--blue)",
          }}>Conversación</span>
          <span style={{ flex: 1, height: 1, background: "var(--line-soft)" }} />
        </div>

        {/* MESSAGES */}
        <div ref={scrollRef} className="scroll" style={{
          display: "flex", flexDirection: "column", gap: 12,
          minHeight: 200, maxHeight: 360, overflowY: "auto",
          padding: "16px 28px",
        }}>
          {messages.map((m, i) => (
            <ChatMsg key={i} msg={m} user={user} />
          ))}
          {typing && <ChatMsg msg={{ role: "ai", typing: true }} user={user} />}
        </div>

        {/* INPUT — anchored to bottom of card */}
        <div style={{
          padding: "12px 16px 16px",
          borderTop: "1px solid var(--line-soft)",
          background: "var(--surface-2)",
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "var(--surface)", border: "1px solid var(--line)",
            borderRadius: 12, padding: "6px 6px 6px 14px",
            transition: "border-color .15s var(--ease), box-shadow .15s var(--ease)",
          }}>
            <input
              value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); send(); } }}
              placeholder="Escribe tu mensaje..."
              style={{
                flex: 1, border: "none", outline: "none",
                fontSize: 14, color: "var(--ink)", background: "transparent",
                padding: "8px 0",
              }} />
            <button title="Adjuntar PDF" className="focus-ring" style={{
              width: 34, height: 34, borderRadius: 9, border: "1px solid var(--line)",
              background: "var(--surface)", color: "var(--mute)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}><Ic.paperclip size={15} /></button>
            <button onClick={send} disabled={!input.trim()} className="focus-ring" title="Enviar" style={{
              width: 34, height: 34, borderRadius: 9, border: "none",
              background: input.trim() ? "var(--blue)" : "var(--line)",
              color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
              cursor: input.trim() ? "pointer" : "not-allowed",
              transition: "background .15s var(--ease)",
            }}><Ic.send size={15} /></button>
          </div>
          <div style={{
            marginTop: 8, fontSize: 11.5, color: "var(--mute)",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <Ic.info size={12} />
            Tus respuestas se guardan automáticamente. Puedes terminar cuando quieras.
          </div>
        </div>
      </Card>

      <Button variant="primary" size="lg" onClick={onGenerate}
        style={{
          width: "100%",
          background: "var(--success)",
          boxShadow: "0 1px 2px rgba(15,23,42,.06), 0 6px 14px -6px rgba(34,197,94,.45)",
        }}
        leftIcon={<Ic.sparkles size={16} />}>
        Generar CV
      </Button>
    </div>
  );
}

function ChatMsg({ msg, user }) {
  const isUser = msg.role === "user";
  return (
    <div style={{
      display: "flex", gap: 10,
      flexDirection: isUser ? "row-reverse" : "row",
      animation: "fadeUp .24s var(--ease)",
    }}>
      {isUser ? (
        <Avatar src={user.photo} name={user.name} size={32} />
      ) : (
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: "var(--lav)", color: "var(--blue)",
          display: "flex", alignItems: "center", justifyContent: "center", flex: "none",
        }}><Ic.sparkles size={16} /></div>
      )}
      <div style={{ maxWidth: "75%", display: "flex", flexDirection: "column", gap: 6, alignItems: isUser ? "flex-end" : "flex-start" }}>
        <div style={{
          background: isUser ? "var(--blue)" : "var(--surface-2)",
          color: isUser ? "#fff" : "var(--ink)",
          border: isUser ? "none" : "1px solid var(--line)",
          padding: "10px 14px", borderRadius: 14,
          borderTopLeftRadius: isUser ? 14 : 4,
          borderTopRightRadius: isUser ? 4 : 14,
          fontSize: 13.5, lineHeight: 1.5,
        }}>
          {msg.typing ? <TypingDotsOb /> : msg.text}
        </div>
        {msg.action && (
          <button style={{
            background: "var(--lav)", color: "var(--blue)",
            border: "1px solid #D6DEFE", borderRadius: 10,
            padding: "8px 12px", fontSize: 12.5, lineHeight: 1.4,
            textAlign: "left", cursor: "pointer", whiteSpace: "pre-line",
            maxWidth: "100%",
          }}>{msg.action}</button>
        )}
      </div>
    </div>
  );
}

function TypingDotsOb() {
  return (
    <span style={{ display: "inline-flex", gap: 4, padding: "4px 0" }}>
      {[0,1,2].map(i => (
        <span key={i} style={{
          width: 6, height: 6, borderRadius: "50%", background: "var(--mute)",
          animation: `fadeUp .9s ease-in-out ${i*.15}s infinite alternate`,
        }} />
      ))}
    </span>
  );
}

// Wrapper that holds step state. Rendered by app.jsx but DOES NOT render the Shell —
// app.jsx wraps it with a Shell configured for the current step.
function OnboardingScreen({ email, user, step, onContinue, onGenerate }) {
  if (step === "chat") {
    return <OnboardingChat user={user} onGenerate={onGenerate} />;
  }
  return <OnboardingForm email={email} onContinue={onContinue} />;
}

window.OnboardingScreen = OnboardingScreen;
