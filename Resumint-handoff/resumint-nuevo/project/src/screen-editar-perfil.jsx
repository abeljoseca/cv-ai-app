const { useState, useEffect, useRef, useMemo, useLayoutEffect } = React;

// Editar Perfil — accessed from the user card in the sidebar.
// Lets the user update basic identity info (the same fields captured at onboarding).

function EditarPerfilScreen({ user, profile, onSave, onCancel }) {
  const [form, setForm] = useState({
    nombre: profile.nombre || "",
    apellido: profile.apellido || "",
    profesion: profile.profesion || "",
    emailCv: profile.emailCv || "",
    telefono: profile.telefono || "",
    ciudad: profile.ciudad || "",
    pais: profile.pais || "",
    photo: profile.photo || user.photo || null,
  });
  const [photoHover, setPhotoHover] = useState(false);
  const [savedPulse, setSavedPulse] = useState(false);
  const fileRef = useRef();

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function onPhoto(e) {
    const f = e.target.files?.[0]; if (!f) return;
    set("photo", URL.createObjectURL(f));
  }
  function clearPhoto(e) {
    e.stopPropagation();
    set("photo", null);
    if (fileRef.current) fileRef.current.value = "";
  }

  const emailValid = /^\S+@\S+\.\S+$/.test(form.emailCv);
  const canSave = !!form.nombre && !!form.apellido && emailValid;

  // dirty check vs. profile
  const dirty = useMemo(() => {
    return ["nombre","apellido","profesion","emailCv","telefono","ciudad","pais","photo"]
      .some(k => (profile[k] || "") !== (form[k] || ""));
  }, [form, profile]);

  function submit(e) {
    e.preventDefault();
    if (!canSave) return;
    onSave(form);
    setSavedPulse(true);
    setTimeout(() => setSavedPulse(false), 1400);
  }

  const firstName = (form.nombre || user.name?.split(" ")[0] || "Nombre");

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
            Hola, {firstName}
          </h2>
          <p style={{ margin: 0, color: "var(--mute)", fontSize: 13.5, lineHeight: 1.55 }}>
            Si deseas modificar alguno de tus datos personales, aquí puedes hacerlo.<br />
            Estos datos nos ayudarán a generar tu CV profesional.
          </p>
        </div>

        <div style={{ padding: "28px 40px 32px" }}>
          <form onSubmit={submit}>
            {/* PHOTO ROW */}
            <div style={{
              display: "flex", alignItems: "center", gap: 20,
              padding: "18px 20px",
              background: "var(--surface-2)",
              border: "1px solid var(--line-soft)",
              borderRadius: 14,
              marginBottom: 26,
            }}>
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

            {/* DATOS PERSONALES */}
            <SectionLabelEdit>Datos personales</SectionLabelEdit>
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

            {/* CONTACTO */}
            <SectionLabelEdit>Contacto</SectionLabelEdit>
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

            {/* UBICACIÓN */}
            <SectionLabelEdit>Ubicación</SectionLabelEdit>
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
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                {savedPulse && (
                  <span style={{ color: "var(--success)", fontSize: 12.5, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <Ic.checkCircle size={14} /> Cambios guardados
                  </span>
                )}
                <Button variant="secondary" type="button" onClick={onCancel}>
                  Cancelar
                </Button>
                <Button variant="primary" type="submit" size="lg"
                  disabled={!canSave || !dirty}
                  style={{ minWidth: 200 }}>
                  Guardar cambios
                </Button>
              </div>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}

function SectionLabelEdit({ children }) {
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

window.EditarPerfilScreen = EditarPerfilScreen;
