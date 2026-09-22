const { useState, useEffect, useRef, useMemo, useLayoutEffect } = React;

// Éxito — download screen with confetti.

function ExitoScreen({ plan, onNav, onNewCv }) {
  const [confetti, setConfetti] = useState(true);
  useEffect(() => { const t = setTimeout(() => setConfetti(false), 4500); return () => clearTimeout(t); }, []);

  return (
    <div style={{ maxWidth: 620, margin: "60px auto 0", textAlign: "center", position: "relative" }}>
      <Confetti active={confetti} pieces={100} />
      <div style={{
        width: 84, height: 84, borderRadius: "50%",
        background: "var(--success-50)", color: "var(--success)",
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 24px",
        animation: "fadeUp .4s var(--ease)",
      }}><Ic.checkCircle size={44} /></div>

      <h1 style={{
        margin: "0 0 10px", fontSize: 32, fontWeight: 700,
        color: "var(--deep)", letterSpacing: "-0.02em",
      }}>¡Tu CV está listo!</h1>
      <p style={{ margin: "0 0 32px", color: "var(--mute)", fontSize: 15, lineHeight: 1.55 }}>
        Lo guardamos automáticamente en <strong style={{ color: "var(--deep)" }}>Mis CVs</strong>. Descárgalo o envíalo por correo cuando quieras.
      </p>

      <Card style={{ padding: 28 }}>
        <Button variant="primary" size="lg" leftIcon={<Ic.download size={18} />} style={{ width: "100%" }}>
          Descargar documento {plan === "pro" ? "(PDF + DOCX)" : "(PDF)"}
        </Button>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 14 }}>
          <Button variant="secondary" leftIcon={<Ic.mail size={15} />}>Enviar por email</Button>
          <Button variant="secondary" leftIcon={<Ic.plus size={15} />} onClick={onNewCv}>Generar otro</Button>
          <Button variant="secondary" leftIcon={<Ic.folder size={15} />} onClick={() => onNav("miscvs")}>Ver Mis CVs</Button>
        </div>
      </Card>

      {plan === "free" && (
        <div style={{
          marginTop: 18, padding: "14px 18px",
          background: "var(--lav)", borderRadius: 12, fontSize: 13,
          color: "var(--deep)", display: "flex", alignItems: "center", gap: 10,
        }}>
          <Ic.crown size={16} />
          <span style={{ flex: 1, textAlign: "left" }}>Con Pro descargas también en DOCX y sin branding.</span>
          <button onClick={() => onNav("planes")} style={{ background: "transparent", border: "none", color: "var(--blue)", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Ver planes</button>
        </div>
      )}
    </div>
  );
}

window.ExitoScreen = ExitoScreen;
