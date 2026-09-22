const { useState, useEffect, useRef, useMemo, useLayoutEffect } = React;

// Mis CVs — historial with KPIs and grid cards.

function MisCvsScreen({ cvs, profile, plan, onNav, onApplied, onDeleteCv }) {
  const [applyCv, setApplyCv] = useState(null);

  const kpis = {
    total: cvs.length,
    aplicados: cvs.filter(c => c.aplicado).length,
    entrevistas: 1,
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      {/* Metrics header */}
      <div style={{ marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: "var(--deep)", letterSpacing: "-0.01em" }}>Tus métricas</h2>
        <div style={{ marginTop: 4, color: "var(--mute)", fontSize: 13.5 }}>Esto es lo que has logrado desde que utilizas Resumint.</div>
      </div>

      {/* KPIs */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        <KpiCard label="CVs generados" value={kpis.total} icon={<Ic.file size={22} />} />
        <KpiCard label="Trabajos aplicados" value={kpis.aplicados} tone="lav" icon={<Ic.briefcase size={22} />} />
        <KpiCard label="Entrevistas conseguidas" value={kpis.entrevistas} tone="success" icon={<Ic.award size={22} />} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: "var(--deep)" }}>Tus CVs</h2>
        <Button variant="primary" leftIcon={<Ic.plus size={16} />} onClick={() => onNav("crear")}>Generar nuevo CV</Button>
      </div>

      {cvs.length === 0 ? (
        <Card style={{ padding: 60, textAlign: "center" }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16, background: "var(--lav)",
            color: "var(--blue)", margin: "0 auto 16px",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}><Ic.folder size={30} /></div>
          <h3 style={{ margin: "0 0 6px", color: "var(--deep)", fontSize: 17 }}>Aún no tienes CVs</h3>
          <div style={{ color: "var(--mute)", fontSize: 14, marginBottom: 18 }}>Genera tu primer CV y aparecerá aquí.</div>
          <Button variant="primary" onClick={() => onNav("crear")}>Crear mi primer CV</Button>
        </Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {cvs.map((cv) => (
            <Card key={cv.id} hover style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <div style={{ background: "var(--surface-2)", padding: 12, borderBottom: "1px solid var(--line)" }}>
                <div style={{
                  aspectRatio: "794/1123", background: "#fff", borderRadius: 6,
                  overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,.04)",
                  position: "relative",
                }}>
                  <div style={{ width: 794, transformOrigin: "top left", transform: "scale(0.4)" }}>
                    <CvDocument style={cv.style} profile={profile} showBranding={plan === "free"} />
                  </div>
                </div>
              </div>
              <div style={{ padding: 16, flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14.5, color: "var(--deep)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {cv.titulo}
                    </div>
                    {cv.empresa && (
                      <div style={{ fontSize: 12.5, color: "var(--mute)", marginTop: 2 }}>
                        Para <strong style={{ color: "var(--deep)" }}>{cv.empresa}</strong>
                      </div>
                    )}
                  </div>
                  <Badge tone={cv.intent === "vacancy" ? "lav" : "neutral"}>
                    {cv.intent === "vacancy" ? "Vacante" : "General"}
                  </Badge>
                </div>
                <div style={{ fontSize: 12, color: "var(--mute)", marginTop: 6 }}>{cv.fecha}</div>
                <div style={{ flex: 1 }} />
                <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
                  <Button variant="secondary" size="sm" leftIcon={<Ic.download size={14} />} style={{ flex: 1 }}>PDF</Button>
                  <Button variant="secondary" size="sm" leftIcon={<Ic.mail size={14} />} />
                  <Button variant="secondary" size="sm" leftIcon={<Ic.trash size={14} />} onClick={() => onDeleteCv(cv.id)} />
                </div>
                {cv.aplicado ? (
                  <div style={{
                    marginTop: 8, padding: "6px 10px", borderRadius: 8,
                    background: "var(--success-50)", color: "#148B3D",
                    fontSize: 12, display: "flex", alignItems: "center", gap: 6,
                  }}><Ic.check size={12} /> Aplicado</div>
                ) : (
                  <button onClick={() => setApplyCv(cv)} style={{
                    marginTop: 8, padding: "8px 10px", borderRadius: 8,
                    border: "1px dashed var(--line)", background: "transparent",
                    color: "var(--mute)", fontSize: 12.5, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%",
                  }}><Ic.plus size={13} /> Apliqué con este CV</button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <ApplyModal open={!!applyCv} cv={applyCv} onClose={() => setApplyCv(null)}
        onSave={(data) => { onApplied(applyCv.id, data); setApplyCv(null); }} />
    </div>
  );
}

function ApplyModal({ open, cv, onClose, onSave }) {
  const [form, setForm] = useState({ puesto: "", empresa: "", fecha: "", estado: "En espera", nota: "" });
  useEffect(() => {
    if (cv) setForm({ puesto: cv.titulo || "", empresa: cv.empresa || "", fecha: "2026-04-20", estado: "En espera", nota: "" });
  }, [cv?.id]);
  return (
    <Modal open={open} onClose={onClose} width={520} title="Registrar aplicación"
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" onClick={() => onSave(form)}>Guardar aplicación</Button>
      </>}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Input label="Puesto" value={form.puesto} onChange={(e) => setForm(f => ({ ...f, puesto: e.target.value }))} wrapStyle={{ gridColumn: "1 / -1" }} />
        <Input label="Empresa" value={form.empresa} onChange={(e) => setForm(f => ({ ...f, empresa: e.target.value }))} />
        <Input label="Fecha" type="date" value={form.fecha} onChange={(e) => setForm(f => ({ ...f, fecha: e.target.value }))} />
        <label style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--deep)" }}>Estado</span>
          <select value={form.estado} onChange={(e) => setForm(f => ({ ...f, estado: e.target.value }))}
            style={{ border: "1px solid var(--line)", borderRadius: 10, padding: "10px 14px", fontSize: 14, outline: "none", background: "#fff" }}>
            {["En espera","Entrevistando","Contratado","Rechazado","Sin respuesta"].map(s => <option key={s}>{s}</option>)}
          </select>
        </label>
        <Textarea label="Nota" rows={3} value={form.nota} onChange={(e) => setForm(f => ({ ...f, nota: e.target.value }))} />
      </div>
    </Modal>
  );
}

window.MisCvsScreen = MisCvsScreen;
