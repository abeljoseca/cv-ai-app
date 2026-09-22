const { useState, useEffect, useRef, useMemo, useLayoutEffect } = React;

// Planes — pricing + billing history.

function PlanesScreen({ plan, onUpgrade, onDowngrade }) {
  const [billing, setBilling] = useState("mensual"); // mensual | anual

  const features = {
    free: [
      "3 generaciones con IA por mes",
      "Hasta 5 aplicaciones en seguimiento",
      "Descarga en PDF",
      "Marca de agua MockJobs",
      "1 estilo de CV",
    ],
    pro: [
      "Generaciones ilimitadas con IA",
      "Aplicaciones ilimitadas",
      "Descarga en PDF y DOCX",
      "Sin marca de agua",
      "3 estilos premium de CV",
      "Análisis de compatibilidad avanzado",
      "Soporte prioritario",
    ],
  };

  const proPrice = billing === "mensual" ? { price: "$9.99", cadence: "/mes" } : { price: "$79", cadence: "/año", save: "Ahorras $40" };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 700, color: "var(--deep)", letterSpacing: "-0.02em" }}>
          Potencia tu búsqueda de trabajo
        </h1>
        <p style={{ margin: "10px 0 0", color: "var(--mute)", fontSize: 15 }}>
          Elige el plan que se ajuste a tu ritmo. Sin compromisos.
        </p>

        <div style={{
          display: "inline-flex", padding: 4, background: "var(--surface-2)",
          borderRadius: 12, marginTop: 22, border: "1px solid var(--line)",
        }}>
          {[{ id: "mensual", label: "Mensual" }, { id: "anual", label: "Anual · -33%" }].map(o => (
            <button key={o.id} onClick={() => setBilling(o.id)} style={{
              padding: "8px 20px", borderRadius: 9, border: "none", cursor: "pointer",
              fontSize: 13.5, fontWeight: 600,
              background: billing === o.id ? "#fff" : "transparent",
              color: billing === o.id ? "var(--deep)" : "var(--mute)",
              boxShadow: billing === o.id ? "0 1px 3px rgba(0,0,0,.06)" : "none",
              transition: "all .16s",
            }}>{o.label}</button>
          ))}
        </div>
      </div>

      {/* plans */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, maxWidth: 860, margin: "0 auto" }}>
        {/* Free */}
        <Card style={{ padding: 32, position: "relative" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--mute)", letterSpacing: "0.04em", textTransform: "uppercase" }}>Gratuito</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 14 }}>
            <span style={{ fontSize: 44, fontWeight: 700, color: "var(--deep)", letterSpacing: "-0.03em" }}>$0</span>
            <span style={{ color: "var(--mute)", fontSize: 14 }}>/siempre</span>
          </div>
          <p style={{ color: "var(--mute)", fontSize: 13.5, margin: "8px 0 22px" }}>Ideal para probar MockJobs.</p>

          {plan === "free" ? (
            <Button variant="secondary" size="lg" style={{ width: "100%" }} disabled>Plan actual</Button>
          ) : (
            <Button variant="secondary" size="lg" style={{ width: "100%" }} onClick={onDowngrade}>Cambiar a Gratuito</Button>
          )}

          <ul style={{ listStyle: "none", padding: 0, margin: "24px 0 0", display: "flex", flexDirection: "column", gap: 10 }}>
            {features.free.map(f => (
              <li key={f} style={{ display: "flex", gap: 10, fontSize: 13.5, color: "var(--ink)" }}>
                <span style={{ color: "var(--success)", flexShrink: 0, marginTop: 2 }}><Ic.check size={14} /></span>{f}
              </li>
            ))}
          </ul>
        </Card>

        {/* Pro */}
        <Card style={{
          padding: 32, position: "relative",
          background: "linear-gradient(180deg, #F8F5FF 0%, #FFFFFF 60%)",
          border: "2px solid var(--blue)",
        }}>
          <div style={{
            position: "absolute", top: -12, right: 24,
            background: "var(--blue)", color: "#fff",
            padding: "4px 12px", borderRadius: 999, fontSize: 11, fontWeight: 600,
            letterSpacing: "0.04em", textTransform: "uppercase",
          }}>Recomendado</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--blue)", letterSpacing: "0.04em", textTransform: "uppercase" }}>Pro</div>
            <Ic.crown size={16} style={{ color: "var(--blue)" }} />
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 14 }}>
            <span style={{ fontSize: 44, fontWeight: 700, color: "var(--deep)", letterSpacing: "-0.03em" }}>{proPrice.price}</span>
            <span style={{ color: "var(--mute)", fontSize: 14 }}>{proPrice.cadence}</span>
          </div>
          <p style={{ color: "var(--mute)", fontSize: 13.5, margin: "8px 0 22px" }}>
            {proPrice.save ? <span style={{ color: "var(--success)", fontWeight: 600 }}>{proPrice.save} · </span> : null}
            Para quien busca trabajo en serio.
          </p>

          {plan === "pro" ? (
            <Button variant="secondary" size="lg" style={{ width: "100%" }} disabled>Plan actual</Button>
          ) : (
            <Button variant="primary" size="lg" style={{ width: "100%" }} leftIcon={<Ic.sparkles size={16} />} onClick={onUpgrade}>
              Mejorar a Pro
            </Button>
          )}

          <ul style={{ listStyle: "none", padding: 0, margin: "24px 0 0", display: "flex", flexDirection: "column", gap: 10 }}>
            {features.pro.map(f => (
              <li key={f} style={{ display: "flex", gap: 10, fontSize: 13.5, color: "var(--ink)" }}>
                <span style={{ color: "var(--blue)", flexShrink: 0, marginTop: 2 }}><Ic.check size={14} /></span>{f}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* billing history */}
      {plan === "pro" && (
        <Card style={{ padding: 24, marginTop: 40 }}>
          <h3 style={{ margin: "0 0 14px", fontSize: 15, color: "var(--deep)", fontWeight: 600 }}>Historial de pagos</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
            <thead><tr style={{ borderBottom: "1px solid var(--line)" }}>
              {["Fecha","Concepto","Monto","Estado",""].map(h => (
                <th key={h} style={{ padding: "10px 0", textAlign: "left", color: "var(--mute)", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {[
                { f: "01/04/2026", c: "Plan Pro · Mensual", m: "$9.99", e: "Pagado" },
                { f: "01/03/2026", c: "Plan Pro · Mensual", m: "$9.99", e: "Pagado" },
                { f: "01/02/2026", c: "Plan Pro · Mensual", m: "$9.99", e: "Pagado" },
              ].map((r, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--line-soft)" }}>
                  <td style={{ padding: "12px 0", color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{r.f}</td>
                  <td style={{ padding: "12px 0", color: "var(--ink)" }}>{r.c}</td>
                  <td style={{ padding: "12px 0", color: "var(--ink)", fontWeight: 600 }}>{r.m}</td>
                  <td style={{ padding: "12px 0" }}><Badge tone="success">{r.e}</Badge></td>
                  <td style={{ padding: "12px 0", textAlign: "right" }}>
                    <button style={{ background: "transparent", border: "none", color: "var(--blue)", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>Descargar factura</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

window.PlanesScreen = PlanesScreen;
