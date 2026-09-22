// Shared visual primitives. All components export to window for cross-file use.

const { useState, useEffect, useRef, useMemo, useLayoutEffect } = React;

// ─── Button ───────────────────────────────────────────────────────────
const btnBase = {
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  gap: 8, fontWeight: 500, fontSize: 14, borderRadius: 10,
  padding: "10px 18px", border: "1px solid transparent",
  transition: "all .18s var(--ease)", whiteSpace: "nowrap",
  userSelect: "none",
};
const btnVariants = {
  primary: {
    background: "var(--blue)", color: "#fff",
    boxShadow: "0 1px 2px rgba(15,23,42,.06), 0 6px 14px -6px rgba(75,107,251,.45)",
  },
  primaryHover: { background: "var(--blue-600)", transform: "translateY(-1px)" },
  secondary: { background: "var(--surface)", color: "var(--deep)", border: "1px solid var(--line)" },
  secondaryHover: { background: "var(--hover)" },
  ghost: { background: "transparent", color: "var(--mute)" },
  ghostHover: { background: "var(--hover)", color: "var(--deep)" },
  danger: { background: "var(--surface)", color: "var(--danger)", border: "1px solid var(--line)" },
  dangerHover: { background: "var(--danger-50)" },
  dark: { background: "var(--deep)", color: "#fff" },
  darkHover: { background: "#223762" },
};
const btnSizes = {
  sm: { padding: "7px 12px", fontSize: 13, borderRadius: 8 },
  md: {},
  lg: { padding: "13px 22px", fontSize: 15 },
};

function Button({ variant = "primary", size = "md", leftIcon, rightIcon, loading, disabled, style, children, ...rest }) {
  const [hover, setHover] = useState(false);
  const s = {
    ...btnBase,
    ...btnVariants[variant],
    ...btnSizes[size],
    ...(hover && !disabled ? btnVariants[variant + "Hover"] : {}),
    ...(disabled ? { opacity: .5, cursor: "not-allowed", boxShadow: "none", transform: "none" } : {}),
    ...style,
  };
  return (
    <button {...rest} disabled={disabled || loading} className="focus-ring"
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={s}>
      {loading && <Spinner size={14} />}
      {!loading && leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────
function Spinner({ size = 16, color = "currentColor" }) {
  return (
    <span style={{
      width: size, height: size, borderRadius: "50%",
      border: `2px solid ${color}`, borderTopColor: "transparent",
      display: "inline-block", animation: "spin .8s linear infinite",
      flex: "none",
    }} />
  );
}

// ─── Input ────────────────────────────────────────────────────────────
function Input({ label, hint, error, required, leftIcon, rightSlot, type = "text", style, wrapStyle, ...rest }) {
  const [focus, setFocus] = useState(false);
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6, ...wrapStyle }}>
      {label && (
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--deep)" }}>
          {label}{required && <span style={{ color: "var(--danger)", marginLeft: 2 }}>*</span>}
        </span>
      )}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        background: "var(--surface)",
        border: `1px solid ${error ? "var(--danger)" : focus ? "var(--blue)" : "var(--line)"}`,
        borderRadius: 10,
        padding: "10px 14px",
        boxShadow: focus && !error ? "0 0 0 3px rgba(75,107,251,.15)" : "none",
        transition: "all .15s var(--ease)",
      }}>
        {leftIcon && <span style={{ color: "var(--mute)", display: "flex" }}>{leftIcon}</span>}
        <input type={type} {...rest}
          onFocus={(e) => { setFocus(true); rest.onFocus?.(e); }}
          onBlur={(e) => { setFocus(false); rest.onBlur?.(e); }}
          style={{
            border: "none", outline: "none", background: "transparent",
            flex: 1, fontSize: 14, color: "var(--ink)",
            padding: 0, ...style,
          }} />
        {rightSlot}
      </div>
      {error ? (
        <span style={{ fontSize: 12, color: "var(--danger)" }}>{error}</span>
      ) : hint ? (
        <span style={{ fontSize: 12, color: "var(--mute)" }}>{hint}</span>
      ) : null}
    </label>
  );
}

// ─── Textarea ─────────────────────────────────────────────────────────
function Textarea({ label, hint, error, required, rows = 4, style, ...rest }) {
  const [focus, setFocus] = useState(false);
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && (
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--deep)" }}>
          {label}{required && <span style={{ color: "var(--danger)", marginLeft: 2 }}>*</span>}
        </span>
      )}
      <textarea rows={rows} {...rest}
        onFocus={(e) => { setFocus(true); rest.onFocus?.(e); }}
        onBlur={(e) => { setFocus(false); rest.onBlur?.(e); }}
        style={{
          border: `1px solid ${error ? "var(--danger)" : focus ? "var(--blue)" : "var(--line)"}`,
          borderRadius: 10, padding: "12px 14px",
          background: "var(--surface)", outline: "none",
          fontSize: 14, color: "var(--ink)", resize: "vertical",
          boxShadow: focus && !error ? "0 0 0 3px rgba(75,107,251,.15)" : "none",
          transition: "all .15s var(--ease)",
          ...style,
        }} />
      {error ? <span style={{ fontSize: 12, color: "var(--danger)" }}>{error}</span>
             : hint ? <span style={{ fontSize: 12, color: "var(--mute)" }}>{hint}</span> : null}
    </label>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────
function Card({ children, style, hover, onClick, selected }) {
  const [h, setH] = useState(false);
  return (
    <div onClick={onClick}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        background: "var(--surface)",
        border: `1px solid ${selected ? "var(--blue)" : "var(--line)"}`,
        borderRadius: 14,
        boxShadow: selected ? "0 0 0 3px rgba(75,107,251,.15), var(--sh-1)" : "var(--sh-1)",
        transition: "all .18s var(--ease)",
        cursor: onClick ? "pointer" : "default",
        ...(hover && h ? { background: "#FAFBFE", borderColor: "#D8E0F2" } : {}),
        ...style,
      }}>{children}</div>
  );
}

// ─── Badge / Chip ─────────────────────────────────────────────────────
function Badge({ tone = "neutral", children, leftIcon, style }) {
  const tones = {
    neutral: { bg: "var(--hover)", fg: "var(--deep)", bd: "var(--line)" },
    blue:    { bg: "var(--blue-50)", fg: "var(--blue)", bd: "#D6DEFE" },
    lav:     { bg: "var(--lav)", fg: "var(--blue)", bd: "#D6DEFE" },
    success: { bg: "var(--success-50)", fg: "#148B3D", bd: "#C9F0D6" },
    warn:    { bg: "var(--warn-50)", fg: "#8A5A04", bd: "#F3DDA6" },
    danger:  { bg: "var(--danger-50)", fg: "#B52020", bd: "#F3C2C2" },
    dark:    { bg: "var(--deep)", fg: "#fff", bd: "var(--deep)" },
  };
  const t = tones[tone];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "4px 10px", borderRadius: 999,
      background: t.bg, color: t.fg, border: `1px solid ${t.bd}`,
      fontSize: 12, fontWeight: 500, lineHeight: 1.4,
      ...style,
    }}>
      {leftIcon}
      {children}
    </span>
  );
}

function Chip({ tone = "lav", children, style }) {
  const tones = {
    lav:     { bg: "#EEF1FE", fg: "#3854E4" },
    mint:    { bg: "#E5F6EC", fg: "#148B3D" },
    neutral: { bg: "#F1F5F9", fg: "var(--deep)" },
  };
  const t = tones[tone];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "6px 12px", borderRadius: 8,
      background: t.bg, color: t.fg,
      fontSize: 12.5, fontWeight: 500,
      ...style,
    }}>{children}</span>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────
function Avatar({ src, size = 40, name = "U", style }) {
  if (src) return <img src={src} alt={name} style={{
    width: size, height: size, borderRadius: "50%", objectFit: "cover",
    flex: "none", ...style,
  }} />;
  const initials = name.split(" ").map(s => s[0]).slice(0,2).join("").toUpperCase();
  return <div style={{
    width: size, height: size, borderRadius: "50%",
    background: "var(--lav)", color: "var(--blue)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 600, fontSize: size*0.38, flex: "none", ...style,
  }}>{initials}</div>;
}

// ─── Progress bar ─────────────────────────────────────────────────────
function ProgressBar({ value, height = 8, showPct, tone = "blue" }) {
  const colors = { blue: "var(--blue)", success: "var(--success)", warn: "var(--warn)" };
  return (
    <div style={{ width: "100%" }}>
      <div style={{ height, background: "#EEF1F5", borderRadius: 999, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${Math.max(0, Math.min(100, value))}%`,
          background: colors[tone], borderRadius: 999,
          transition: "width .8s var(--ease)",
        }} />
      </div>
    </div>
  );
}

// ─── Circular progress ────────────────────────────────────────────────
function Ring({ value, size = 72, stroke = 7, showPct = true, color, track }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div style={{ position: "relative", width: size, height: size, flex: "none" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={track || "rgba(255,255,255,.18)"} strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color || "#fff"} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s var(--ease)" }} />
      </svg>
      {showPct && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 600, fontSize: size*0.24, color: color || "#fff",
          letterSpacing: "-0.02em",
        }}>{Math.round(value)}%</div>
      )}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────
function Modal({ open, onClose, title, children, width = 440, footer }) {
  if (!open) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(15,23,42,.5)", backdropFilter: "blur(2px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      animation: "fadeIn .18s var(--ease)",
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "var(--surface)", borderRadius: 16, width,
        maxWidth: "calc(100vw - 40px)",
        boxShadow: "0 30px 60px -20px rgba(15,23,42,.3)",
        animation: "fadeUp .22s var(--ease)",
        overflow: "hidden",
      }}>
        {title && (
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "20px 24px 0",
          }}>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: "var(--deep)" }}>{title}</h3>
            <button onClick={onClose} className="focus-ring" style={{
              background: "transparent", border: "none", color: "var(--mute)",
              padding: 6, borderRadius: 8, display: "flex",
            }}><Ic.close size={18} /></button>
          </div>
        )}
        <div style={{ padding: "16px 24px 20px", color: "var(--ink)" }}>{children}</div>
        {footer && <div style={{
          display: "flex", gap: 10, justifyContent: "flex-end",
          padding: "16px 24px", background: "var(--surface-2)",
          borderTop: "1px solid var(--line)",
        }}>{footer}</div>}
      </div>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────
function Toast({ toast, onDone }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDone, toast.duration || 3200);
    return () => clearTimeout(t);
  }, [toast]);
  if (!toast) return null;
  const tones = {
    success: { bg: "#0F172A", ic: <Ic.checkCircle size={18} /> },
    error:   { bg: "#B52020", ic: <Ic.info size={18} /> },
    info:    { bg: "#0F172A", ic: <Ic.info size={18} /> },
  };
  const t = tones[toast.type || "info"];
  return (
    <div style={{
      position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
      background: t.bg, color: "#fff",
      padding: "12px 18px", borderRadius: 12,
      boxShadow: "0 10px 30px -8px rgba(15,23,42,.4)",
      display: "flex", alignItems: "center", gap: 10,
      fontSize: 14, zIndex: 200,
      animation: "fadeUp .22s var(--ease)",
    }}>{t.ic}{toast.msg}</div>
  );
}

// ─── Confetti ─────────────────────────────────────────────────────────
function Confetti({ active, pieces = 80 }) {
  const items = useMemo(() => {
    if (!active) return [];
    const palette = ["#4B6BFB", "#1A2B4C", "#22C55E", "#F59E0B", "#8B5CF6"];
    return Array.from({ length: pieces }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      dx: (Math.random() - .5) * 160,
      rot: (Math.random() - .5) * 1080 + "deg",
      color: palette[i % palette.length],
      delay: Math.random() * 0.8,
      dur: 2 + Math.random() * 1.8,
      w: 6 + Math.random() * 6,
      h: 10 + Math.random() * 10,
    }));
  }, [active, pieces]);
  if (!active) return null;
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 50 }}>
      {items.map(p => (
        <span key={p.id} style={{
          position: "absolute", top: 0, left: `${p.left}%`,
          width: p.w, height: p.h, background: p.color, borderRadius: 2,
          ["--dx"]: `${p.dx}px`, ["--rot"]: p.rot,
          animation: `confettiFall ${p.dur}s var(--ease) ${p.delay}s forwards`,
          opacity: 0,
        }} />
      ))}
    </div>
  );
}

// ─── KPI card ─────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon, tone = "lav" }) {
  const tones = {
    lav:     { bg: "var(--lav)", fg: "var(--blue)" },
    success: { bg: "var(--success-50)", fg: "#148B3D" },
    warn:    { bg: "var(--warn-50)", fg: "#8A5A04" },
  };
  const t = tones[tone];
  return (
    <Card style={{ padding: 22, display: "flex", alignItems: "center", gap: 16, flex: 1 }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: t.bg, color: t.fg,
        display: "flex", alignItems: "center", justifyContent: "center", flex: "none",
      }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ color: "var(--mute)", fontSize: 13, fontWeight: 500 }}>{label}</div>
        <div style={{ color: "var(--deep)", fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.1, marginTop: 2 }}>{value}</div>
        {sub && <div style={{ color: "var(--mute)", fontSize: 12, marginTop: 4 }}>{sub}</div>}
      </div>
    </Card>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────
const HR = ({ style }) => <div style={{ height: 1, background: "var(--line)", margin: "16px 0", ...style }} />;

Object.assign(window, {
  Button, Spinner, Input, Textarea, Card, Badge, Chip, Avatar,
  ProgressBar, Ring, Modal, Toast, Confetti, KpiCard, HR,
});
