'use client';

import { useState, useEffect } from 'react';
import type { CSSProperties } from 'react';

/* ── Small shared bits ─────────────────────────────────────────────── */

function Check({ size = 18, color = '#4A67FF' }: { size?: number; color?: string }) {
  return (
    <svg className="lb-ic" width={size} height={size} viewBox="0 0 24 24" style={{ color, marginTop: 3, strokeWidth: 2.6 }} aria-hidden="true">
      <path d="M5 12.5l4.2 4.2L19 7" />
    </svg>
  );
}

function CheckDot({ size = 24 }: { size?: number }) {
  return (
    <span style={{ width: size, height: size, borderRadius: 8, background: '#EEF1FF', color: '#4A67FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg className="lb-ic" width={size * 0.58} height={size * 0.58} viewBox="0 0 24 24" style={{ strokeWidth: 3 }} aria-hidden="true">
        <path d="M5 12.5l4.2 4.2L19 7" />
      </svg>
    </span>
  );
}

const grid2: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 72, alignItems: 'center' };
const grid4: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 18 };

/* ── Tab data ───────────────────────────────────────────────────────── */

const BENEFIT_TABS = ['Tu información', 'Cada oportunidad', 'Información real', 'Descarga y envía'];

const CV_TYPE_TABS = ['CV adaptado a una vacante', 'CV general', 'CV Studio'];

const FAQ_ITEMS = [
  { q: '¿Momentum CV inventa experiencia, habilidades o logros?', a: 'No. Momentum utiliza la información real disponible en tu perfil profesional. Puede ayudarte a redactar, organizar y presentar mejor tu experiencia, pero no inventa cargos, estudios, certificaciones, responsabilidades ni resultados.' },
  { q: '¿Qué es un CV ATS friendly?', a: 'Es un CV diseñado con una estructura clara que facilita su lectura por sistemas de seguimiento de candidatos, conocidos como ATS, y por reclutadores. En Momentum, los CVs adaptados a una vacante y los CVs generales están orientados a este tipo de estructura.' },
  { q: '¿Momentum garantiza que conseguiré una entrevista o empleo?', a: 'No. Conseguir una entrevista depende de muchos factores, como los requisitos de la vacante, el número de candidatos, la experiencia del usuario y el proceso de selección de cada empresa. Momentum te ayuda a presentar tu perfil de forma más clara, estratégica y profesional.' },
  { q: '¿Puedo crear un CV si todavía no tengo experiencia laboral?', a: 'Sí. Puedes incluir educación, cursos, habilidades, proyectos personales, prácticas, voluntariados, actividades extracurriculares, emprendimientos y cualquier experiencia relevante para tu objetivo profesional.' },
  { q: '¿Puedo usar un CV que ya tengo?', a: 'Sí. Puedes adjuntar un CV anterior para aprovechar la información que ya existe y comenzar a construir o actualizar tu perfil profesional.' },
  { q: '¿Qué ocurre si olvido información importante sobre mi experiencia?', a: 'No pasa nada. Puedes añadirla más adelante. Momentum está diseñado para que tu perfil crezca contigo: puedes actualizarlo cada vez que recuerdes un detalle, completes un curso o tengas una nueva experiencia.' },
  { q: '¿Puedo crear más de un CV?', a: 'Sí. Puedes crear distintas versiones de tu CV para diferentes vacantes, sectores, objetivos profesionales o estilos de presentación.' },
  { q: '¿Puedo descargar mi CV más de una vez?', a: 'Sí. Una vez creado y revisado, podrás descargarlo cuando lo necesites.' },
  { q: '¿Cuándo debería usar CV Studio?', a: 'Es útil para áreas como diseño, marketing, contenido, comunicación, fotografía, arte, moda y otros roles donde la presentación visual aporta valor. Para vacantes con filtros ATS estrictos, recomendamos utilizar un CV adaptado a la vacante o un CV general.' },
  { q: '¿Puedo hacer seguimiento a mis aplicaciones?', a: 'Sí. Momentum te permite registrar las vacantes a las que aplicas, la fecha de aplicación, el estado del proceso y el CV que utilizaste en cada caso.' },
];

/* ── Page ───────────────────────────────────────────────────────────── */

export default function LandingBeta() {
  const [benTab, setBenTab] = useState(0);
  const [cvTab, setCvTab] = useState(0);
  const [faqOpen, setFaqOpen] = useState<number | null>(0);

  // Smooth in-page scrolling for the nav/anchor links, scoped to this page only.
  useEffect(() => {
    const prev = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => { document.documentElement.style.scrollBehavior = prev; };
  }, []);

  return (
    <div className="lb-page" style={{ width: '100%', minHeight: '100%', overflow: 'hidden' }}>

      {/* NAV */}
      <header style={{ position: 'sticky', top: 0, zIndex: 30, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: '1px solid #EDF1F7' }}>
        <div className="lb-wrap" style={{ height: 76, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
          <a href="#top" aria-label="Momentum CV, inicio" style={{ display: 'flex', alignItems: 'center' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/momentum-logo.svg" alt="Momentum CV" style={{ height: 26 }} />
          </a>
          <nav className="lb-hide-m" aria-label="Principal" style={{ display: 'flex', alignItems: 'center', gap: 34 }}>
            <a className="lb-navlink" href="#como-funciona">Cómo funciona</a>
            <a className="lb-navlink" href="#tipos">Tipos de CV</a>
            <a className="lb-navlink" href="#seguimiento">Seguimiento de vacantes</a>
            <a className="lb-navlink" href="#faq">Preguntas frecuentes</a>
          </nav>
          <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
            <a className="lb-navlink lb-hide-m" href="/login">Iniciar sesión</a>
            <a className="lb-btn lb-btn-primary lb-btn-sm" href="/register">Crear mi CV gratis</a>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section id="top" style={{ paddingTop: 72, paddingBottom: 40, background: 'radial-gradient(900px 500px at 80% 20%, rgba(74,103,255,0.10), rgba(74,103,255,0) 70%), #FFFFFF' }}>
        <div className="lb-wrap">
          <div className="lb-g-2" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.05fr)', gap: 56, alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              <h1 className="lb-h1">Tu experiencia cambia. <span style={{ color: '#4A67FF' }}>Tu CV también debería hacerlo.</span></h1>
              <p className="lb-lead" style={{ maxWidth: 540 }}>Crea CVs profesionales, adaptados a cada vacante y basados únicamente en tu experiencia real. Guarda tu información una sola vez y deja que Momentum la transforme en el CV que necesitas, cuando lo necesites.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  <a className="lb-btn lb-btn-primary" href="/register">Crear mi CV gratis</a>
                  <a className="lb-btn lb-btn-secondary" href="#como-funciona">Ver cómo funciona</a>
                </div>
                <p style={{ fontSize: '14.5px', color: '#94A3B8' }}>No necesitas empezar desde cero cada vez que aplicas.</p>
              </div>
              <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px 20px', fontSize: 15, fontWeight: 600, color: '#182944', maxWidth: 540 }}>
                {['CVs compatibles con sistemas ATS.', 'Adaptados a vacantes específicas.', 'Sin inventar experiencia ni información.', 'Descárgalos cuando quieras.'].map(t => (
                  <li key={t} style={{ display: 'flex', alignItems: 'center', gap: 10 }}><CheckDot />{t}</li>
                ))}
              </ul>
            </div>

            {/* Hero stage */}
            <div className="lb-panel lb-hero-stage" style={{ height: 640, background: 'linear-gradient(180deg, #EEF1FF 0%, #F7F8FF 60%, #FFFFFF 100%)', border: '1px solid #E1E6FF' }}>
              <div style={{ position: 'absolute', left: '50%', top: '45%', width: 520, height: 520, transform: 'translate(-50%, -50%)', borderRadius: 999, background: 'radial-gradient(circle, rgba(74,103,255,0.18), rgba(74,103,255,0) 65%)' }} />
              <div style={{ position: 'absolute', left: '50%', top: 70, width: 0, height: 0 }}>

                <div className="lb-doc lb-fan-l" style={{ position: 'absolute', left: -262, top: 70, width: 250, height: 340, overflow: 'hidden', display: 'grid', gridTemplateColumns: '84px minmax(0, 1fr)', transformOrigin: 'bottom center', transform: 'rotate(-8deg)' }}>
                  <div style={{ background: '#2E2A26', padding: '20px 11px', display: 'flex', flexDirection: 'column', gap: 9, color: '#FFFFFF' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 99, background: 'linear-gradient(145deg, #E8CDB5, #B98B6A)' }} />
                    <div style={{ fontSize: 7, fontWeight: 700 }}>Contacto</div>
                    <p style={{ fontSize: '5.5px', lineHeight: 1.7, opacity: 0.8 }}>andrea.mora@correo.com<br />Guadalajara</p>
                    <div style={{ fontSize: 7, fontWeight: 700 }}>Herramientas</div>
                    <p style={{ fontSize: '5.5px', lineHeight: 1.7, opacity: 0.8 }}>Figma<br />Lightroom<br />Canva</p>
                  </div>
                  <div style={{ padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: 7 }}>
                    <div className="lb-serif" style={{ fontSize: 19, lineHeight: 1, fontWeight: 600 }}>Andrea<br />Mora</div>
                    <div style={{ fontSize: 7, color: '#B0643A', fontWeight: 700 }}>Diseñadora de contenido</div>
                    <p style={{ fontSize: 6, lineHeight: 1.55, color: '#3A3E47' }}>Piezas visuales y narrativas para marcas que quieren comunicar con claridad.</p>
                    <div style={{ fontSize: 7, fontWeight: 800 }}>Experiencia</div>
                    <div style={{ fontSize: '6.5px', fontWeight: 700 }}>Estudio independiente</div>
                    <p style={{ fontSize: 6, lineHeight: 1.55, color: '#3A3E47' }}>Identidad y contenido para marcas locales.</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 4, paddingTop: 4 }}>
                      <div style={{ height: 30, borderRadius: 3, background: '#EFE3D6' }} /><div style={{ height: 30, borderRadius: 3, background: '#D9D2C8' }} /><div style={{ height: 30, borderRadius: 3, background: '#C9B8A6' }} />
                    </div>
                  </div>
                </div>

                <div className="lb-doc lb-fan-r" style={{ position: 'absolute', left: 12, top: 70, width: 250, height: 340, overflow: 'hidden', padding: '22px 20px', display: 'flex', flexDirection: 'column', gap: 8, transformOrigin: 'bottom center', transform: 'rotate(7deg)' }}>
                  <div className="lb-serif" style={{ fontSize: 16, fontWeight: 600, textAlign: 'center' }}>Diego Salinas</div>
                  <div style={{ fontSize: '6.5px', color: '#4A4F59', textAlign: 'center' }}>Recién graduado en Ingeniería Industrial</div>
                  <div style={{ height: 2, background: '#2F6B5A', width: 40, margin: '2px auto' }} />
                  <div style={{ fontSize: 7, fontWeight: 800 }}>Educación</div>
                  <div style={{ fontSize: '6.5px', fontWeight: 700 }}>Ing. Industrial</div>
                  <p style={{ fontSize: 6, color: '#6B707B' }}>Universidad del Norte</p>
                  <div style={{ fontSize: 7, fontWeight: 800 }}>Proyectos</div>
                  <p style={{ fontSize: 6, lineHeight: 1.55, color: '#3A3E47' }}>Rediseño de flujo de almacén para proyecto final.</p>
                  <div style={{ fontSize: 7, fontWeight: 800 }}>Prácticas</div>
                  <p style={{ fontSize: 6, lineHeight: 1.55, color: '#3A3E47' }}>Apoyo en control de calidad y reportes de producción.</p>
                  <div style={{ fontSize: 7, fontWeight: 800 }}>Habilidades</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    {['Excel', 'Lean', 'Power BI'].map(s => <span key={s} style={{ fontSize: '5.5px', padding: '2px 5px', borderRadius: 99, background: '#E6F0EC' }}>{s}</span>)}
                  </div>
                </div>

                <div className="lb-doc lb-fan-c" style={{ position: 'absolute', left: -150, top: 20, width: 300, height: 420, overflow: 'hidden', padding: '28px 26px', display: 'flex', flexDirection: 'column', gap: 10, zIndex: 2 }}>
                  <div className="lb-serif" style={{ fontSize: 22, fontWeight: 600 }}>Valeria Ríos</div>
                  <div style={{ fontSize: 8, color: '#4A4F59' }}>Operaciones y administración &nbsp;|&nbsp; Ciudad de México</div>
                  <div style={{ height: '1.5px', background: '#1A1C24' }} />
                  <div style={{ fontSize: 8, fontWeight: 800 }}>Perfil</div>
                  <p style={{ fontSize: 7, lineHeight: 1.55, color: '#3A3E47' }}>Profesional con experiencia en coordinación administrativa, comunicación con clientes y seguimiento operativo.</p>
                  <div style={{ fontSize: 8, fontWeight: 800 }}>Experiencia</div>
                  <div style={{ margin: '0 -6px', padding: 6, borderRadius: 6, background: '#EEF1FF', boxShadow: '0 0 0 1px #D8DEFF', display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '7.5px' }}><span style={{ fontWeight: 700 }}>Asistente administrativo</span><span style={{ color: '#6B707B' }}>2 años</span></div>
                    <ul style={{ fontSize: '6.8px', lineHeight: 1.5, color: '#3A3E47', paddingLeft: 9, listStyle: 'disc' }}>
                      <li>Gestioné agendas y coordiné reuniones del equipo.</li>
                      <li>Administré la bandeja de correo y la comunicación diaria.</li>
                      <li>Elaboré reportes semanales de seguimiento.</li>
                    </ul>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '7.5px' }}><span style={{ fontWeight: 700 }}>Asistente de atención al cliente</span><span style={{ color: '#6B707B' }}>2021 – 2022</span></div>
                  <ul style={{ fontSize: '6.8px', lineHeight: 1.5, color: '#3A3E47', paddingLeft: 9, listStyle: 'disc' }}>
                    <li>Atendí solicitudes de clientes por WhatsApp y correo.</li>
                    <li>Organicé pedidos y registros de pagos.</li>
                  </ul>
                  <div style={{ fontSize: 8, fontWeight: 800 }}>Habilidades</div>
                  <p style={{ fontSize: 7, color: '#3A3E47' }}>Organización, comunicación escrita, hojas de cálculo, atención al cliente</p>
                </div>

                <div className="lb-card lb-pop1" style={{ position: 'absolute', left: 28, bottom: 150, width: 300, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8, zIndex: 5, background: '#F1F4FF', borderColor: '#E1E6FF' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>Tú</div>
                  <p style={{ fontSize: '13.5px', lineHeight: 1.5, color: '#0B1B36' }}>&ldquo;Trabajé como asistente administrativo durante dos años y gestionaba agendas, correos y reportes semanales.&rdquo;</p>
                </div>

                <div className="lb-card lb-pop2" style={{ position: 'absolute', right: 28, bottom: 96, width: 280, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start', zIndex: 5 }}>
                  <span style={{ width: 32, height: 32, borderRadius: 10, background: '#4A67FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 26 26" aria-hidden="true"><path d="M5 18 L10.5 12.5 L14.2 15.4 L21 8" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}><span style={{ fontSize: 12, fontWeight: 700, color: '#3D56E8' }}>Momentum</span><p style={{ fontSize: '13.5px', lineHeight: 1.45, color: '#0B1B36' }}>He añadido esta experiencia a tu perfil profesional.</p></div>
                </div>

                <div className="lb-card lb-pop3" style={{ position: 'absolute', left: '50%', bottom: 26, transform: 'translateX(-50%)', padding: '12px 18px', display: 'flex', gap: 12, alignItems: 'center', zIndex: 6, borderRadius: 999, whiteSpace: 'nowrap' }}>
                  <span style={{ width: 26, height: 26, borderRadius: 99, background: '#EAF9F2', color: '#16A36A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg className="lb-ic" width="14" height="14" viewBox="0 0 24 24" style={{ strokeWidth: 2.8 }} aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7" /></svg>
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#0B1B36' }}>Aplicación enviada · Analista de Operaciones</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFITS AS TABS */}
      <section className="lb-pad-sec" style={{ paddingTop: 120, paddingBottom: 120 }}>
        <div className="lb-wrap">
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}>
            <h2 className="lb-h2" style={{ maxWidth: 760 }}>Un CV más estratégico, sin empezar de cero</h2>
            <div role="tablist" aria-label="Beneficios" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10 }}>
              {BENEFIT_TABS.map((label, i) => (
                <button key={label} role="tab" className={`lb-tab ${benTab === i ? 'lb-tab-on' : 'lb-tab-off'}`} aria-selected={benTab === i} onClick={() => setBenTab(i)}>{label}</button>
              ))}
            </div>
          </div>

          <div className="lb-panel" style={{ marginTop: 44, background: 'linear-gradient(180deg, #F7F8FF, #FFFFFF)', border: '1px solid #E1E6FF', padding: 56 }}>
            <div className="lb-g-tab" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 0.9fr) minmax(0, 1.1fr)', gap: 56, alignItems: 'center', minHeight: 360 }}>

              {benTab === 0 && (
                <>
                  <div className="lb-fade" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <span className="lb-ib"><svg className="lb-ic" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="12" cy="6" rx="7" ry="2.8" /><path d="M5 6v6c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8V6M5 12v6c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8v-6" /></svg></span>
                    <h3 style={{ fontSize: 32, lineHeight: 1.15, fontWeight: 700, letterSpacing: '-0.025em' }}>Tu información, siempre disponible</h3>
                    <p className="lb-lead">Crea y actualiza tu perfil profesional una sola vez. Momentum recuerda tu experiencia para que no tengas que hacerlo.</p>
                  </div>
                  <div className="lb-card lb-fade" style={{ padding: 26, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 6 }}><span style={{ fontSize: 16, fontWeight: 700 }}>Mi perfil profesional</span><span className="lb-chip" style={{ background: '#EAF9F2', color: '#16A36A' }}>Guardado</span></div>
                    {[['Experiencia', '3 entradas'], ['Educación', '2 entradas'], ['Habilidades', '9 entradas'], ['Cursos y proyectos', '3 entradas']].map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderRadius: 12, background: '#F6F8FC', border: '1px solid #EDF1F7' }}><span style={{ fontSize: 15, fontWeight: 600 }}>{k}</span><span style={{ fontSize: 14, color: '#64748B' }}>{v}</span></div>
                    ))}
                  </div>
                </>
              )}

              {benTab === 1 && (
                <>
                  <div className="lb-fade" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <span className="lb-ib"><svg className="lb-ic" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /></svg></span>
                    <h3 style={{ fontSize: 32, lineHeight: 1.15, fontWeight: 700, letterSpacing: '-0.025em' }}>Adaptado a cada oportunidad</h3>
                    <p className="lb-lead">Introduce los detalles de una vacante y recibe un CV diseñado para destacar la experiencia más relevante de tu perfil.</p>
                  </div>
                  <div className="lb-card lb-fade" style={{ padding: 26, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><span style={{ fontSize: 13, fontWeight: 600, color: '#64748B' }}>Vacante</span><span style={{ fontSize: 18, fontWeight: 700 }}>Analista de Operaciones</span></div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {['Reportes semanales', 'Control de pedidos', 'Hojas de cálculo'].map(t => (
                        <div key={t} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 15, color: '#182944' }}><span>{t}</span><span className="lb-chip" style={{ background: '#EAF9F2', color: '#16A36A' }}>En tu perfil</span></div>
                      ))}
                    </div>
                    <div style={{ padding: '14px 16px', borderRadius: 12, background: '#4A67FF', color: '#FFFFFF', fontSize: 15, fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>CV adaptado listo<svg className="lb-ic" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7" /></svg></div>
                  </div>
                </>
              )}

              {benTab === 2 && (
                <>
                  <div className="lb-fade" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <span className="lb-ib"><svg className="lb-ic" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5l7 3v5.5c0 4.2-3 7.4-7 8.5-4-1.1-7-4.3-7-8.5V6.5z" /><path d="M9 12l2.2 2.2L15.5 10" /></svg></span>
                    <h3 style={{ fontSize: 32, lineHeight: 1.15, fontWeight: 700, letterSpacing: '-0.025em' }}>Información real, nunca inventada</h3>
                    <p className="lb-lead">Momentum utiliza únicamente la información que existe en tu perfil. Si una vacante no encaja contigo, no inventamos habilidades ni experiencias.</p>
                  </div>
                  <div className="lb-card lb-fade" style={{ padding: 26, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#64748B' }}>Requisitos de la vacante</span>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderRadius: 12, border: '1px solid #EDF1F7', fontSize: 15 }}><span style={{ fontWeight: 600 }}>Atención al cliente</span><span className="lb-chip" style={{ background: '#EAF9F2', color: '#16A36A' }}>Incluido</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderRadius: 12, border: '1px solid #EDF1F7', fontSize: 15 }}><span style={{ fontWeight: 600 }}>Gestión de pedidos</span><span className="lb-chip" style={{ background: '#EAF9F2', color: '#16A36A' }}>Incluido</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderRadius: 12, background: '#F6F8FC', border: '1px dashed #CBD5E1', fontSize: 15 }}><span style={{ fontWeight: 600, color: '#64748B' }}>Certificación SAP</span><span className="lb-chip" style={{ background: '#FFFFFF', color: '#64748B', border: '1px solid #E2E8F0' }}>No está en tu perfil</span></div>
                  </div>
                </>
              )}

              {benTab === 3 && (
                <>
                  <div className="lb-fade" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <span className="lb-ib"><svg className="lb-ic" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19.5h14" /></svg></span>
                    <h3 style={{ fontSize: 32, lineHeight: 1.15, fontWeight: 700, letterSpacing: '-0.025em' }}>Listo para descargar y enviar</h3>
                    <p className="lb-lead">Revisa tu CV, ajusta lo que necesites y descárgalo todas las veces que quieras.</p>
                  </div>
                  <div className="lb-fade" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                    <div className="lb-doc" style={{ width: 210, height: 280, padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div className="lb-serif" style={{ fontSize: 15, fontWeight: 600 }}>Valeria Ríos</div>
                      <div style={{ height: '1.5px', background: '#1A1C24' }} />
                      <div style={{ height: 6, width: '60%', background: '#E2E8F0', borderRadius: 3 }} />
                      <div style={{ height: 5, width: '100%', background: '#EDF1F7', borderRadius: 3 }} />
                      <div style={{ height: 5, width: '92%', background: '#EDF1F7', borderRadius: 3 }} />
                      <div style={{ height: 5, width: '80%', background: '#EDF1F7', borderRadius: 3 }} />
                      <div style={{ height: 6, width: '50%', background: '#E2E8F0', borderRadius: 3, marginTop: 8 }} />
                      <div style={{ height: 5, width: '100%', background: '#EDF1F7', borderRadius: 3 }} />
                      <div style={{ height: 5, width: '86%', background: '#EDF1F7', borderRadius: 3 }} />
                    </div>
                    <div className="lb-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12, width: 220 }}>
                      <span style={{ fontSize: 15, fontWeight: 700 }}>Descargar CV</span>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 46, borderRadius: 12, background: '#4A67FF', color: '#FFFFFF', fontSize: 15, fontWeight: 700 }}><svg className="lb-ic" width="17" height="17" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19.5h14" /></svg>PDF</div>
                      <span style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center' }}>Descárgalo cuando quieras</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="lb-pad-sec" style={{ paddingTop: 60, paddingBottom: 120 }}>
        <div className="lb-wrap">
          <div className="lb-g-2" style={grid2}>
            <div className="lb-panel" style={{ background: '#F6F8FC', border: '1px solid #EDF1F7', padding: '44px 40px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#64748B', paddingBottom: 6 }}>Los problemas más comunes</p>
              {[
                ['No recuerdo exactamente qué hacía en mi empleo anterior.', '16px 16px 16px 6px', '86%', 'flex-start'],
                ['No sé cómo adaptar mi experiencia a una vacante.', '16px 16px 6px 16px', '80%', 'flex-end'],
                ['No sé si mi CV será leído correctamente por un sistema ATS.', '16px 16px 16px 6px', '88%', 'flex-start'],
                ['Termino enviando el mismo CV genérico a todas las empresas.', '16px 16px 6px 16px', '84%', 'flex-end'],
                ['Pierdo el seguimiento de las vacantes a las que ya apliqué.', '16px 16px 16px 6px', '86%', 'flex-start'],
              ].map(([text, radius, maxW, align]) => (
                <div key={text as string} className="lb-card" style={{ padding: '16px 20px', borderRadius: radius, fontSize: 16, fontWeight: 600, color: '#182944', maxWidth: maxW, alignSelf: align, boxShadow: 'none' } as CSSProperties}>&ldquo;{text}&rdquo;</div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              <span className="lb-badge" style={{ alignSelf: 'flex-start' }}>El proceso actual</span>
              <h2 className="lb-h2">Crear un CV no debería sentirse como empezar tu carrera desde cero</h2>
              <p className="lb-body">Cada vez que aparece una oportunidad, muchas personas tienen que volver a buscar fechas, recordar responsabilidades, encontrar logros antiguos, reorganizar secciones y redactar todo otra vez.</p>
              <p className="lb-body">Y cuando el perfil cambia —con una nueva experiencia, curso, habilidad o proyecto— el CV suele quedarse desactualizado.</p>
              <p className="lb-body" style={{ color: '#0B1B36', fontWeight: 600 }}>Momentum CV elimina ese ciclo. Tu trayectoria vive en un perfil profesional que puedes enriquecer con el tiempo, y desde allí puedes crear el CV adecuado para cada aplicación.</p>
            </div>
          </div>
          <div style={{ marginTop: 96, textAlign: 'center' }}>
            <p style={{ fontSize: 30, lineHeight: 1.35, letterSpacing: '-0.02em', fontWeight: 700, color: '#07152F', maxWidth: 900, margin: '0 auto' }}>Momentum convierte toda esa información dispersa en un perfil profesional útil, actualizado y listo para convertirse en tu próximo CV.</p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="como-funciona" className="lb-pad-sec" style={{ paddingTop: 120, paddingBottom: 120, background: '#F8FAFC', borderTop: '1px solid #EDF1F7', borderBottom: '1px solid #EDF1F7' }}>
        <div className="lb-wrap">
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
            <span className="lb-badge">Cómo funciona</span>
            <h2 className="lb-h2" style={{ maxWidth: 760 }}>De tu experiencia a un CV listo para enviar</h2>
            <p className="lb-lead" style={{ maxWidth: 680 }}>No necesitas ser experto en redacción, diseño ni sistemas ATS. Momentum te acompaña desde tu perfil hasta la aplicación.</p>
          </div>

          <ol className="lb-g-4" style={{ marginTop: 64, ...grid4 }}>
            {[
              ['1', '#4A67FF', '#FFFFFF', 'Cuéntale a Momentum sobre ti', 'Añade tu experiencia laboral, estudios, proyectos, habilidades, cursos y logros. Puedes completar tu información manualmente, adjuntar un CV anterior o simplemente conversar con la IA como lo harías con alguien de confianza.'],
              ['2', '#EEF1FF', '#3D56E8', 'Mantén tu perfil vivo', '¿Empezaste un nuevo trabajo? ¿Terminaste un curso? ¿Participaste en un proyecto? Cuéntaselo a Momentum y la información se incorpora a tu perfil. No necesitas recordar todo desde el principio. Puedes enriquecer tu historial profesional poco a poco.'],
              ['3', '#EEF1FF', '#3D56E8', 'Elige el tipo de CV que necesitas', 'Selecciona si quieres crear un CV adaptado a una vacante, un CV general o un CV Studio con una plantilla visual premium.'],
              ['4', '#00123A', '#FFFFFF', 'Revisa, ajusta y descarga', 'Momentum crea una primera versión en segundos. Revisa la vista previa, edita cualquier detalle antes de exportar y descarga tu documento cuando esté listo.'],
            ].map(([n, bg, fg, title, body]) => (
              <li key={title} className="lb-card" style={{ padding: '30px 26px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <span style={{ width: 44, height: 44, borderRadius: 12, background: bg, color: fg, fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{n}</span>
                <h3 className="lb-h3">{title}</h3>
                <p className="lb-small">{body}</p>
              </li>
            ))}
          </ol>

          {/* Chat example */}
          <div className="lb-g-2" style={{ marginTop: 96, ...grid2 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <span className="lb-badge" style={{ alignSelf: 'flex-start' }}>Paso 1 en acción</span>
              <h3 style={{ fontSize: 38, lineHeight: 1.12, fontWeight: 700, letterSpacing: '-0.03em', color: '#07152F' }}>Habla como hablas. Momentum lo organiza.</h3>
              <p className="lb-body">Momentum te ayuda a convertir recuerdos, experiencias y logros en información profesional. Tú mantienes el control de lo que se guarda y de lo que aparece en tu CV.</p>
            </div>
            <div className="lb-panel" style={{ background: 'linear-gradient(160deg, #EEF1FF 0%, #F7F8FF 55%, #FFFFFF 100%)', border: '1px solid #E1E6FF', padding: 40, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ alignSelf: 'flex-end', maxWidth: '88%', padding: '16px 18px', borderRadius: '16px 16px 6px 16px', fontSize: '15.5px', lineHeight: 1.55, color: '#0B1B36', background: '#F1F4FF', border: '1px solid #D8DEFF' }}>&ldquo;El año pasado ayudé a organizar la atención al cliente de una tienda online, respondía mensajes por WhatsApp y llevaba el control de pedidos.&rdquo;</div>
              <div style={{ display: 'flex', gap: 12, maxWidth: '94%' }}>
                <span style={{ width: 36, height: 36, borderRadius: 10, background: '#4A67FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 26 26" aria-hidden="true"><path d="M5 18 L10.5 12.5 L14.2 15.4 L21 8" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </span>
                <div className="lb-card" style={{ padding: '16px 18px', borderRadius: '16px 16px 16px 6px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <p style={{ fontSize: '15.5px', lineHeight: 1.55, color: '#182944' }}>&ldquo;Entendido. He identificado experiencia en atención al cliente, comunicación, gestión de pedidos y soporte por WhatsApp. ¿Quieres añadir el nombre del negocio y las fechas aproximadas?&rdquo;</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {['Atención al cliente', 'Comunicación', 'Gestión de pedidos', 'Soporte por WhatsApp'].map(c => <span key={c} className="lb-chip" style={{ background: '#EEF1FF', color: '#3D56E8' }}>{c}</span>)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Before / after */}
          <div style={{ marginTop: 110 }}>
            <div style={{ textAlign: 'center' }}><h3 style={{ fontSize: 38, lineHeight: 1.12, fontWeight: 700, letterSpacing: '-0.03em', color: '#07152F' }}>Ejemplo: cuéntalo como lo recuerdas</h3></div>
            <div className="lb-g-ex" style={{ marginTop: 48, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 72px minmax(0, 1.15fr)', alignItems: 'center' }}>
              <div className="lb-panel" style={{ background: '#FFFFFF', border: '1px dashed #CBD5E1', padding: 40, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <span className="lb-chip" style={{ background: '#EDF1F7', color: '#475569', alignSelf: 'flex-start' }}>Lo que escribes</span>
                <p style={{ fontSize: '18.5px', lineHeight: 1.6, fontWeight: 500, color: '#182944' }}>&ldquo;Trabajé ayudando en una empresa pequeña. Respondía correos y mensajes, atendía clientes por WhatsApp, organizaba pedidos y a veces hacía publicaciones para Instagram. También llevaba una hoja de cálculo con pagos.&rdquo;</p>
              </div>
              <div className="lb-hide-m" style={{ display: 'flex', justifyContent: 'center' }}>
                <span style={{ width: 48, height: 48, borderRadius: 99, background: '#4A67FF', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px -8px rgba(74,103,255,0.7)' }}>
                  <svg className="lb-ic" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </span>
              </div>
              <div className="lb-card" style={{ padding: 40, display: 'flex', flexDirection: 'column', gap: 16, borderRadius: 24 }}>
                <span className="lb-chip" style={{ background: '#EEF1FF', color: '#3D56E8', alignSelf: 'flex-start' }}>Cómo podría verse en su perfil</span>
                <h4 style={{ fontSize: 21, fontWeight: 700, letterSpacing: '-0.015em', color: '#0B1B36' }}>Asistente de Operaciones y Atención al Cliente</h4>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: 11, fontSize: 16, lineHeight: 1.55, color: '#475569' }}>
                  {[
                    'Gestioné la atención a clientes a través de WhatsApp y correo electrónico.',
                    'Organicé pedidos y realicé seguimiento a solicitudes de clientes.',
                    'Actualicé registros de pagos y control operativo en hojas de cálculo.',
                    'Apoyé la creación y publicación de contenido para Instagram.',
                    'Colaboré en tareas administrativas y operativas de una empresa en crecimiento.',
                  ].map(t => <li key={t} style={{ display: 'flex', gap: 12 }}><Check />{t}</li>)}
                </ul>
              </div>
            </div>
            <div style={{ marginTop: 56, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26, textAlign: 'center' }}>
              <p style={{ fontSize: 21, lineHeight: 1.5, fontWeight: 600, color: '#182944', maxWidth: 680 }}>Momentum no cambia tu historia. La convierte en información clara, organizada y útil para un proceso de selección.</p>
              <a className="lb-btn lb-btn-primary" href="/register">Crear mi perfil profesional</a>
            </div>
          </div>
        </div>
      </section>

      {/* LIVING PROFILE */}
      <section className="lb-pad-sec" style={{ paddingTop: 130, paddingBottom: 120 }}>
        <div className="lb-wrap">
          <div className="lb-g-2" style={grid2}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              <span className="lb-badge" style={{ alignSelf: 'flex-start' }}>Perfil vivo</span>
              <h2 className="lb-h2">Tu perfil profesional no es un formulario. Es una historia que evoluciona contigo.</h2>
              <p className="lb-body">Tu carrera cambia con el tiempo. Adquieres nuevas habilidades, participas en proyectos, cambias de trabajo, tomas cursos o descubres logros que antes no habías incluido.</p>
              <p className="lb-body">Momentum te permite construir un perfil profesional vivo: una base de información personal y profesional que puedes actualizar cuando quieras.</p>
              <p className="lb-body">En lugar de crear un CV desde cero cada vez, partes de una versión de ti que ya está organizada, lista y disponible.</p>
            </div>
            <div className="lb-panel" style={{ background: 'linear-gradient(180deg, #EEF1FF, #FFFFFF)', border: '1px solid #E1E6FF', padding: '48px 40px' }}>
              <div style={{ position: 'absolute', right: -120, top: -120, width: 360, height: 360, borderRadius: 999, background: 'radial-gradient(circle, rgba(74,103,255,0.16), rgba(74,103,255,0) 65%)' }} />
              <div className="lb-card lb-bob" style={{ position: 'relative', padding: 26, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12 }}><span style={{ fontSize: 17, fontWeight: 700 }}>Historial del perfil</span><span className="lb-chip" style={{ background: '#EEF1FF', color: '#3D56E8' }}>Actualizado hoy</span></div>
                {[
                  ['#4A67FF', '#FFFFFF', <path key="a" d="M4 7h16v12H4z" />, 'Nueva experiencia añadida', 'Analista de Operaciones Junior', 'Hoy'],
                  [undefined, undefined, <path key="b" d="M3.5 9L12 5l8.5 4L12 13z" />, 'Curso completado', 'Excel intermedio para análisis de datos', 'Ago'],
                  [undefined, undefined, <path key="c" d="M12 4l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.4l-4.8 2.5.9-5.4-3.9-3.8 5.4-.8z" />, 'Logro recordado', 'Reorganizó el control de pedidos semanal', 'Jul'],
                  [undefined, undefined, <path key="d" d="M7 3.5h7l4 4v13H7z" />, 'CV anterior importado', '3 experiencias y 2 estudios detectados', 'May'],
                ].map(([bg, fg, icon, title, sub, when], idx) => (
                  <div key={title as string} style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '12px 0', borderTop: idx === 0 ? '1px solid #EDF1F7' : '1px solid #EDF1F7' }}>
                    <span className="lb-ib" style={bg ? { width: 40, height: 40, background: bg as string, color: fg as string } : { width: 40, height: 40 }}>
                      <svg className="lb-ic" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">{icon}</svg>
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}><span style={{ fontSize: 15, fontWeight: 700 }}>{title}</span><span style={{ fontSize: 14, color: '#64748B' }}>{sub}</span></div>
                    <span style={{ fontSize: 13, color: '#94A3B8' }}>{when}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lb-g-4" style={{ marginTop: 88, ...grid4 }}>
            {[
              [<path key="1a" d="M4.5 6.5a2 2 0 012-2h11a2 2 0 012 2v8a2 2 0 01-2 2H10l-4 3.5v-3.5a2 2 0 01-1.5-2z" />, 'Habla con la IA de forma natural', 'No hace falta conocer el formato correcto. Puedes explicar tus experiencias con tus propias palabras.'],
              [<path key="2a" d="M7 3.5h7l4 4v13H7z M14 3.5v4h4M12.5 17v-6M10 13.5l2.5-2.5 2.5 2.5" />, 'Sube un CV anterior', 'Aprovecha la información que ya tienes para comenzar más rápido.'],
              [<><circle key="3c" cx="12" cy="12" r="8" /><path key="3a" d="M12 8.5v7M8.5 12h7" /></>, 'Agrega información cuando la recuerdes', 'No tienes que completar toda tu trayectoria en una sola sesión.'],
              [<path key="4a" d="M19.5 12a7.5 7.5 0 01-13.3 4.7M4.5 12a7.5 7.5 0 0113.3-4.7 M18 3.8v3.7h-3.7M6 20.2v-3.7h3.7" />, 'Mantén todo actualizado', 'Una nueva experiencia puede estar disponible para tus futuros CVs sin volver a escribirla desde cero.'],
            ].map(([icon, title, body]) => (
              <div key={title as string} className="lb-card" style={{ padding: '30px 26px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <span className="lb-ib"><svg className="lb-ic" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">{icon}</svg></span>
                <h3 className="lb-h3">{title}</h3>
                <p className="lb-small">{body}</p>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 80, textAlign: 'center', fontSize: 28, lineHeight: 1.35, letterSpacing: '-0.02em', fontWeight: 700, color: '#07152F', maxWidth: 820, marginLeft: 'auto', marginRight: 'auto' }}>Tu información permanece contigo. Cada nuevo CV comienza con una mejor versión de tu perfil.</p>
        </div>
      </section>

      {/* CV TYPES */}
      <section id="tipos" className="lb-pad-sec" style={{ paddingTop: 120, paddingBottom: 120, background: '#F8FAFC', borderTop: '1px solid #EDF1F7' }}>
        <div className="lb-wrap">
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
            <span className="lb-badge">Tipos de CV</span>
            <h2 className="lb-h2" style={{ maxWidth: 760 }}>Un CV para cada forma de buscar trabajo</h2>
            <p className="lb-lead" style={{ maxWidth: 680 }}>No todas las oportunidades requieren el mismo enfoque. Momentum te ayuda a elegir el formato que mejor responde a tu objetivo.</p>
            <div role="tablist" aria-label="Tipos de CV" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 10 }}>
              {CV_TYPE_TABS.map((label, i) => (
                <button key={label} role="tab" className={`lb-tab ${cvTab === i ? 'lb-tab-on' : 'lb-tab-off'}`} aria-selected={cvTab === i} onClick={() => setCvTab(i)}>{label}</button>
              ))}
            </div>
          </div>

          <div className="lb-card" style={{ marginTop: 44, borderRadius: 24, overflow: 'hidden' }}>
            <div className="lb-g-2" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', alignItems: 'stretch' }}>

              {cvTab === 0 && (
                <>
                  <div className="lb-fade" style={{ background: '#F6F8FC', borderRight: '1px solid #EDF1F7', padding: '56px 40px 0', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', minHeight: 560 }}>
                    <div className="lb-doc" style={{ width: 360, height: 500, borderRadius: '6px 6px 0 0', padding: '32px 30px', display: 'flex', flexDirection: 'column', gap: 11, overflow: 'hidden' }}>
                      <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '0.01em' }}>VALERIA RÍOS</div>
                      <div style={{ fontSize: 9, color: '#4A4F59' }}>Analista de Operaciones &nbsp;|&nbsp; Ciudad de México &nbsp;|&nbsp; valeria.rios@correo.com</div>
                      <div style={{ height: '1.5px', background: '#1A1C24' }} />
                      <div style={{ fontSize: 9, fontWeight: 800 }}>RESUMEN</div>
                      <p style={{ fontSize: '8.5px', lineHeight: 1.55, color: '#3A3E47' }}>Perfil operativo con experiencia en seguimiento de pedidos, reportes semanales y coordinación administrativa.</p>
                      <div style={{ fontSize: 9, fontWeight: 800 }}>EXPERIENCIA RELEVANTE</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontWeight: 700 }}><span>Asistente administrativo</span><span style={{ fontWeight: 400, color: '#6B707B' }}>2 años</span></div>
                      <ul style={{ fontSize: '8.5px', lineHeight: 1.55, color: '#3A3E47', paddingLeft: 10, listStyle: 'disc' }}>
                        <li><span style={{ background: '#EEF1FF', borderRadius: 2, padding: '0 2px' }}>Reportes semanales</span> de seguimiento operativo.</li>
                        <li>Gestión de agendas y coordinación de reuniones.</li>
                        <li>Comunicación diaria por correo.</li>
                      </ul>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontWeight: 700 }}><span>Asistente de atención al cliente</span><span style={{ fontWeight: 400, color: '#6B707B' }}>2021 – 2022</span></div>
                      <ul style={{ fontSize: '8.5px', lineHeight: 1.55, color: '#3A3E47', paddingLeft: 10, listStyle: 'disc' }}>
                        <li><span style={{ background: '#EEF1FF', borderRadius: 2, padding: '0 2px' }}>Control de pedidos</span> y registros de pagos.</li>
                        <li>Atención por WhatsApp y correo.</li>
                      </ul>
                      <div style={{ fontSize: 9, fontWeight: 800 }}>HABILIDADES</div>
                      <p style={{ fontSize: '8.5px', color: '#3A3E47' }}>Hojas de cálculo, organización, reportes, atención al cliente</p>
                    </div>
                  </div>
                  <div className="lb-fade" style={{ padding: '56px 52px', display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><span className="lb-chip" style={{ background: '#EAF9F2', color: '#16A36A' }}>ATS Friendly</span><span className="lb-chip" style={{ background: '#EEF1FF', color: '#3D56E8' }}>Mejor para procesos corporativos</span></div>
                    <h3 style={{ fontSize: 30, lineHeight: 1.18, fontWeight: 700, letterSpacing: '-0.025em' }}>Destaca lo más relevante para esa oportunidad</h3>
                    <p className="lb-body">Introduce la descripción de la vacante y Momentum analiza sus requisitos frente a tu perfil profesional. Luego organiza tus experiencias, habilidades y logros reales para crear un CV enfocado en esa aplicación.</p>
                    <ul style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 16, fontWeight: 500, color: '#182944' }}>
                      {['Prioriza los elementos más relevantes de tu perfil.', 'Diseñado para estructuras claras y compatibles con ATS.', 'Ideal para aplicar a un cargo específico.', 'No agrega experiencia que no posees.'].map(t => <li key={t} style={{ display: 'flex', gap: 12 }}><Check />{t}</li>)}
                    </ul>
                    <a className="lb-btn lb-btn-primary" href="/register" style={{ alignSelf: 'flex-start', marginTop: 8 }}>Crear CV adaptado</a>
                  </div>
                </>
              )}

              {cvTab === 1 && (
                <>
                  <div className="lb-fade" style={{ background: '#F6F8FC', borderRight: '1px solid #EDF1F7', padding: '56px 40px 0', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', minHeight: 560 }}>
                    <div className="lb-doc" style={{ width: 360, height: 500, borderRadius: '6px 6px 0 0', padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}>
                      <div className="lb-serif" style={{ fontSize: 24, fontWeight: 600, textAlign: 'center' }}>Valeria Ríos</div>
                      <div style={{ fontSize: 9, color: '#4A4F59', textAlign: 'center' }}>valeria.rios@correo.com &nbsp;|&nbsp; Ciudad de México</div>
                      <div style={{ height: 1, background: '#E0E2EA' }} />
                      <div style={{ display: 'grid', gridTemplateColumns: '96px minmax(0, 1fr)', gap: 18 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                          <div style={{ fontSize: 9, fontWeight: 800, color: '#2F6B5A' }}>Habilidades</div>
                          <p style={{ fontSize: '8.5px', lineHeight: 1.8, color: '#3A3E47' }}>Organización<br />Atención al cliente<br />Hojas de cálculo<br />Redacción<br />Redes sociales</p>
                          <div style={{ fontSize: 9, fontWeight: 800, color: '#2F6B5A', paddingTop: 6 }}>Cursos</div>
                          <p style={{ fontSize: '8.5px', lineHeight: 1.8, color: '#3A3E47' }}>Excel intermedio<br />Servicio al cliente</p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                          <div style={{ fontSize: 9, fontWeight: 800, color: '#2F6B5A' }}>Experiencia</div>
                          <div style={{ fontSize: 9, fontWeight: 700 }}>Asistente administrativo</div>
                          <p style={{ fontSize: '8.5px', lineHeight: 1.55, color: '#3A3E47' }}>Agendas, correo y reportes semanales para el equipo de operaciones.</p>
                          <div style={{ fontSize: 9, fontWeight: 700 }}>Atención al cliente</div>
                          <p style={{ fontSize: '8.5px', lineHeight: 1.55, color: '#3A3E47' }}>Pedidos, pagos y soporte por WhatsApp en tienda online.</p>
                          <div style={{ fontSize: 9, fontWeight: 800, color: '#2F6B5A', paddingTop: 6 }}>Educación</div>
                          <div style={{ fontSize: 9, fontWeight: 700 }}>Lic. en Administración</div>
                          <p style={{ fontSize: '8.5px', color: '#6B707B' }}>En curso</p>
                          <div style={{ fontSize: 9, fontWeight: 800, color: '#2F6B5A', paddingTop: 6 }}>Proyectos</div>
                          <p style={{ fontSize: '8.5px', lineHeight: 1.55, color: '#3A3E47' }}>Control de inventario para emprendimiento familiar.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="lb-fade" style={{ padding: '56px 52px', display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><span className="lb-chip" style={{ background: '#EAF9F2', color: '#16A36A' }}>ATS Friendly</span></div>
                    <h3 style={{ fontSize: 30, lineHeight: 1.18, fontWeight: 700, letterSpacing: '-0.025em' }}>Cuenta tu trayectoria completa con claridad</h3>
                    <p className="lb-body">Un CV general reúne y estructura tu experiencia profesional, educación, habilidades y proyectos en un solo documento versátil.</p>
                    <p className="lb-body">Es ideal si tienes un perfil amplio, estás explorando diferentes oportunidades o necesitas una versión profesional base para compartir en varias aplicaciones.</p>
                    <ul style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 16, fontWeight: 500, color: '#182944' }}>
                      {['Resume tu recorrido profesional de forma estratégica.', 'Mantiene una estructura limpia y ATS friendly.', 'Útil como CV principal o documento de referencia.', 'Se construye a partir de toda la información de tu perfil.'].map(t => <li key={t} style={{ display: 'flex', gap: 12 }}><Check />{t}</li>)}
                    </ul>
                    <a className="lb-btn lb-btn-primary" href="/register" style={{ alignSelf: 'flex-start', marginTop: 8 }}>Crear CV general</a>
                  </div>
                </>
              )}

              {cvTab === 2 && (
                <>
                  <div className="lb-fade" style={{ background: '#F6F8FC', borderRight: '1px solid #EDF1F7', padding: '56px 40px 0', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', minHeight: 560 }}>
                    <div className="lb-doc" style={{ width: 360, height: 500, borderRadius: '6px 6px 0 0', overflow: 'hidden', display: 'grid', gridTemplateColumns: '124px minmax(0, 1fr)' }}>
                      <div style={{ background: '#2E2A26', color: '#FFFFFF', padding: '30px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ width: 60, height: 60, borderRadius: 99, background: 'linear-gradient(145deg, #E8CDB5, #B98B6A)' }} />
                        <div style={{ fontSize: 9, fontWeight: 700 }}>Contacto</div>
                        <p style={{ fontSize: '7.5px', lineHeight: 1.8, opacity: 0.8 }}>andrea.mora@correo.com<br />Guadalajara<br />portafolio.andreamora.com</p>
                        <div style={{ fontSize: 9, fontWeight: 700 }}>Herramientas</div>
                        <p style={{ fontSize: '7.5px', lineHeight: 1.8, opacity: 0.8 }}>Figma<br />Lightroom<br />Canva<br />CapCut</p>
                      </div>
                      <div style={{ padding: '30px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div className="lb-serif" style={{ fontSize: 28, lineHeight: 1, fontWeight: 600, letterSpacing: '-0.02em' }}>Andrea<br />Mora</div>
                        <div style={{ fontSize: 9, color: '#B0643A', fontWeight: 700 }}>Diseñadora de contenido</div>
                        <p style={{ fontSize: '8.5px', lineHeight: 1.55, color: '#3A3E47' }}>Creo piezas visuales y narrativas para marcas que quieren comunicar con claridad.</p>
                        <div style={{ fontSize: 9, fontWeight: 800, paddingTop: 4 }}>Experiencia</div>
                        <div style={{ fontSize: 9, fontWeight: 700 }}>Estudio independiente</div>
                        <p style={{ fontSize: '8.5px', lineHeight: 1.55, color: '#3A3E47' }}>Identidad y contenido para marcas locales.</p>
                        <div style={{ fontSize: 9, fontWeight: 700 }}>Agencia de medios</div>
                        <p style={{ fontSize: '8.5px', lineHeight: 1.55, color: '#3A3E47' }}>Diseño de campañas para redes sociales.</p>
                        <div style={{ fontSize: 9, fontWeight: 800, paddingTop: 4 }}>Trabajo seleccionado</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 5 }}>
                          <div style={{ height: 44, borderRadius: 4, background: '#EFE3D6' }} /><div style={{ height: 44, borderRadius: 4, background: '#D9D2C8' }} /><div style={{ height: 44, borderRadius: 4, background: '#C9B8A6' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="lb-fade" style={{ padding: '56px 52px', display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><span className="lb-chip" style={{ background: '#EEF1FF', color: '#3D56E8' }}>Visual / creativo</span><span className="lb-chip" style={{ background: '#FFF4DE', color: '#B45309' }}>Puede no ser ideal para ATS estrictos</span></div>
                    <h3 style={{ fontSize: 30, lineHeight: 1.18, fontWeight: 700, letterSpacing: '-0.025em' }}>Haz que tu perfil también se vea memorable</h3>
                    <p className="lb-body">Para quienes trabajan en áreas creativas o desean priorizar una presentación visual llamativa, Momentum ofrece plantillas premium que puedes personalizar.</p>
                    <p className="lb-body">Este estilo pone mayor énfasis en diseño, composición y personalidad visual. Puede ser especialmente útil para perfiles de diseño, marketing, contenido, comunicación, fotografía, moda, arte y roles similares.</p>
                    <ul style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 16, fontWeight: 500, color: '#182944' }}>
                      <li style={{ display: 'flex', gap: 12 }}><Check />Plantillas visuales y profesionales.</li>
                      <li style={{ display: 'flex', gap: 12 }}><Check />Personalización de estilos, colores y estructura.</li>
                      <li style={{ display: 'flex', gap: 12 }}><Check />Diseñado para compartir directamente con reclutadores o portafolios.</li>
                      <li style={{ display: 'flex', gap: 12 }}>
                        <svg className="lb-ic" width="18" height="18" viewBox="0 0 24 24" style={{ color: '#D97706', marginTop: 3 }} aria-hidden="true"><circle cx="12" cy="12" r="8" /><path d="M12 8v4.5M12 15.8v.2" /></svg>
                        No siempre es la opción ideal cuando una empresa usa filtros ATS estrictos.
                      </li>
                    </ul>
                    <div style={{ padding: '14px 16px', borderRadius: 12, background: '#FFF4DE', border: '1px solid #FBE3B5', fontSize: '14.5px', lineHeight: 1.5, color: '#7A4A06' }}>Si una vacante exige un CV ATS friendly, recomendamos elegir un CV adaptado a la vacante o un CV general.</div>
                    <a className="lb-btn lb-btn-primary" href="/register" style={{ alignSelf: 'flex-start', marginTop: 4 }}>Explorar CV Studio</a>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="lb-card" style={{ marginTop: 28, borderRadius: 20, padding: '8px 32px', overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: 720, borderCollapse: 'collapse', fontSize: 15, textAlign: 'left' }}>
              <thead>
                <tr style={{ fontSize: '13.5px', color: '#64748B' }}>
                  <th style={{ fontWeight: 600, padding: '18px 16px 18px 0', borderBottom: '1px solid #E2E8F0' }}>Tipo de CV</th>
                  <th style={{ fontWeight: 600, padding: '18px 16px', borderBottom: '1px solid #E2E8F0' }}>Ideal para</th>
                  <th style={{ fontWeight: 600, padding: '18px 16px', borderBottom: '1px solid #E2E8F0' }}>Qué prioriza</th>
                  <th style={{ fontWeight: 600, padding: '18px 0 18px 16px', borderBottom: '1px solid #E2E8F0' }}>Compatibilidad ATS</th>
                </tr>
              </thead>
              <tbody style={{ color: '#475569' }}>
                <tr>
                  <td style={{ padding: '18px 16px 18px 0', borderBottom: '1px solid #EDF1F7', fontWeight: 700, color: '#0B1B36' }}>CV adaptado a una vacante</td>
                  <td style={{ padding: '18px 16px', borderBottom: '1px solid #EDF1F7' }}>Aplicar a un cargo o empresa específica</td>
                  <td style={{ padding: '18px 16px', borderBottom: '1px solid #EDF1F7' }}>Coincidencia entre tu perfil y los requisitos de la vacante</td>
                  <td style={{ padding: '18px 0 18px 16px', borderBottom: '1px solid #EDF1F7' }}><span className="lb-chip" style={{ background: '#EAF9F2', color: '#16A36A' }}>Alta</span></td>
                </tr>
                <tr>
                  <td style={{ padding: '18px 16px 18px 0', borderBottom: '1px solid #EDF1F7', fontWeight: 700, color: '#0B1B36' }}>CV general</td>
                  <td style={{ padding: '18px 16px', borderBottom: '1px solid #EDF1F7' }}>Personas con un perfil amplio o que aplican a diferentes oportunidades</td>
                  <td style={{ padding: '18px 16px', borderBottom: '1px solid #EDF1F7' }}>Una visión completa, clara y ordenada de tu trayectoria</td>
                  <td style={{ padding: '18px 0 18px 16px', borderBottom: '1px solid #EDF1F7' }}><span className="lb-chip" style={{ background: '#EAF9F2', color: '#16A36A' }}>Alta</span></td>
                </tr>
                <tr>
                  <td style={{ padding: '18px 16px 18px 0', fontWeight: 700, color: '#0B1B36' }}>CV Studio</td>
                  <td style={{ padding: '18px 16px' }}>Roles visuales, creativos o flexibles</td>
                  <td style={{ padding: '18px 16px' }}>Diseño, personalidad visual y presentación premium</td>
                  <td style={{ padding: '18px 0 18px 16px' }}><span className="lb-chip" style={{ background: '#FFF4DE', color: '#B45309' }}>Variable</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ATS + HONESTY */}
      <section className="lb-pad-sec" style={{ paddingTop: 130, paddingBottom: 130, background: 'linear-gradient(180deg, #00123A 0%, #10255C 100%)', color: '#FFFFFF', position: 'relative' }}>
        <div style={{ position: 'absolute', left: '50%', top: -200, width: 900, height: 500, transform: 'translateX(-50%)', borderRadius: 999, background: 'radial-gradient(ellipse, rgba(74,103,255,0.22), rgba(74,103,255,0) 65%)' }} />
        <div className="lb-wrap" style={{ position: 'relative' }}>
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
            <span className="lb-badge" style={{ background: 'rgba(74,103,255,0.18)', color: '#B7C3FF' }}>ATS y honestidad</span>
            <h2 className="lb-h2" style={{ color: '#FFFFFF', maxWidth: 800 }}>Tu experiencia real, presentada estratégicamente</h2>
          </div>

          <div className="lb-g-2" style={{ marginTop: 52, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 56, alignItems: 'center', maxWidth: 1040, marginLeft: 'auto', marginRight: 'auto' }}>
            <p style={{ fontSize: 17, lineHeight: 1.75, color: '#A9B4CF' }}>Muchas empresas utilizan sistemas de seguimiento de candidatos, conocidos como ATS, para organizar y revisar aplicaciones. Estos sistemas suelen analizar la estructura del documento, los encabezados, el contenido y la relación entre el CV y los requisitos del cargo.</p>
            <div style={{ display: 'flex', gap: 22, alignItems: 'stretch' }}>
              <span style={{ width: 3, borderRadius: 2, background: '#4A67FF', flexShrink: 0 }} />
              <p style={{ fontSize: 22, lineHeight: 1.45, letterSpacing: '-0.015em', fontWeight: 600, color: '#FFFFFF', fontStyle: 'italic' }}>En Momentum creemos que la inteligencia artificial debe ayudarte a comunicar mejor tu trayectoria, no a inventar una que no existe.</p>
            </div>
          </div>

          <div className="lb-g-ats" style={{ marginTop: 72, display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 0.9fr)', gap: 20, alignItems: 'stretch' }}>
            <div style={{ background: '#FFFFFF', borderRadius: 20, padding: 36, boxShadow: '0 30px 60px -30px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, paddingBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ width: 48, height: 48, borderRadius: 12, background: '#4A67FF', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg className="lb-ic" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5l7 3v5.5c0 4.2-3 7.4-7 8.5-4-1.1-7-4.3-7-8.5V6.5z" /><path d="M9 12l2.2 2.2L15.5 10" /></svg></span>
                  <h3 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.015em', color: '#0B1B36' }}>Lo que Momentum sí hace</h3>
                </div>
                <span className="lb-chip" style={{ background: '#EEF1FF', color: '#3D56E8' }}>5 compromisos</span>
              </div>
              <ul style={{ display: 'flex', flexDirection: 'column' }}>
                {['Organiza la información con una estructura clara y fácil de interpretar.', 'Prioriza experiencias y habilidades relevantes para la vacante.', 'Utiliza plantillas diseñadas para formatos ATS friendly.', 'Te ayuda a convertir una vacante en una versión más estratégica de tu perfil.', 'Evita elementos visuales innecesarios en los formatos orientados a ATS.'].map((t, i) => (
                  <li key={t} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: i === 4 ? '16px 0 0' : '16px 0', borderTop: '1px solid #EDF1F7' }}>
                    <span style={{ width: 28, height: 28, borderRadius: 8, background: '#EEF1FF', color: '#4A67FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><svg className="lb-ic" width="15" height="15" viewBox="0 0 24 24" style={{ strokeWidth: 2.6 }} aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7" /></svg></span>
                    <span style={{ fontSize: 16, lineHeight: 1.55, fontWeight: 500, color: '#182944', paddingTop: 2 }}>{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: 36, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, paddingBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#B7C3FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg className="lb-ic" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><path d="M6 6l12 12" /></svg></span>
                  <h3 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.015em', color: '#FFFFFF' }}>Lo que Momentum no promete</h3>
                </div>
                <span className="lb-chip" style={{ background: 'rgba(255,255,255,0.06)', color: '#B7C3FF', border: '1px solid rgba(255,255,255,0.12)' }}>4 límites</span>
              </div>
              <ul style={{ display: 'flex', flexDirection: 'column' }}>
                {['No garantiza una entrevista, contratación ni resultado específico.', 'No inventa habilidades, cargos, estudios, certificaciones ni resultados.', 'No afirma que un CV pueda superar todos los sistemas de selección.', 'No reemplaza la importancia de tener un perfil que realmente encaje con la vacante.'].map((t, i) => (
                  <li key={t} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: i === 3 ? '16px 0 0' : '16px 0', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <span style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.06)', color: '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><svg className="lb-ic" width="14" height="14" viewBox="0 0 24 24" style={{ strokeWidth: 2.6 }} aria-hidden="true"><path d="M7 7l10 10M17 7L7 17" /></svg></span>
                    <span style={{ fontSize: 16, lineHeight: 1.55, color: '#C7CFE2', paddingTop: 2 }}>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="lb-panel" style={{ marginTop: 20, background: 'linear-gradient(120deg, #4A67FF 0%, #7B8FFF 100%)', padding: 56, borderRadius: 20, textAlign: 'center' }}>
            <p style={{ fontSize: 34, lineHeight: 1.22, letterSpacing: '-0.025em', fontWeight: 700, color: '#FFFFFF', maxWidth: 900, margin: '0 auto' }}>Un buen CV no inventa coincidencias. Hace visibles las coincidencias reales que ya existen en tu experiencia.</p>
          </div>

          <div className="lb-g-2" style={{ marginTop: 64, ...grid2 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: '16.5px', lineHeight: 1.7, color: '#A9B4CF' }}>
              <p>Tu CV se construye con información proveniente de tu perfil: experiencias, estudios, proyectos, habilidades, cursos y logros que tú has compartido.</p>
              <p>Si una vacante no encaja completamente con tu perfil, Momentum no inventa requisitos, responsabilidades ni resultados para forzar una coincidencia. En cambio, te ayuda a presentar de manera más clara y estratégica lo que realmente sabes hacer.</p>
            </div>
            <p style={{ fontSize: 28, lineHeight: 1.3, letterSpacing: '-0.02em', fontWeight: 700, color: '#FFFFFF' }}>No creamos una versión falsa de ti. Te ayudamos a presentar tu mejor versión real.</p>
          </div>
        </div>
      </section>

      {/* TRACKING */}
      <section id="seguimiento" className="lb-pad-sec" style={{ paddingTop: 130, paddingBottom: 120 }}>
        <div className="lb-wrap">
          <div className="lb-g-2" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 72, alignItems: 'end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <span className="lb-badge" style={{ alignSelf: 'flex-start' }}>Seguimiento de vacantes</span>
              <h2 className="lb-h2">No pierdas el control de las oportunidades a las que aplicas</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p className="lb-body">Buscar empleo implica mucho más que enviar un CV. También requiere recordar dónde aplicaste, cuándo lo hiciste, qué versión de tu CV enviaste y en qué etapa se encuentra cada proceso.</p>
              <p className="lb-body" style={{ color: '#0B1B36', fontWeight: 700 }}>Momentum reúne esa información en un solo lugar.</p>
            </div>
          </div>

          <div className="lb-panel lb-board" style={{ marginTop: 56, background: '#F8FAFC', border: '1px solid #EDF1F7', padding: 40 }}>
            <div className="lb-board-inner lb-card" style={{ padding: 22, borderRadius: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 4px 20px' }}>
                <span style={{ fontSize: 18, fontWeight: 700 }}>Mis aplicaciones</span>
                <span className="lb-chip" style={{ background: '#EEF1FF', color: '#3D56E8' }}>6 activas</span>
              </div>
              <div className="lb-g-track" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14 }}>
                <div style={{ background: '#F6F8FC', borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, padding: '2px 4px', color: '#182944' }}><span style={{ width: 8, height: 8, borderRadius: 99, background: '#4A67FF' }} />Enviadas<span style={{ color: '#94A3B8', fontWeight: 500 }}>2</span></div>
                  <div className="lb-card" style={{ padding: 14, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 10, boxShadow: 'none' }}><div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}><span style={{ fontSize: '14.5px', fontWeight: 700 }}>Analista de Operaciones</span><span style={{ fontSize: 13, color: '#64748B' }}>Nórdica Logística</span></div><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span className="lb-chip" style={{ height: 24, fontSize: 12, background: '#EEF1FF', color: '#3D56E8' }}>CV adaptado</span><span style={{ fontSize: 12, color: '#94A3B8' }}>Hoy</span></div></div>
                  <div className="lb-card" style={{ padding: 14, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 10, boxShadow: 'none' }}><div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}><span style={{ fontSize: '14.5px', fontWeight: 700 }}>Coordinadora administrativa</span><span style={{ fontSize: 13, color: '#64748B' }}>Grupo Alba</span></div><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span className="lb-chip" style={{ height: 24, fontSize: 12, background: '#EDF1F7', color: '#475569' }}>CV general</span><span style={{ fontSize: 12, color: '#94A3B8' }}>18 sep</span></div></div>
                </div>
                <div style={{ background: '#F6F8FC', borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, padding: '2px 4px', color: '#182944' }}><span style={{ width: 8, height: 8, borderRadius: 99, background: '#D97706' }} />En revisión<span style={{ color: '#94A3B8', fontWeight: 500 }}>2</span></div>
                  <div className="lb-card" style={{ padding: 14, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 10, boxShadow: 'none' }}><div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}><span style={{ fontSize: '14.5px', fontWeight: 700 }}>Ejecutiva de atención al cliente</span><span style={{ fontSize: 13, color: '#64748B' }}>Casa Lumen</span></div><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span className="lb-chip" style={{ height: 24, fontSize: 12, background: '#EEF1FF', color: '#3D56E8' }}>CV adaptado</span><span style={{ fontSize: 12, color: '#94A3B8' }}>10 sep</span></div></div>
                  <div className="lb-card" style={{ padding: 14, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 10, boxShadow: 'none' }}><div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}><span style={{ fontSize: '14.5px', fontWeight: 700 }}>Auxiliar de operaciones</span><span style={{ fontSize: 13, color: '#64748B' }}>Puerto Sur</span></div><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span className="lb-chip" style={{ height: 24, fontSize: 12, background: '#EDF1F7', color: '#475569' }}>CV general</span><span style={{ fontSize: 12, color: '#94A3B8' }}>6 sep</span></div></div>
                </div>
                <div style={{ background: '#F6F8FC', borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, padding: '2px 4px', color: '#182944' }}><span style={{ width: 8, height: 8, borderRadius: 99, background: '#16A36A' }} />Entrevista<span style={{ color: '#94A3B8', fontWeight: 500 }}>1</span></div>
                  <div className="lb-card" style={{ padding: 14, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 10, borderColor: '#B7C3FF', boxShadow: '0 8px 24px -12px rgba(74,103,255,0.35)' }}><div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}><span style={{ fontSize: '14.5px', fontWeight: 700 }}>Analista de inventarios</span><span style={{ fontSize: 13, color: '#64748B' }}>Estudio Faro</span></div><div style={{ fontSize: 13, fontWeight: 600, color: '#3D56E8', display: 'flex', alignItems: 'center', gap: 6 }}><svg className="lb-ic" width="15" height="15" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5.5" width="16" height="14" rx="2" /><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" /></svg>Jueves, 10:00</div><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span className="lb-chip" style={{ height: 24, fontSize: 12, background: '#EEF1FF', color: '#3D56E8' }}>CV adaptado</span><span style={{ fontSize: 12, color: '#94A3B8' }}>2 sep</span></div></div>
                </div>
                <div style={{ background: '#F6F8FC', borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, padding: '2px 4px', color: '#182944' }}><span style={{ width: 8, height: 8, borderRadius: 99, background: '#00123A' }} />Oferta<span style={{ color: '#94A3B8', fontWeight: 500 }}>0</span></div>
                  <div style={{ borderRadius: 12, padding: 16, border: '1.5px dashed #CBD5E1', fontSize: '13.5px', color: '#94A3B8', lineHeight: 1.5 }}>Arrastra aquí una aplicación cuando recibas una oferta.</div>
                </div>
              </div>
            </div>
          </div>

          <div className="lb-g-4" style={{ marginTop: 56, display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 28 }}>
            {[
              [<><circle key="1c" cx="12" cy="12" r="8" /><path key="1p" d="M12 8.5v7M8.5 12h7" /></>, 'Registra cada aplicación', 'Guarda la empresa, el cargo, la fecha de aplicación y los detalles importantes de la vacante.'],
              [<path key="2p" d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1 M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1" />, 'Conecta el CV con la vacante', 'Consulta exactamente qué CV utilizaste para cada oportunidad.'],
              [<><rect key="3r" x="4" y="5" width="16" height="14" rx="2" /><path key="3p" d="M9.5 5v14M14.5 5v14" /></>, 'Actualiza el estado del proceso', 'Lleva el control de aplicaciones enviadas, procesos en revisión, entrevistas, ofertas, rechazos o vacantes cerradas.'],
              [<path key="4p" d="M5 19V11M10 19V6M15 19v-5M20 19V9" />, 'Visualiza tu búsqueda de empleo', 'Ten una visión clara de tu actividad para organizar seguimientos y tomar mejores decisiones.'],
            ].map(([icon, title, body]) => (
              <div key={title as string} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <span className="lb-ib"><svg className="lb-ic" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">{icon}</svg></span>
                <h3 className="lb-h3">{title}</h3>
                <p className="lb-small">{body}</p>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 80, textAlign: 'center', fontSize: 28, lineHeight: 1.35, letterSpacing: '-0.02em', fontWeight: 700, color: '#07152F', maxWidth: 860, marginLeft: 'auto', marginRight: 'auto' }}>Cada CV que creas puede convertirse en una aplicación organizada, no en otro archivo perdido entre tus carpetas.</p>
        </div>
      </section>

      {/* WHO */}
      <section className="lb-pad-sec" style={{ paddingTop: 120, paddingBottom: 120, background: '#F8FAFC', borderTop: '1px solid #EDF1F7', borderBottom: '1px solid #EDF1F7' }}>
        <div className="lb-wrap">
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
            <span className="lb-badge">Para quién es Momentum</span>
            <h2 className="lb-h2" style={{ maxWidth: 820 }}>No necesitas tener una carrera perfecta para crear un gran CV</h2>
            <p className="lb-lead" style={{ maxWidth: 760 }}>Momentum está diseñado para acompañarte sin importar en qué etapa profesional te encuentres. Tu experiencia puede venir de un empleo formal, un proyecto independiente, prácticas, voluntariado, estudios, cursos, emprendimientos o responsabilidades que aprendiste haciendo.</p>
          </div>
          <div className="lb-g-4" style={{ marginTop: 60, ...grid4 }}>
            <div className="lb-panel" style={{ background: 'linear-gradient(160deg, #00123A, #10255C)', padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: 14, borderRadius: 20, minHeight: 280 }}>
              <span className="lb-ib" style={{ background: 'rgba(74,103,255,0.25)', color: '#B7C3FF' }}><svg className="lb-ic" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 9L12 5l8.5 4L12 13z" /><path d="M7 11v4.5c1.5 1.2 3.2 1.8 5 1.8s3.5-.6 5-1.8V11" /></svg></span>
              <h3 className="lb-h3" style={{ color: '#FFFFFF', fontSize: 21 }}>Estudiantes y personas sin experiencia laboral formal</h3>
              <p style={{ fontSize: 15, lineHeight: 1.65, color: '#A9B4CF' }}>Convierte estudios, proyectos personales, prácticas, voluntariados, habilidades y cursos en un CV estructurado y profesional.</p>
            </div>
            {[
              [<path key="a" d="M12 4l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.4l-4.8 2.5.9-5.4-3.9-3.8 5.4-.8z" />, 'Recién graduados', 'Presenta tu formación, proyectos académicos, certificaciones y primeras experiencias de forma clara y relevante.'],
              [<><rect key="b1" x="4" y="7" width="16" height="12" rx="2" /><path key="b2" d="M9 7V5.5h6V7" /></>, 'Profesionales con experiencia', 'Organiza una trayectoria amplia y adapta tus logros a diferentes oportunidades sin reconstruir el documento desde cero.'],
              [<path key="c" d="M4 17l6-6 4 4 6-7 M15 8h5v5" />, 'Personas en transición profesional', 'Destaca habilidades transferibles y experiencias relevantes mientras construyes una nueva dirección laboral.'],
            ].map(([icon, title, body]) => (
              <div key={title as string} className="lb-card" style={{ padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: 14, borderRadius: 20, minHeight: 280 }}>
                <span className="lb-ib"><svg className="lb-ic" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">{icon}</svg></span>
                <h3 className="lb-h3" style={{ fontSize: 21 }}>{title}</h3>
                <p className="lb-small">{body}</p>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 72, textAlign: 'center', fontSize: 25, lineHeight: 1.45, letterSpacing: '-0.015em', fontWeight: 700, color: '#07152F', maxWidth: 780, marginLeft: 'auto', marginRight: 'auto' }}>Tu valor profesional no depende de tener un CV perfecto desde el inicio. Empieza con lo que tienes y constrúyelo desde allí.</p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="lb-pad-sec" style={{ paddingTop: 130, paddingBottom: 130 }}>
        <div className="lb-wrap" style={{ maxWidth: 920 }}>
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <h2 className="lb-h2">Preguntas frecuentes</h2>
            <p className="lb-lead">¿No encuentras lo que buscas? <a href="#contacto" style={{ fontWeight: 700 }}>Escríbenos</a>.</p>
          </div>
          <div style={{ marginTop: 52, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {FAQ_ITEMS.map((item, i) => {
              const open = faqOpen === i;
              return (
                <div key={item.q} className="lb-card" style={{ boxShadow: 'none' }}>
                  <button className="lb-faq-q" aria-expanded={open} aria-controls={`faq-a-${i}`} onClick={() => setFaqOpen(open ? null : i)}>
                    <span>{item.q}</span>
                    <span style={{ width: 34, height: 34, borderRadius: 10, background: open ? '#4A67FF' : '#EEF1FF', color: open ? '#FFFFFF' : '#4A67FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg className="lb-ic" width="16" height="16" viewBox="0 0 24 24" style={{ strokeWidth: 2.6 }} aria-hidden="true">
                        {open ? <path d="M5 12h14" /> : <path d="M12 5v14M5 12h14" />}
                      </svg>
                    </span>
                  </button>
                  {open && <p id={`faq-a-${i}`} className="lb-fade" style={{ padding: '0 80px 24px 26px', fontSize: 16, lineHeight: 1.7, color: '#475569' }}>{item.a}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section id="empezar" style={{ paddingBottom: 110 }}>
        <div className="lb-wrap">
          <div className="lb-panel" style={{ background: 'linear-gradient(160deg, #00123A 0%, #10255C 100%)', padding: '96px 64px', borderRadius: 28 }}>
            <div style={{ position: 'absolute', left: '50%', bottom: -260, width: 900, height: 520, transform: 'translateX(-50%)', borderRadius: 999, background: 'radial-gradient(ellipse, rgba(74,103,255,0.30), rgba(74,103,255,0) 65%)' }} />
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 26 }}>
              <h2 className="lb-h1" style={{ color: '#FFFFFF', fontSize: 60, maxWidth: 860 }}>Tu próximo CV no tiene que empezar desde cero.</h2>
              <p style={{ fontSize: 19, lineHeight: 1.6, color: '#A9B4CF', maxWidth: 660 }}>Crea un perfil profesional que evoluciona contigo, genera CVs adaptados a tus oportunidades y mantén organizada tu búsqueda de empleo desde un solo lugar.</p>
              <a className="lb-btn lb-btn-primary" href="/register" style={{ height: 58, padding: '0 32px', fontSize: 17, marginTop: 6 }}>Crear mi CV gratis</a>
              <p style={{ fontSize: 15, fontWeight: 500, color: '#94A3B8' }}>Tu información. Tu experiencia. Tu próximo paso.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="contacto" style={{ background: '#00123A', paddingTop: 88, paddingBottom: 48 }}>
        <div className="lb-wrap">
          <div className="lb-g-foot" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) repeat(4, minmax(0, 1fr))', gap: 40 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 320 }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {/* No hay una variante clara del logo oficial — se invierte a blanco con filtro CSS para el fondo oscuro del footer. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/momentum-logo.svg" alt="Momentum CV" style={{ height: 22, filter: 'brightness(0) invert(1)' }} />
              </div>
              <p style={{ fontSize: 15, lineHeight: 1.65, color: '#94A3B8' }}>Momentum CV te ayuda a transformar tu experiencia real en CVs claros, profesionales y listos para nuevas oportunidades.</p>
            </div>
            <nav aria-label="Producto" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', paddingBottom: 4 }}>Producto</span>
              <a className="lb-flink" href="#como-funciona">Cómo funciona</a>
              <a className="lb-flink" href="#tipos">CV adaptado a vacantes</a>
              <a className="lb-flink" href="#tipos">CV general</a>
              <a className="lb-flink" href="#tipos">CV Studio</a>
              <a className="lb-flink" href="#seguimiento">Seguimiento de aplicaciones</a>
            </nav>
            <nav aria-label="Recursos" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', paddingBottom: 4 }}>Recursos</span>
              {['Guía para crear un CV', 'Qué es un CV ATS friendly', 'Cómo adaptar tu CV a una vacante', 'Cómo escribir experiencia laboral', 'Recursos para estudiantes', 'Consejos para entrevistas'].map(l => (
                <a key={l} className="lb-flink" href="#" onClick={e => e.preventDefault()} aria-disabled="true" title="Próximamente">{l}</a>
              ))}
            </nav>
            <nav aria-label="Empresa" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', paddingBottom: 4 }}>Empresa</span>
              <a className="lb-flink" href="#" onClick={e => e.preventDefault()} aria-disabled="true" title="Próximamente">Sobre Momentum CV</a>
              <a className="lb-flink" href="#contacto">Contacto</a>
              <a className="lb-flink" href="#" onClick={e => e.preventDefault()} aria-disabled="true" title="Próximamente">Ayuda</a>
              <a className="lb-flink" href="#faq">Preguntas frecuentes</a>
              <a className="lb-flink" href="/login">Iniciar sesión</a>
            </nav>
            <nav aria-label="Legal" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', paddingBottom: 4 }}>Legal</span>
              <a className="lb-flink" href="/terminos">Términos y condiciones</a>
              <a className="lb-flink" href="/privacidad">Política de privacidad</a>
              <a className="lb-flink" href="/cookies">Política de cookies</a>
              <a className="lb-flink" href="/uso-de-ia">Uso responsable de IA</a>
            </nav>
          </div>
          <div style={{ marginTop: 72, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, fontSize: 14, color: '#64748B' }}>
            <span>© 2026 Momentum CV</span>
            <span>Tu carrera evoluciona. Tu CV también.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
