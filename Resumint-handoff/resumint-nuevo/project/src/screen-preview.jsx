const { useState, useEffect, useRef, useMemo, useLayoutEffect } = React;

// Preview screen — CV rendered + side panel with actions.

function PreviewScreen({ profile, plan, style, intent, jobDesc, onBack, onCreate, onEdit }) {
  const [editing, setEditing] = useState(false);
  const [corrections, setCorrections] = useState(false);
  const [loading, setLoading] = useState(true);
  const [backModalOpen, setBackModalOpen] = useState(false);
  const [localProfile, setLocalProfile] = useState(profile);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(t);
  }, []);

  // match is fake, stable
  const match = intent === "vacancy" ? 82 : null;
  const matchTone = match >= 80 ? "success" : match >= 55 ? "warn" : "danger";
  const matchLabel = match >= 80 ? "Excelente compatibilidad" : match >= 55 ? "Buena compatibilidad" : "Compatibilidad baja";

  function saveEdit() {
    setEditing(false);
    setCorrections(true);
    setTimeout(() => setCorrections(false), 4000);
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, maxWidth: 1340, margin: "0 auto" }}>

      {/* left: CV */}
      <div style={{
        background: "#EDF0F5", borderRadius: 16, padding: 32,
        minHeight: 900, display: "flex", justifyContent: "center",
        position: "relative",
      }}>
        {loading ? (
          <div style={{
            width: 794, minHeight: 1123, background: "#fff", borderRadius: 8,
            boxShadow: "var(--sh-2)", display: "flex", alignItems: "center", justifyContent: "center",
            flexDirection: "column", gap: 16, color: "var(--mute)",
          }}>
            <Spinner size={28} color="var(--blue)" />
            <div style={{ fontSize: 14 }}>Generando tu CV con IA...</div>
          </div>
        ) : (
          <div style={{ boxShadow: "var(--sh-3)", borderRadius: 8, overflow: "hidden", position: "relative" }}>
            <CvDocument
              style={style || "harvard"}
              profile={localProfile}
              showBranding={plan === "free"}
              editable={editing}
              onEdit={(field, val) => setLocalProfile(p => ({ ...p, [field]: val }))}
            />
            {editing && (
              <div style={{
                position: "absolute", top: 14, left: 14,
                background: "var(--deep)", color: "#fff",
                padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 500,
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <Ic.edit size={12} /> Modo edición
              </div>
            )}
          </div>
        )}
      </div>

      {/* right: panel */}
      <aside style={{ position: "sticky", top: 20, alignSelf: "start", display: "flex", flexDirection: "column", gap: 14 }}>
        {/* match card */}
        {match !== null && (
          <Card style={{ padding: 22 }}>
            <div style={{ fontSize: 12, color: "var(--mute)", fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>Match con la vacante</div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 10 }}>
              <Ring value={match} size={72} stroke={7}
                color={{ success: "#22C55E", warn: "#F59E0B", danger: "#EF4444" }[matchTone]}
                track="#EEF1F5" showPct={false} />
              <div>
                <div style={{ fontSize: 28, fontWeight: 700, color: "var(--deep)", letterSpacing: "-0.02em", lineHeight: 1 }}>
                  {match}%
                </div>
                <Badge tone={matchTone} style={{ marginTop: 6 }}>{matchLabel}</Badge>
              </div>
            </div>
            <div style={{ fontSize: 12, color: "var(--mute)", marginTop: 12, lineHeight: 1.5 }}>
              Este porcentaje es orientativo y no garantiza contratación.
            </div>
          </Card>
        )}

        {/* style info */}
        <Card style={{ padding: 22 }}>
          <div style={{ fontSize: 12, color: "var(--mute)", fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>Estilo elegido</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: "var(--deep)", marginTop: 4 }}>
            {CV_STYLES.find(s => s.id === style)?.name || "Estilo Harvard"}
          </div>
          <div style={{ fontSize: 13, color: "var(--mute)", marginTop: 2 }}>
            {CV_STYLES.find(s => s.id === style)?.desc}
          </div>
          <Button variant="secondary" size="sm" style={{ marginTop: 12, width: "100%" }} onClick={() => onBack()}>
            Cambiar estilo
          </Button>
        </Card>

        {/* actions */}
        <Card style={{ padding: 16 }}>
          {corrections && (
            <div style={{
              padding: "10px 12px", borderRadius: 10,
              background: "var(--success-50)", color: "#148B3D",
              fontSize: 12.5, marginBottom: 10,
              display: "flex", alignItems: "center", gap: 8,
              border: "1px solid #C9F0D6",
            }}>
              <Ic.checkCircle size={14} /> Se aplicaron correcciones menores.
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {editing ? (
              <Button variant="primary" onClick={saveEdit} leftIcon={<Ic.check size={16} />}>
                Guardar y revisar
              </Button>
            ) : (
              <Button variant="primary" onClick={onCreate} leftIcon={<Ic.sparkles size={16} />}>
                Crear CV
              </Button>
            )}
            <Button variant="secondary" onClick={() => setEditing(!editing)} leftIcon={<Ic.edit size={16} />}>
              {editing ? "Cancelar edición" : "Editar texto"}
            </Button>
            <Button variant="ghost" onClick={() => setBackModalOpen(true)} leftIcon={<Ic.chevL size={16} />}>
              Atrás
            </Button>
          </div>
        </Card>

        {/* tip */}
        <div style={{ fontSize: 12, color: "var(--mute)", padding: "0 4px", lineHeight: 1.5 }}>
          <Ic.info size={13} style={{ verticalAlign: "-2px", marginRight: 4 }} />
          Puedes editar cualquier texto del CV antes de crearlo definitivamente.
        </div>
      </aside>

      {/* Back modal */}
      <Modal open={backModalOpen} onClose={() => setBackModalOpen(false)}
        title="¿Volver atrás?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setBackModalOpen(false)}>Cancelar</Button>
            <Button variant="primary" onClick={() => { setBackModalOpen(false); onBack(); }}>Sí, volver</Button>
          </>
        }>
        Volver atrás generará un CV nuevo y consumirá una generación adicional. ¿Deseas continuar?
      </Modal>
    </div>
  );
}

window.PreviewScreen = PreviewScreen;
