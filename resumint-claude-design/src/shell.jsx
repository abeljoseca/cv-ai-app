const { useState, useEffect, useRef, useMemo, useLayoutEffect } = React;

// App shell: sidebar + top bar. Exports Shell wrapper.

const NAV = [
  { id: "perfil",      label: "Mi Perfil",    icon: "user" },
  { id: "crear",       label: "Crear CV",     icon: "file" },
  { id: "miscvs",      label: "Mis CVs",      icon: "folder" },
  { id: "historial",   label: "Historial",    icon: "history" },
  { id: "seguimiento", label: "Seguimiento",  icon: "track" },
];

function Sidebar({ route, onNav, user, plan, onUpgrade, onLogout, navDisabled, hideUserCard }) {
  return (
    <aside style={{
      width: 256, flex: "none",
      background: "var(--surface)",
      borderRight: "1px solid var(--line)",
      display: "flex", flexDirection: "column",
      padding: "22px 16px 18px",
      height: "100vh", position: "sticky", top: 0,
    }}>
      {/* logo */}
      <div style={{ padding: "4px 8px 18px", display: "flex", alignItems: "center" }}>
        <img src="assets/resumint-logo.svg" alt="Resumint" style={{ height: 28 }} />
      </div>

      {/* nav */}
      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV.map((n) => {
          const active = route === n.id && !navDisabled;
          const IconC = Ic[n.icon];
          const disabled = navDisabled;
          return (
            <button key={n.id} onClick={() => !disabled && onNav(n.id)}
              disabled={disabled} className="focus-ring"
              aria-disabled={disabled}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 12px", borderRadius: 10,
                border: "none",
                background: active ? "var(--lav)" : "transparent",
                color: disabled ? "#B6BFCC" : (active ? "var(--blue)" : "var(--ink)"),
                fontWeight: active ? 600 : 500, fontSize: 14,
                textAlign: "left", transition: "all .15s var(--ease)",
                width: "100%",
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.55 : 1,
              }}
              onMouseEnter={(e) => { if (!active && !disabled) e.currentTarget.style.background = "var(--hover)"; }}
              onMouseLeave={(e) => { if (!active && !disabled) e.currentTarget.style.background = "transparent"; }}
            >
              <IconC size={18} />
              {n.label}
            </button>
          );
        })}
      </nav>

      <div style={{ flex: 1 }} />

      {/* upgrade card */}
      {plan === "free" && (
        <div style={{
          background: "linear-gradient(180deg, #F7F8FE 0%, #EEF1FE 100%)",
          border: "1px solid #DDE3FE",
          borderRadius: 14, padding: 16, marginBottom: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{
              width: 28, height: 28, borderRadius: 8,
              background: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
              color: "#F59E0B",
            }}><Ic.crown size={16} /></span>
            <span style={{ fontWeight: 600, fontSize: 13.5, color: "var(--deep)" }}>Mejora tu cuenta</span>
          </div>
          <div style={{ color: "var(--mute)", fontSize: 12, lineHeight: 1.45, marginBottom: 10 }}>
            Desbloquea más funciones y herramientas premium.
          </div>
          <Button variant="primary" size="sm" onClick={onUpgrade} style={{ width: "100%" }}>
            Mejorar ahora
          </Button>
        </div>
      )}

      {/* user card */}
      {!hideUserCard && (
      <div onClick={() => !navDisabled && onNav("editarPerfil")} style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: 10, borderRadius: 12, border: "1px solid var(--line)",
        background: route === "editarPerfil" ? "var(--lav)" : "var(--surface)", cursor: "pointer",
        transition: "background .15s var(--ease)",
      }}>
        <Avatar src={user.photo} name={user.name} size={36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--deep)",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {user.name}
          </div>
          <div style={{ fontSize: 12, color: route === "editarPerfil" ? "var(--blue)" : "var(--mute)", display: "flex", alignItems: "center", gap: 3 }}>
            Editar perfil <Ic.chevR size={12} />
          </div>
        </div>
      </div>
      )}

      {/* logout */}
      <button onClick={onLogout} className="focus-ring" style={{
        marginTop: 10, display: "flex", alignItems: "center", gap: 10,
        padding: "10px 12px", borderRadius: 10, border: "1px solid var(--line)",
        background: "transparent", color: "var(--ink)", fontWeight: 500, fontSize: 13.5,
        width: "100%", textAlign: "left",
      }}>
        <Ic.logout size={17} /> Cerrar sesión
      </button>
    </aside>
  );
}

function Topbar({ title, breadcrumb, right, plan, centerTitle }) {
  if (centerTitle) {
    return (
      <header style={{
        display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center",
        padding: "22px 36px 18px", gap: 16,
      }}>
        <div />
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: "var(--deep)", letterSpacing: "-0.02em", textAlign: "center" }}>{title}</h1>
        <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "flex-end" }}>{right}</div>
      </header>
    );
  }
  return (
    <header style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "22px 36px 18px",
      gap: 16,
    }}>
      <div>
        {breadcrumb && <div style={{ color: "var(--mute)", fontSize: 12.5, marginBottom: 4 }}>{breadcrumb}</div>}
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: "var(--deep)", letterSpacing: "-0.01em" }}>{title}</h1>
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        {right}
      </div>
    </header>
  );
}

function Shell({ route, onNav, user, plan, onUpgrade, onLogout, children, topbar, navDisabled, hideUserCard }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <Sidebar route={route} onNav={onNav} user={user} plan={plan}
        onUpgrade={onUpgrade} onLogout={onLogout}
        navDisabled={navDisabled} hideUserCard={hideUserCard} />
      <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {topbar}
        <div style={{ flex: 1, padding: "4px 36px 48px" }}>
          {children}
        </div>
      </main>
    </div>
  );
}

Object.assign(window, { Shell, Sidebar, Topbar });
