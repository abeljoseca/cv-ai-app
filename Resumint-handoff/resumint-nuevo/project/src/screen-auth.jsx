const { useState, useEffect, useRef, useMemo, useLayoutEffect } = React;

// Login / Register screen. Centered split hero.

function AuthScreen({ mode, onModeChange, onAuthed }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const isRegister = mode === "register";

  function submit(e) {
    e.preventDefault();
    const errs = {};
    if (!email) errs.email = "Ingresa tu correo";
    else if (!/^\S+@\S+\.\S+$/.test(email)) errs.email = "Correo no válido";
    if (!pw) errs.pw = "Ingresa tu contraseña";
    else if (isRegister && pw.length < 8) errs.pw = "Mínimo 8 caracteres";
    if (isRegister && pw2 !== pw) errs.pw2 = "Las contraseñas no coinciden";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onAuthed({ email, isNew: isRegister });
    }, 700);
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      {/* left: form */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "40px 32px",
      }}>
        <div style={{ width: 400, maxWidth: "100%" }}>
          <img src="assets/resumint-logo.svg" alt="Resumint" style={{ height: 32, marginBottom: 40 }} />
          <h1 style={{
            margin: "0 0 6px", fontSize: 28, fontWeight: 700,
            color: "var(--deep)", letterSpacing: "-0.02em",
          }}>
            {isRegister ? "Crea tu cuenta" : "Bienvenido de nuevo"}
          </h1>
          <p style={{ margin: "0 0 28px", color: "var(--mute)", fontSize: 14.5 }}>
            {isRegister
              ? "Empieza a crear CVs profesionales en minutos."
              : "Accede para seguir construyendo tu perfil."}
          </p>

          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Input label="Correo electrónico" required
              type="email" placeholder="tu@correo.com"
              value={email} onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              leftIcon={<Ic.mail size={18} />} />

            <Input label="Contraseña" required
              type={showPw ? "text" : "password"}
              placeholder={isRegister ? "Mínimo 8 caracteres" : "Tu contraseña"}
              value={pw} onChange={(e) => setPw(e.target.value)}
              error={errors.pw}
              rightSlot={
                <button type="button" onClick={() => setShowPw(!showPw)} className="focus-ring"
                  style={{ background: "transparent", border: "none", color: "var(--mute)", display: "flex", padding: 0 }}>
                  {showPw ? <Ic.eyeOff size={18} /> : <Ic.eye size={18} />}
                </button>} />

            {isRegister && (
              <Input label="Confirmar contraseña" required
                type={showPw ? "text" : "password"}
                placeholder="Repite tu contraseña"
                value={pw2} onChange={(e) => setPw2(e.target.value)}
                error={errors.pw2} />
            )}

            {!isRegister && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--ink)", cursor: "pointer" }}>
                  <input type="checkbox" style={{ accentColor: "var(--blue)" }} /> Recordarme
                </label>
                <a href="#" style={{ color: "var(--blue)", textDecoration: "none", fontWeight: 500 }}>¿Olvidaste tu contraseña?</a>
              </div>
            )}

            <Button variant="primary" type="submit" loading={loading} style={{ marginTop: 6 }}>
              {isRegister ? "Crear cuenta" : "Iniciar sesión"}
            </Button>
          </form>

          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            color: "var(--mute)", fontSize: 12.5, margin: "22px 0",
          }}>
            <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
            o
            <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
          </div>

          <Button variant="secondary" style={{ width: "100%" }}
            leftIcon={
              <svg width="16" height="16" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.9 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6c1.9-5.6 7.2-9.7 13.6-9.7z"/>
                <path fill="#4285F4" d="M46.5 24.6c0-1.6-.1-3.1-.4-4.6H24v9.1h12.7c-.6 3-2.3 5.5-4.9 7.2l7.5 5.8c4.4-4.1 7.2-10.1 7.2-17.5z"/>
                <path fill="#FBBC05" d="M10.4 28.9c-.5-1.4-.8-2.9-.8-4.4s.3-3 .8-4.4l-7.8-6C.9 17.1 0 20.5 0 24s.9 6.9 2.6 9.9l7.8-5z"/>
                <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.2-8.4 2.2-6.4 0-11.8-4.3-13.7-10l-7.8 6C6.5 42.6 14.6 48 24 48z"/>
              </svg>
            }>
            Continuar con Google
          </Button>

          <div style={{ textAlign: "center", marginTop: 24, fontSize: 13.5, color: "var(--mute)" }}>
            {isRegister ? "¿Ya tienes cuenta?" : "¿No tienes cuenta?"}{" "}
            <a href="#" onClick={(e) => { e.preventDefault(); onModeChange(isRegister ? "login" : "register"); }}
              style={{ color: "var(--blue)", textDecoration: "none", fontWeight: 600 }}>
              {isRegister ? "Inicia sesión" : "Crea una gratis"}
            </a>
          </div>
        </div>
      </div>

      {/* right: visual */}
      <div style={{
        flex: 1, background: "var(--deep)",
        position: "relative", overflow: "hidden",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff", padding: 48,
      }}>
        {/* subtle grid */}
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: .08 }}>
          <defs>
            <pattern id="g" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M48 0H0V48" fill="none" stroke="#fff" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#g)" />
        </svg>
        {/* soft glow */}
        <div style={{
          position: "absolute", top: "-20%", right: "-10%",
          width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(75,107,251,.35), transparent 70%)",
        }} />

        <div style={{ position: "relative", maxWidth: 440, textAlign: "left" }}>
          <Badge tone="lav" style={{ background: "rgba(255,255,255,.12)", color: "#C8D0FE", borderColor: "rgba(255,255,255,.15)" }}>
            <Ic.sparkles size={12} /> Impulsado con IA
          </Badge>
          <h2 style={{
            margin: "20px 0 14px", fontSize: 34, fontWeight: 700,
            lineHeight: 1.15, letterSpacing: "-0.02em",
          }}>
            Un CV profesional en menos de 10 minutos.
          </h2>
          <p style={{ margin: 0, color: "rgba(255,255,255,.72)", fontSize: 15, lineHeight: 1.55 }}>
            Conversa con la IA, adjunta tu CV antiguo y deja que Resumint cree versiones optimizadas para cada vacante.
          </p>

          <div style={{ marginTop: 32, display: "grid", gap: 14 }}>
            {[
              ["Perfil único, siempre actualizado", "Un solo lugar que crece contigo."],
              ["Optimizado para ATS", "Keywords y formato que pasan el filtro."],
              ["Seguimiento de aplicaciones", "No pierdas el hilo de tu búsqueda."],
            ].map(([t, d], i) => (
              <div key={i} style={{ display: "flex", gap: 12 }}>
                <span style={{
                  width: 24, height: 24, borderRadius: 8,
                  background: "rgba(75,107,251,.25)", color: "#C8D0FE",
                  display: "flex", alignItems: "center", justifyContent: "center", flex: "none",
                }}><Ic.check size={14} /></span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{t}</div>
                  <div style={{ color: "rgba(255,255,255,.6)", fontSize: 13 }}>{d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

window.AuthScreen = AuthScreen;
