const { useState, useEffect, useRef, useMemo, useLayoutEffect } = React;

// Seguimiento de Aplicaciones — tabla.

function SeguimientoScreen({ apps, cvs, plan, onAdd, onUpdate, onDelete }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);

  const filtered = apps.filter(a => {
    if (filter !== "all" && a.estado !== filter) return false;
    if (search && !(a.empresa + a.cargo).toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const estadoTone = { "En espera": "neutral", "Entrevistando": "lav", "Contratado": "success", "Rechazado": "danger", "Sin respuesta": "warn" };

  const limitReached = plan === "free" && apps.length >= 5;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      {/* filters */}
      <Card style={{ padding: 16, display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
        <Input placeholder="Buscar empresa o cargo..." value={search} onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Ic.search size={16} />} wrapStyle={{ flex: 1 }} />
        <select value={filter} onChange={(e) => setFilter(e.target.value)}
          style={{ border: "1px solid var(--line)", borderRadius: 10, padding: "10px 14px", fontSize: 14, outline: "none", background: "#fff", color: "var(--ink)" }}>
          <option value="all">Todos los estados</option>
          {["En espera","Entrevistando","Contratado","Rechazado","Sin respuesta"].map(s => <option key={s}>{s}</option>)}
        </select>
        <Button variant="primary" leftIcon={<Ic.plus size={15} />} onClick={() => setAddOpen(true)} disabled={limitReached}>
          Agregar aplicación
        </Button>
      </Card>

      {limitReached && (
        <div style={{
          padding: "14px 18px", background: "var(--warn-50)", color: "#8A5A04",
          borderRadius: 12, fontSize: 13, marginBottom: 14,
          display: "flex", alignItems: "center", gap: 10,
          border: "1px solid #F3DDA6",
        }}>
          <Ic.info size={16} />
          <span style={{ flex: 1 }}>Has alcanzado el límite de 5 aplicaciones del plan Gratuito.</span>
          <Button variant="primary" size="sm" leftIcon={<Ic.crown size={13} />}>Mejorar a Pro</Button>
        </div>
      )}

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
          <thead>
            <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--line)" }}>
              {["Empresa","Cargo","CV asociado","Fecha","Estado","Nota",""].map(h => (
                <th key={h} style={{ padding: "14px 16px", textAlign: "left", color: "var(--mute)", fontSize: 12, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(a => (
              <tr key={a.id} style={{ borderBottom: "1px solid var(--line-soft)" }}>
                <td style={{ padding: "14px 16px", fontWeight: 600, color: "var(--deep)" }}>{a.empresa}</td>
                <td style={{ padding: "14px 16px", color: "var(--ink)" }}>{a.cargo}</td>
                <td style={{ padding: "14px 16px", color: "var(--mute)" }}>{a.cvName}</td>
                <td style={{ padding: "14px 16px", color: "var(--mute)", fontVariantNumeric: "tabular-nums" }}>{a.fecha}</td>
                <td style={{ padding: "14px 16px" }}>
                  <Badge tone={estadoTone[a.estado]}>{a.estado}</Badge>
                </td>
                <td style={{ padding: "14px 16px", color: "var(--mute)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.nota || "—"}</td>
                <td style={{ padding: "14px 16px", textAlign: "right" }}>
                  <button onClick={() => onDelete(a.id)} style={{ background: "transparent", border: "none", color: "var(--mute)", padding: 6, borderRadius: 6, cursor: "pointer" }}><Ic.trash size={15} /></button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 60, textAlign: "center", color: "var(--mute)" }}>
                {apps.length === 0 ? "Aún no has registrado aplicaciones." : "Sin resultados para tu búsqueda."}
              </td></tr>
            )}
          </tbody>
        </table>
      </Card>

      <AddAppModal open={addOpen} cvs={cvs} onClose={() => setAddOpen(false)}
        onSave={(d) => { onAdd(d); setAddOpen(false); }} />
    </div>
  );
}

function AddAppModal({ open, cvs, onClose, onSave }) {
  const [form, setForm] = useState({ cvId: "", empresa: "", cargo: "", fecha: "2026-04-20", estado: "En espera", nota: "" });
  useEffect(() => { if (open && cvs[0]) setForm(f => ({ ...f, cvId: cvs[0].id })); }, [open]);
  return (
    <Modal open={open} onClose={onClose} width={520} title="Nueva aplicación"
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" onClick={() => onSave(form)} disabled={!form.empresa || !form.cargo}>Agregar</Button>
      </>}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <label style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--deep)" }}>CV asociado</span>
          <select value={form.cvId} onChange={(e) => setForm(f => ({ ...f, cvId: e.target.value }))}
            style={{ border: "1px solid var(--line)", borderRadius: 10, padding: "10px 14px", fontSize: 14, background: "#fff" }}>
            {cvs.map(c => <option key={c.id} value={c.id}>{c.titulo}</option>)}
          </select>
        </label>
        <Input label="Empresa" value={form.empresa} onChange={(e) => setForm(f => ({ ...f, empresa: e.target.value }))} required />
        <Input label="Cargo" value={form.cargo} onChange={(e) => setForm(f => ({ ...f, cargo: e.target.value }))} required />
        <Input label="Fecha" type="date" value={form.fecha} onChange={(e) => setForm(f => ({ ...f, fecha: e.target.value }))} />
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--deep)" }}>Estado</span>
          <select value={form.estado} onChange={(e) => setForm(f => ({ ...f, estado: e.target.value }))}
            style={{ border: "1px solid var(--line)", borderRadius: 10, padding: "10px 14px", fontSize: 14, background: "#fff" }}>
            {["En espera","Entrevistando","Contratado","Rechazado","Sin respuesta"].map(s => <option key={s}>{s}</option>)}
          </select>
        </label>
        <Textarea label="Nota" rows={3} value={form.nota} onChange={(e) => setForm(f => ({ ...f, nota: e.target.value }))} />
      </div>
    </Modal>
  );
}

window.SeguimientoScreen = SeguimientoScreen;
