// Main app: auth gate → shell with routed screens. Holds global state.

const { useState: useStateApp, useEffect: useEffectApp, useMemo: useMemoApp } = React;

const DEMO_USER = {
  name: "María González",
  email: "maria.gonzalez@email.com",
  photo: "assets/avatar.png",
};

const DEMO_PROFILE = {
  nombre: "María",
  apellido: "González",
  profesion: "Diseñadora de Producto Senior",
  telefono: "+52 55 1234 5678",
  emailCv: "maria.gonzalez@email.com",
  ciudad: "Ciudad de México",
  pais: "México",
  photo: "assets/avatar.png",
  completitud: 78,
  resumen: "Diseñadora de producto con 6+ años creando experiencias digitales centradas en el usuario para fintech y SaaS. Lidero procesos de diseño end-to-end desde investigación hasta handoff con ingeniería, con foco en métricas de negocio y accesibilidad.",
  experiencia: [
    {
      cargo: "Senior Product Designer",
      empresa: "Kavak",
      lugar: "CDMX · Híbrido",
      periodo: "2023 — Presente",
      descripcion: "Lidero el rediseño del flujo de checkout (+22% conversión), coordino el sistema de diseño con 4 diseñadores y 12 ingenieros, y facilito sesiones de research con usuarios en 3 países.",
    },
    {
      cargo: "Product Designer",
      empresa: "Clip",
      lugar: "CDMX",
      periodo: "2020 — 2023",
      descripcion: "Diseñé la app para más de 200k comercios, con 4.7★ en App Store. Reduje el tiempo de onboarding en 40% mediante pruebas de usabilidad iterativas.",
    },
    {
      cargo: "UX Designer",
      empresa: "Estudio Lumo",
      lugar: "Remoto",
      periodo: "2018 — 2020",
      descripcion: "Entregué 15+ proyectos para clientes en banca, retail y educación, liderando discovery y prototipado de alta fidelidad.",
    },
  ],
  educacion: [
    { titulo: "Lic. en Diseño de la Comunicación Gráfica", institucion: "UAM Xochimilco", periodo: "2013 — 2017" },
    { titulo: "Certificación UX Research", institucion: "Nielsen Norman Group", periodo: "2021" },
  ],
  skillsHard: ["Figma", "Prototipado", "Research", "Design Systems", "HTML/CSS", "Accessibility", "Data analysis", "Motion"],
  skillsSoft: ["Liderazgo", "Comunicación", "Pensamiento crítico", "Empatía", "Mentoría"],
  idiomas: [
    { nombre: "Español", nivel: "Nativo" },
    { nombre: "Inglés", nivel: "Avanzado (C1)" },
    { nombre: "Portugués", nivel: "Intermedio (B1)" },
  ],
  logros: [
    { titulo: "Design Awards 2024", descripcion: "Reconocimiento a mejor rediseño fintech en Latam." },
    { titulo: "Mentor del año", descripcion: "Programa Women in Product Design 2023." },
    { titulo: "Speaker Config Latam", descripcion: "Ponencia sobre sistemas de diseño escalables." },
  ],
};

const DEMO_CVS = [
  { id: "cv1", titulo: "Senior Product Designer", empresa: "Mercado Libre", fecha: "18 abr 2026", style: "harvard", intent: "vacancy", aplicado: true },
  { id: "cv2", titulo: "UX Lead", empresa: null, fecha: "14 abr 2026", style: "stanford", intent: "general", aplicado: false },
  { id: "cv3", titulo: "Product Designer Remote", empresa: "Rappi", fecha: "02 abr 2026", style: "siliconvalley", intent: "vacancy", aplicado: true },
];

const DEMO_APPS = [
  { id: "a1", cvId: "cv1", cvName: "Senior Product Designer", empresa: "Mercado Libre", cargo: "Senior Product Designer", fecha: "18 abr 2026", estado: "Entrevistando", nota: "Segunda ronda el 25 de abril." },
  { id: "a2", cvId: "cv3", cvName: "Product Designer Remote", empresa: "Rappi", cargo: "Product Designer", fecha: "02 abr 2026", estado: "En espera", nota: "" },
  { id: "a3", cvId: "cv1", cvName: "Senior Product Designer", empresa: "Nu México", cargo: "Staff Designer", fecha: "28 mar 2026", estado: "Rechazado", nota: "Buscan perfil más senior." },
];

function App() {
  // auth
  const [authed, setAuthed] = useStateApp(true); // start logged-in for demo speed; auth screen reachable via Logout
  const [authMode, setAuthMode] = useStateApp("login");
  const [onboarded, setOnboarded] = useStateApp(false);
  const [onboardStep, setOnboardStep] = useStateApp("form"); // "form" | "chat"

  // route
  const [route, setRoute] = useStateApp("perfil"); // perfil | crear | chat | preview | exito | miscvs | seguimiento | planes

  // data
  const [user, setUser] = useStateApp(DEMO_USER);
  const [profile, setProfile] = useStateApp(DEMO_PROFILE);
  const [plan, setPlan] = useStateApp("free"); // free | pro
  const [cvs, setCvs] = useStateApp(DEMO_CVS);
  const [apps, setApps] = useStateApp(DEMO_APPS);

  // transient flow state for CV generation
  const [flow, setFlow] = useStateApp({ style: null, intent: null, jobDesc: "" });

  // toast
  const [toast, setToast] = useStateApp(null);
  function notify(msg, tone = "success") { setToast({ msg, tone }); }

  // handlers
  function nav(r) { setRoute(r); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function handleAuthed(email) {
    setUser({ ...DEMO_USER, email });
    setAuthed(true);
    if (!onboarded) setRoute("onboarding");
    else setRoute("perfil");
  }
  function handleOnboardForm(data) {
    setProfile({ ...profile, ...data, completitud: 35 });
    setUser({ ...user, name: `${data.nombre} ${data.apellido}`, photo: data.photo || user.photo });
    setOnboardStep("chat");
  }
  function handleOnboardComplete() {
    setOnboarded(true);
    setRoute("perfil");
    notify("Perfil actualizado con tu info");
  }
  function handleCreateCv() {
    // generate from flow
    const newCv = {
      id: "cv" + (cvs.length + 1),
      titulo: flow.intent === "vacancy" ? "Senior Product Designer" : "CV general",
      empresa: flow.intent === "vacancy" ? "TechCorp" : null,
      fecha: "24 abr 2026",
      style: flow.style || "harvard",
      intent: flow.intent || "general",
      aplicado: false,
    };
    setCvs([newCv, ...cvs]);
    setRoute("exito");
  }
  function handleApplied(cvId, data) {
    setCvs(cvs.map(c => c.id === cvId ? { ...c, aplicado: true } : c));
    const cv = cvs.find(c => c.id === cvId);
    const newApp = {
      id: "a" + (apps.length + 1),
      cvId, cvName: cv.titulo,
      empresa: data.empresa, cargo: data.puesto,
      fecha: data.fecha, estado: data.estado, nota: data.nota,
    };
    setApps([newApp, ...apps]);
    notify("Aplicación registrada");
  }

  // screens that use shell
  const inShell = authed && onboarded && !["onboarding","chat"].includes(route);

  // topbar content per route
  const topbarTitle = {
    perfil: "Mi Perfil", editarPerfil: "Editar perfil",
    crear: "Crear CV", preview: "Vista previa", exito: "¡CV creado!",
    miscvs: "Mis CVs", seguimiento: "Seguimiento de aplicaciones", planes: "Planes",
  }[route];

  if (!authed) {
    return (
      <>
        <AuthScreen mode={authMode} onModeChange={setAuthMode} onAuthed={handleAuthed} />
        <Toast toast={toast} onDone={() => setToast(null)} />
      </>
    );
  }

  if (!onboarded) {
    const obRight = (
      <Button variant="primary" size="sm" leftIcon={<Ic.crown size={14} />} onClick={() => {}}>
        Mejorar cuenta
      </Button>
    );
    return (
      <>
        <Shell
          route={onboardStep === "chat" ? "perfil" : ""}
          onNav={() => {}}
          user={user}
          plan={plan}
          onUpgrade={() => {}}
          onLogout={() => { setAuthed(false); setOnboarded(false); setOnboardStep("form"); }}
          navDisabled={onboardStep === "form"}
          hideUserCard={onboardStep === "form"}
          topbar={<Topbar title="Bienvenido a Resumint" centerTitle right={obRight} plan={plan} />}
        >
          <OnboardingScreen
            email={user.email}
            user={user}
            step={onboardStep}
            onContinue={handleOnboardForm}
            onGenerate={handleOnboardComplete}
          />
        </Shell>
        <Toast toast={toast} onDone={() => setToast(null)} />
      </>
    );
  }

  // chat is full-screen too
  if (route === "chat") {
    return (
      <>
        <ChatScreen user={user}
          onGenerate={() => { setRoute("perfil"); notify("Perfil actualizado con tu info"); }}
          onAttach={() => notify("Archivo procesado")}
          onNav={nav} />
        <Toast toast={toast} onDone={() => setToast(null)} />
      </>
    );
  }

  // Topbar right: plan badge + upgrade CTA
  const topbarRight = (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      {plan === "free" ? (
        <Button variant="primary" size="sm" leftIcon={<Ic.crown size={14} />} onClick={() => nav("planes")}>
          Mejorar a Pro
        </Button>
      ) : (
        <Badge tone="lav" leftIcon={<Ic.crown size={12} />}>Plan Pro</Badge>
      )}
      <button className="focus-ring" style={{
        background: "transparent", border: "1px solid var(--line)",
        width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--mute)",
      }} aria-label="Notificaciones"><Ic.bell size={16} /></button>
    </div>
  );

  return (
    <Shell route={route} onNav={nav} user={user} plan={plan}
      onUpgrade={() => nav("planes")}
      onLogout={() => { setAuthed(false); setRoute("perfil"); }}
      topbar={<Topbar title={topbarTitle} right={topbarRight} plan={plan} />}
    >
      {route === "perfil" && (
        <PerfilScreen user={user} profile={profile} onNav={nav}
          onUpdate={(p) => setProfile({ ...profile, ...p })} />
      )}
      {route === "editarPerfil" && (
        <EditarPerfilScreen user={user} profile={profile}
          onCancel={() => nav("perfil")}
          onSave={(p) => {
            setProfile({ ...profile, ...p });
            // also keep the user object in sync (name + photo) so the sidebar updates
            setUser({ ...user,
              name: `${p.nombre || ""} ${p.apellido || ""}`.trim() || user.name,
              photo: p.photo ?? user.photo,
            });
            notify("Cambios guardados");
          }} />
      )}
      {route === "crear" && (
        <CrearScreen profile={profile} plan={plan}
          onNav={nav}
          onPreview={(cfg) => { setFlow(cfg); setRoute("preview"); }} />
      )}
      {route === "preview" && (
        <PreviewScreen profile={profile} plan={plan}
          style={flow.style} intent={flow.intent} jobDesc={flow.jobDesc}
          onBack={() => setRoute("crear")}
          onCreate={handleCreateCv}
          onEdit={() => notify("Correcciones aplicadas")} />
      )}
      {route === "exito" && (
        <ExitoScreen plan={plan} onNav={nav} onNewCv={() => nav("crear")} />
      )}
      {route === "miscvs" && (
        <MisCvsScreen cvs={cvs} profile={profile} plan={plan} onNav={nav}
          onApplied={handleApplied}
          onDeleteCv={(id) => { setCvs(cvs.filter(c => c.id !== id)); notify("CV eliminado"); }} />
      )}
      {route === "seguimiento" && (
        <SeguimientoScreen apps={apps} cvs={cvs} plan={plan}
          onAdd={(d) => {
            const cv = cvs.find(c => c.id === d.cvId);
            setApps([{ id: "a" + (apps.length + 1), cvId: d.cvId, cvName: cv?.titulo || "", empresa: d.empresa, cargo: d.cargo, fecha: d.fecha, estado: d.estado, nota: d.nota }, ...apps]);
            notify("Aplicación agregada");
          }}
          onUpdate={() => {}}
          onDelete={(id) => { setApps(apps.filter(a => a.id !== id)); notify("Aplicación eliminada"); }} />
      )}
      {route === "planes" && (
        <PlanesScreen plan={plan}
          onUpgrade={() => { setPlan("pro"); notify("¡Bienvenido a Pro!"); }}
          onDowngrade={() => { setPlan("free"); notify("Plan cambiado a Gratuito"); }} />
      )}
      <Toast toast={toast} onDone={() => setToast(null)} />
    </Shell>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
