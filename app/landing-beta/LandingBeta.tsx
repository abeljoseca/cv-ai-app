'use client';

import { useEffect, useState } from 'react';

/* ─────────────────────────────────────────────────────────────────────────
   Landing beta — visual redesign of the public home (app/page.tsx).
   COPY RULE: every visible string here is transcribed verbatim from
   app/page.tsx. Visuals (mockups, glyphs) use shapes, never new words.
───────────────────────────────────────────────────────────────────────── */

/* ── Icons ── */

function Icon({ d, className = '', size = 20, strokeWidth = 2 }: { d: string; className?: string; size?: number; strokeWidth?: number }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

const I = {
  check: 'M20 6 9 17l-5-5',
  x: 'M18 6 6 18M6 6l12 12',
  arrowRight: 'M5 12h14 M12 5l7 7-7 7',
  menu: 'M4 7h16M4 12h16M4 17h16',
  chat: 'M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z',
  upload: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M17 8l-5-5-5 5 M12 3v12',
  plus: 'M12 5v14M5 12h14',
  refresh: 'M21 12a9 9 0 0 1-15.5 6.2L3 16 M3 12a9 9 0 0 1 15.5-6.2L21 8 M21 3v5h-5 M3 21v-5h5',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8Z',
} as const;

/* ── Scroll reveal (IntersectionObserver, no dependency) ── */

function useReveal() {
  useEffect(() => {
    const root = document.querySelector('.lb');
    if (!root) return;
    const els = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'));
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) {
      els.forEach(el => el.classList.add('is-in'));
      return;
    }
    root.classList.add('lb-js');
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
}

function d(ms: number): React.CSSProperties {
  return { ['--d' as string]: `${ms}ms` } as React.CSSProperties;
}

/* ── Shared bits ── */

function Eyebrow({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <p className={`lb-eyebrow${dark ? ' lb-eyebrow--dark' : ''}`}>
      <span className="lb-eyebrow__dot" aria-hidden="true" />
      {children}
    </p>
  );
}

function Container({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`lb-container ${className}`}>{children}</div>;
}

/* ─────────────────────────────────────────────────────────────────────────
   Page
───────────────────────────────────────────────────────────────────────── */

export default function LandingBeta() {
  useReveal();
  return (
    <div className="lb">
      <Navbar />
      <main>
        <Hero />
        <TrustStrip />
        <Problem />
        <HowItWorks />
        <LivingProfile />
        <CVTypes />
        <ATSHonesty />
        <JobTracking />
        <ForWhom />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}

/* ── 1. Navbar ── */

function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const links = [
    { href: '#como-funciona', label: 'Cómo funciona' },
    { href: '#tipos-cv', label: 'Tipos de CV' },
    { href: '#seguimiento', label: 'Seguimiento de vacantes' },
    { href: '#faq', label: 'Preguntas frecuentes' },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`lb-nav${scrolled || open ? ' is-scrolled' : ''}`}>
      <div className="lb-nav__bar">
        <span className="lb-nav__logo">
          <img src="/momentum-logo.svg" alt="Momentum" />
        </span>

        <nav className="lb-nav__links" aria-label="Principal">
          {links.map(l => (
            <a key={l.href} href={l.href}>{l.label}</a>
          ))}
        </nav>

        <div className="lb-nav__actions">
          <a href="/login" className="lb-nav__login">Iniciar sesión</a>
          <a href="/register" className="lb-btn lb-btn--primary lb-btn--sm">Crear mi CV gratis</a>
        </div>

        <button className="lb-nav__toggle" onClick={() => setOpen(o => !o)} aria-label="Abrir menú" aria-expanded={open}>
          <Icon d={open ? I.x : I.menu} size={22} />
        </button>
      </div>

      <div className={`lb-nav__sheet${open ? ' is-open' : ''}`}>
        <div className="lb-nav__sheet-inner">
          {links.map(l => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="lb-nav__sheet-link">
              {l.label}
              <Icon d={I.arrowRight} size={16} />
            </a>
          ))}
          <div className="lb-nav__sheet-actions">
            <a href="/login" className="lb-btn lb-btn--ghost">Iniciar sesión</a>
            <a href="/register" className="lb-btn lb-btn--primary">Crear mi CV gratis</a>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ── 2. Hero ── */

function Hero() {
  const bullets = ['CVs compatibles con sistemas ATS', 'Adaptados a vacantes específicas', 'Sin inventar experiencia ni información', 'Descárgalos cuando quieras'];
  return (
    <section className="lb-hero">
      <div className="lb-hero__bg" aria-hidden="true">
        <div className="lb-hero__grid" />
        <div className="lb-orb lb-orb--a" />
        <div className="lb-orb lb-orb--b" />
        <div className="lb-orb lb-orb--c" />
      </div>

      <Container className="lb-hero__inner">
        <div className="lb-hero__copy">
          <h1 className="lb-h1 lb-enter" style={d(0)}>
            <span className="lb-h1__line">Tu experiencia cambia.</span>
            <br />
            <span className="lb-h1__line lb-gradient-text">Tu CV también debería hacerlo.</span>
          </h1>
          <p className="lb-hero__lead lb-enter" style={d(120)}>
            Crea CVs profesionales, adaptados a cada vacante y basados únicamente en tu experiencia real.
            Guarda tu información una sola vez y deja que Momentum la transforme en el CV que necesitas, cuando lo necesites.
          </p>

          <div className="lb-hero__ctas lb-enter" style={d(220)}>
            <a href="/register" className="lb-btn lb-btn--primary lb-btn--lg">
              Crear mi CV gratis
              <Icon d={I.arrowRight} size={18} className="lb-btn__arrow" />
            </a>
            <a href="#como-funciona" className="lb-btn lb-btn--ghost lb-btn--lg">
              Ver cómo funciona
            </a>
          </div>

          <p className="lb-hero__note lb-enter" style={d(300)}>No necesitas empezar desde cero cada vez que aplicas.</p>

          <ul className="lb-hero__bullets lb-enter" style={d(380)}>
            {bullets.map(item => (
              <li key={item}>
                <span className="lb-tick" aria-hidden="true"><Icon d={I.check} size={12} strokeWidth={3} /></span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <HeroStage />
      </Container>
    </section>
  );
}

function HeroStage() {
  return (
    <div className="lb-stage lb-enter" style={d(200)} aria-hidden="true">
      <div className="lb-stage__halo" />

      {/* Chat window */}
      <div className="lb-win lb-stage__chat">
        <div className="lb-win__chrome">
          <span /><span /><span />
          <div className="lb-win__url" />
        </div>
        <div className="lb-win__body">
          <div className="lb-chat__row lb-chat__row--me lb-pop" style={d(700)}>
            <div className="lb-bubble lb-bubble--me">
              Trabajé como asistente administrativo durante dos años y gestionaba agendas, correos y reportes semanales.
            </div>
          </div>
          <div className="lb-chat__row lb-pop" style={d(1250)}>
            <img src="/momentum-assistant.svg" alt="" className="lb-chat__avatar" />
            <div className="lb-bubble lb-bubble--ai">
              He añadido esta experiencia a tu perfil profesional.
            </div>
          </div>
          <div className="lb-chat__composer">
            <div className="lb-chat__composer-line" />
            <span className="lb-chat__send"><Icon d={I.arrowRight} size={14} strokeWidth={2.5} /></span>
          </div>
        </div>
      </div>

      {/* Lower row: generated CV + tracker */}
      <div className="lb-stage__row">
        <div className="lb-track lb-float">
          <span className="lb-status">
            <span className="lb-status__dot" />
            Enviada
          </span>
          <div>
            <p className="lb-track__title">Analista de Operaciones</p>
            <p className="lb-track__sub">Aplicación enviada</p>
          </div>
          <div className="lb-track__steps">
            <span className="is-done" /><span className="is-done" /><span /><span />
          </div>
        </div>

        <div className="lb-doc lb-stage__doc">
          <div className="lb-doc__head">
            <div className="lb-doc__avatar" />
            <div className="lb-doc__head-lines">
              <div className="lb-sk lb-sk--ink" style={{ width: '72%' }} />
              <div className="lb-sk" style={{ width: '48%' }} />
            </div>
          </div>
          <div className="lb-doc__section">
            <div className="lb-sk lb-sk--blue" style={{ width: '34%' }} />
            {[92, 80, 86].map((w, i) => (
              <div key={w} className="lb-doc__li">
                <span className="lb-doc__bullet" />
                <div className="lb-sk lb-grow" style={{ width: `${w}%`, ...d(1700 + i * 180) }} />
              </div>
            ))}
          </div>
          <div className="lb-doc__section">
            <div className="lb-sk lb-sk--blue" style={{ width: '28%' }} />
            <div className="lb-doc__chips">
              <span style={{ width: 38 }} /><span style={{ width: 52 }} /><span style={{ width: 30 }} /><span style={{ width: 44 }} />
            </div>
          </div>
          <span className="lb-doc__seal"><Icon d={I.check} size={14} strokeWidth={3} /></span>
        </div>
      </div>

      {/* Connector sparkle */}
      <span className="lb-stage__spark"><Icon d={I.sparkle} size={16} strokeWidth={1.6} /></span>
    </div>
  );
}

/* ── 3. Trust strip (bento) ── */

function TrustStrip() {
  const items = [
    { art: <ArtProfile />, title: 'Tu información, siempre disponible', body: 'Crea y actualiza tu perfil profesional una sola vez. Momentum recuerda tu experiencia para que no tengas que hacerlo.' },
    { art: <ArtTarget />, title: 'Adaptado a cada oportunidad', body: 'Introduce los detalles de una vacante y recibe un CV diseñado para destacar la experiencia más relevante de tu perfil.' },
    { art: <ArtShield />, title: 'Información real, nunca inventada', body: 'Momentum utiliza únicamente la información que existe en tu perfil. Si una vacante no encaja contigo, no inventamos habilidades ni experiencias.' },
    { art: <ArtDownload />, title: 'Listo para descargar y enviar', body: 'Revisa tu CV, ajusta lo que necesites y descárgalo todas las veces que quieras.' },
  ];
  return (
    <section className="lb-section" id="beneficios">
      <Container>
        <h2 className="lb-h2 lb-center lb-narrow" data-reveal>
          Un CV más estratégico, sin empezar de cero
        </h2>
        <div className="lb-bento">
          {items.map((it, i) => (
            <article key={it.title} className={`lb-bento__card lb-bento__card--${i + 1}`} data-reveal style={d(i * 90)}>
              <div className="lb-bento__art" aria-hidden="true">{it.art}</div>
              <div className="lb-bento__text">
                <h3 className="lb-h3">{it.title}</h3>
                <p className="lb-body">{it.body}</p>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}

function ArtProfile() {
  return (
    <div className="art art-profile">
      <div className="art-profile__card art-profile__card--back" />
      <div className="art-profile__card art-profile__card--mid" />
      <div className="art-profile__card art-profile__card--front">
        <div className="art-profile__top">
          <span className="art-profile__avatar" />
          <div className="art-profile__lines">
            <div className="lb-sk lb-sk--ink" style={{ width: '70%' }} />
            <div className="lb-sk" style={{ width: '45%' }} />
          </div>
        </div>
        {[88, 74, 81].map(w => (
          <div key={w} className="art-profile__row">
            <span className="art-profile__node" />
            <div className="lb-sk" style={{ width: `${w}%` }} />
          </div>
        ))}
      </div>
      <span className="art-profile__badge"><Icon d={I.check} size={14} strokeWidth={3} /></span>
    </div>
  );
}

function ArtTarget() {
  return (
    <div className="art art-target">
      <svg viewBox="0 0 200 200" className="art-target__rings">
        <defs>
          <radialGradient id="lbTargetG" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#4B6BFB" stopOpacity=".35" />
            <stop offset="100%" stopColor="#4B6BFB" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="lbTargetL" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4B6BFB" />
            <stop offset="100%" stopColor="#8B6CFF" />
          </linearGradient>
        </defs>
        <circle cx="100" cy="100" r="96" fill="url(#lbTargetG)" />
        <circle cx="100" cy="100" r="78" fill="none" stroke="#DDE3FE" strokeWidth="1.5" />
        <circle cx="100" cy="100" r="56" fill="none" stroke="#C7D0FD" strokeWidth="1.5" />
        <circle cx="100" cy="100" r="34" fill="none" stroke="url(#lbTargetL)" strokeWidth="2.5" />
        <circle cx="100" cy="100" r="12" fill="url(#lbTargetL)" />
        <circle cx="100" cy="100" r="78" fill="none" stroke="url(#lbTargetL)" strokeWidth="3" strokeLinecap="round" strokeDasharray="120 400" className="art-target__arc" />
      </svg>
      <div className="art-target__tag art-target__tag--a"><span /><div className="lb-sk" style={{ width: 46 }} /></div>
      <div className="art-target__tag art-target__tag--b"><span /><div className="lb-sk" style={{ width: 34 }} /></div>
    </div>
  );
}

function ArtShield() {
  return (
    <div className="art art-shield">
      <div className="art-shield__list">
        {[82, 66, 74].map(w => (
          <div key={w} className="art-shield__item">
            <span className="art-shield__ok"><Icon d={I.check} size={11} strokeWidth={3.2} /></span>
            <div className="lb-sk" style={{ width: `${w}%` }} />
          </div>
        ))}
        <div className="art-shield__item art-shield__item--no">
          <span className="art-shield__nope"><Icon d={I.x} size={11} strokeWidth={3.2} /></span>
          <div className="art-shield__ghost" />
        </div>
      </div>
      <svg viewBox="0 0 120 140" className="art-shield__glyph">
        <defs>
          <linearGradient id="lbShieldG" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#5B7BFF" />
            <stop offset="100%" stopColor="#3854E4" />
          </linearGradient>
        </defs>
        <path d="M60 6 110 24v38c0 34-22 58-50 72C32 120 10 96 10 62V24Z" fill="url(#lbShieldG)" />
        <path d="M60 18 98 32v30c0 26-16 46-38 58V18Z" fill="#fff" opacity=".12" />
        <path d="M40 70l14 14 28-30" fill="none" stroke="#fff" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function ArtDownload() {
  return (
    <div className="art art-download">
      <div className="art-download__doc">
        <div className="lb-sk lb-sk--ink" style={{ width: '60%' }} />
        <div className="lb-sk" style={{ width: '40%' }} />
        <div className="art-download__rule" />
        {[90, 76, 84, 58].map(w => <div key={w} className="lb-sk" style={{ width: `${w}%` }} />)}
      </div>
      <span className="art-download__btn"><Icon d="M12 4v12 M6 11l6 6 6-6 M5 20h14" size={20} strokeWidth={2.4} /></span>
    </div>
  );
}

/* ── 4. Problem ── */

function Problem() {
  const pains = [
    'No recuerdo exactamente qué hacía en mi empleo anterior.',
    'No sé cómo adaptar mi experiencia a una vacante.',
    'No sé si mi CV será leído correctamente por un sistema ATS.',
    'Termino enviando el mismo CV genérico a todas las empresas.',
    'Pierdo el seguimiento de las vacantes a las que ya apliqué.',
  ];
  return (
    <section className="lb-section lb-problem">
      <Container className="lb-split">
        <div data-reveal>
          <Eyebrow>El problema</Eyebrow>
          <h2 className="lb-h2">
            Crear un CV no debería sentirse como empezar tu carrera desde cero
          </h2>
          <p className="lb-lead">
            Cada vez que aparece una oportunidad, muchas personas tienen que volver a buscar fechas, recordar
            responsabilidades, encontrar logros antiguos, reorganizar secciones y redactar todo otra vez.
          </p>
          <p className="lb-lead">
            Y cuando el perfil cambia —con una nueva experiencia, curso, habilidad o proyecto— el CV suele
            quedarse desactualizado.
          </p>
          <p className="lb-callout">
            Momentum CV elimina ese ciclo. Tu trayectoria vive en un perfil profesional que puedes enriquecer
            con el tiempo, y desde allí puedes crear el CV adecuado para cada aplicación.
          </p>
        </div>
        <div className="lb-pains">
          {pains.map((p, i) => (
            <div key={p} className="lb-pain" data-reveal style={d(i * 80)}>
              <span className="lb-pain__q" aria-hidden="true">&ldquo;</span>
              <p>{p}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ── 5. How it works ── */

function HowItWorks() {
  const steps = [
    { n: '1', title: 'Cuéntale a Momentum sobre ti', body: 'Añade tu experiencia laboral, estudios, proyectos, habilidades, cursos y logros. Puedes completar tu información manualmente, adjuntar un CV anterior o simplemente conversar con la IA como lo harías con alguien de confianza.' },
    { n: '2', title: 'Mantén tu perfil vivo', body: '¿Empezaste un nuevo trabajo? ¿Terminaste un curso? ¿Participaste en un proyecto? Cuéntaselo a Momentum y la información se incorpora a tu perfil. No necesitas recordar todo desde el principio.' },
    { n: '3', title: 'Elige el tipo de CV que necesitas', body: 'Selecciona si quieres crear un CV adaptado a una vacante, un CV general o un CV creativo con una plantilla visual premium.' },
    { n: '4', title: 'Revisa, ajusta y descarga', body: 'Momentum crea una primera versión en segundos. Revisa la vista previa, edita cualquier detalle antes de exportar y descarga tu documento cuando esté listo.' },
  ];
  const bullets = [
    'Gestioné la atención a clientes a través de WhatsApp y correo electrónico.',
    'Organicé pedidos y realicé seguimiento a solicitudes de clientes.',
    'Actualicé registros de pagos y control operativo en hojas de cálculo.',
    'Apoyé la creación y publicación de contenido para Instagram.',
  ];
  return (
    <section id="como-funciona" className="lb-section lb-how">
      <Container>
        <div className="lb-head" data-reveal>
          <Eyebrow>Cómo funciona</Eyebrow>
          <h2 className="lb-h2">De tu experiencia a un CV listo para enviar</h2>
          <p className="lb-lead">
            No necesitas ser experto en redacción, diseño ni sistemas ATS. Momentum te acompaña desde tu perfil hasta la aplicación.
          </p>
        </div>

        <ol className="lb-steps">
          {steps.map((s, i) => (
            <li key={s.n} className="lb-step" data-reveal style={d(i * 110)}>
              <div className="lb-step__num"><span>{s.n}</span></div>
              <h3 className="lb-h3">{s.title}</h3>
              <p className="lb-body">{s.body}</p>
            </li>
          ))}
        </ol>

        {/* Transformation showcase */}
        <div className="lb-transform" data-reveal>
          <div className="lb-transform__raw">
            <p className="lb-kicker">Cuéntalo como lo recuerdas</p>
            <div className="lb-wave" aria-hidden="true">
              {Array.from({ length: 28 }).map((_, i) => (
                <span key={i} style={{ height: `${22 + Math.round(Math.abs(Math.sin(i * 1.7)) * 70)}%`, ...d(i * 40) }} />
              ))}
            </div>
            <p className="lb-transform__quote">
              &ldquo;Trabajé ayudando en una empresa pequeña. Respondía correos y mensajes, atendía clientes por
              WhatsApp, organizaba pedidos y a veces hacía publicaciones para Instagram. También llevaba una
              hoja de cálculo con pagos.&rdquo;
            </p>
          </div>

          <div className="lb-transform__bridge" aria-hidden="true">
            <span className="lb-transform__bridge-line" />
            <span className="lb-transform__bridge-core"><Icon d={I.sparkle} size={20} strokeWidth={1.8} /></span>
          </div>

          <div className="lb-transform__out">
            <p className="lb-kicker lb-kicker--blue">Así podría verse en tu perfil</p>
            <div className="lb-entry">
              <span className="lb-entry__mark" aria-hidden="true" />
              <div>
                <p className="lb-entry__title">Asistente de Operaciones y Atención al Cliente</p>
                <ul className="lb-entry__list">
                  {bullets.map((li, i) => (
                    <li key={li} style={d(200 + i * 120)}>
                      <span className="lb-entry__dash" aria-hidden="true">–</span>{li}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <p className="lb-caption" data-reveal>
          Momentum no cambia tu historia. La convierte en información clara, organizada y útil para un proceso de selección.
        </p>

        <div className="lb-center lb-mt-cta" data-reveal>
          <a href="/register" className="lb-btn lb-btn--primary lb-btn--lg">
            Crear mi perfil profesional
          </a>
        </div>
      </Container>
    </section>
  );
}

/* ── 6. Living profile (dark) ── */

function LivingProfile() {
  const cards = [
    { icon: I.chat, title: 'Habla con la IA de forma natural', body: 'No hace falta conocer el formato correcto. Puedes explicar tus experiencias con tus propias palabras.' },
    { icon: I.upload, title: 'Sube un CV anterior', body: 'Aprovecha la información que ya tienes para comenzar más rápido.' },
    { icon: I.plus, title: 'Agrega información cuando la recuerdes', body: 'No tienes que completar toda tu trayectoria en una sola sesión.' },
    { icon: I.refresh, title: 'Mantén todo actualizado', body: 'Una nueva experiencia puede estar disponible para tus futuros CVs sin volver a escribirla desde cero.' },
  ];
  return (
    <section className="lb-living">
      <div className="lb-living__bg" aria-hidden="true">
        <div className="lb-living__glow lb-living__glow--a" />
        <div className="lb-living__glow lb-living__glow--b" />
        <svg className="lb-orbit" viewBox="0 0 600 600">
          <defs>
            <linearGradient id="lbOrbitG" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#7C93FF" />
              <stop offset="100%" stopColor="#A78BFA" />
            </linearGradient>
          </defs>
          <circle cx="300" cy="300" r="120" fill="none" stroke="rgba(255,255,255,.10)" />
          <circle cx="300" cy="300" r="190" fill="none" stroke="rgba(255,255,255,.07)" />
          <circle cx="300" cy="300" r="260" fill="none" stroke="rgba(255,255,255,.05)" />
          <circle cx="300" cy="300" r="190" fill="none" stroke="url(#lbOrbitG)" strokeWidth="2" strokeDasharray="90 1100" strokeLinecap="round" className="lb-orbit__arc" />
          <g className="lb-orbit__spin">
            <circle cx="420" cy="300" r="6" fill="#7C93FF" />
            <circle cx="300" cy="110" r="4" fill="#A78BFA" />
            <circle cx="60" cy="330" r="5" fill="#5AC8FA" />
            <circle cx="470" cy="470" r="3.5" fill="#fff" opacity=".7" />
          </g>
          <circle cx="300" cy="300" r="46" fill="url(#lbOrbitG)" opacity=".9" />
          <circle cx="300" cy="300" r="70" fill="none" stroke="rgba(124,147,255,.35)" className="lb-orbit__pulse" />
        </svg>
      </div>

      <Container className="lb-living__inner">
        <div className="lb-living__head" data-reveal>
          <Eyebrow dark>Perfil vivo</Eyebrow>
          <h2 className="lb-h2 lb-h2--light">
            Tu perfil profesional no es un formulario. Es una historia que evoluciona contigo.
          </h2>
          <p className="lb-lead lb-lead--light">
            Tu carrera cambia con el tiempo. Adquieres nuevas habilidades, participas en proyectos, cambias de
            trabajo, tomas cursos o descubres logros que antes no habías incluido. Momentum te permite construir
            un perfil profesional vivo, en lugar de crear un CV desde cero cada vez.
          </p>
        </div>

        <div className="lb-glass-grid">
          {cards.map((c, i) => (
            <div key={c.title} className="lb-glass" data-reveal style={d(i * 90)}>
              <span className="lb-glass__icon"><Icon d={c.icon} size={18} /></span>
              <h3 className="lb-glass__title">{c.title}</h3>
              <p className="lb-glass__body">{c.body}</p>
            </div>
          ))}
        </div>

        <p className="lb-living__close" data-reveal>
          Tu información permanece contigo. Cada nuevo CV comienza con una mejor versión de tu perfil.
        </p>
      </Container>
    </section>
  );
}

/* ── 7. CV types ── */

type CVKind = 'tailored' | 'general' | 'studio';

function CVTypes() {
  const types: { kind: CVKind; badge: string; title: string; subtitle: string; body: string; bullets: string[]; cta: string }[] = [
    {
      kind: 'tailored', badge: 'ATS Friendly',
      title: 'CV adaptado a una vacante', subtitle: 'Destaca lo más relevante para esa oportunidad',
      body: 'Introduce la descripción de la vacante y Momentum analiza sus requisitos frente a tu perfil profesional. Luego organiza tus experiencias, habilidades y logros reales para crear un CV enfocado en esa aplicación.',
      bullets: ['Prioriza los elementos más relevantes de tu perfil', 'Diseñado para estructuras claras y compatibles con ATS', 'Ideal para aplicar a un cargo específico', 'No agrega experiencia que no posees'],
      cta: 'Crear CV adaptado',
    },
    {
      kind: 'general', badge: 'ATS Friendly',
      title: 'CV general', subtitle: 'Cuenta tu trayectoria completa con claridad',
      body: 'Un CV general reúne y estructura tu experiencia profesional, educación, habilidades y proyectos en un solo documento versátil. Ideal si tienes un perfil amplio o estás explorando diferentes oportunidades.',
      bullets: ['Resume tu recorrido profesional de forma estratégica', 'Mantiene una estructura limpia y ATS friendly', 'Útil como CV principal o documento de referencia', 'Se construye a partir de toda la información de tu perfil'],
      cta: 'Crear CV general',
    },
    {
      kind: 'studio', badge: 'Visual / creativo',
      title: 'CV Studio', subtitle: 'Haz que tu perfil también se vea memorable',
      body: 'Para quienes trabajan en áreas creativas o desean priorizar una presentación visual llamativa, Momentum ofrece plantillas premium que puedes personalizar con total libertad de diseño.',
      bullets: ['Plantillas visuales y profesionales', 'Personalización de estilos, colores y estructura', 'Diseñado para compartir directamente con reclutadores o portafolios', 'Puede no ser ideal para ATS estrictos'],
      cta: 'Explorar CV Studio',
    },
  ];
  return (
    <section id="tipos-cv" className="lb-section">
      <Container>
        <div className="lb-head" data-reveal>
          <Eyebrow>Tipos de CV</Eyebrow>
          <h2 className="lb-h2">Un CV para cada forma de buscar trabajo</h2>
          <p className="lb-lead">
            No todas las oportunidades requieren el mismo enfoque. Momentum te ayuda a elegir el formato que mejor responde a tu objetivo.
          </p>
        </div>

        <div className="lb-types">
          {types.map((t, i) => (
            <article key={t.title} className={`lb-type lb-type--${t.kind}`} data-reveal style={d(i * 110)}>
              <div className="lb-type__preview" aria-hidden="true">
                <MiniCV kind={t.kind} />
              </div>
              <div className="lb-type__body">
                <span className={`lb-badge lb-badge--${t.kind === 'studio' ? 'violet' : 'green'}`}>{t.badge}</span>
                <h3 className="lb-type__title">{t.title}</h3>
                <p className="lb-type__subtitle">{t.subtitle}</p>
                <p className="lb-body">{t.body}</p>
                <ul className="lb-type__list">
                  {t.bullets.map(b => (
                    <li key={b}>
                      <span className="lb-tick lb-tick--sm" aria-hidden="true"><Icon d={I.check} size={10} strokeWidth={3.2} /></span>
                      {b}
                    </li>
                  ))}
                </ul>
                <a href="/register" className="lb-type__cta">
                  {t.cta}
                  <Icon d={I.arrowRight} size={16} className="lb-btn__arrow" />
                </a>
              </div>
            </article>
          ))}
        </div>
        <p className="lb-caption" data-reveal>
          Si una vacante exige un CV ATS friendly, recomendamos elegir un CV adaptado a la vacante o un CV general.
        </p>
      </Container>
    </section>
  );
}

function MiniCV({ kind }: { kind: CVKind }) {
  if (kind === 'studio') {
    return (
      <div className="mini mini--studio">
        <div className="mini__side">
          <span className="mini__photo" />
          <div className="lb-sk lb-sk--white" style={{ width: '80%' }} />
          <div className="lb-sk lb-sk--white-soft" style={{ width: '60%' }} />
          <div className="mini__side-gap" />
          {[70, 55, 64].map(w => <div key={w} className="lb-sk lb-sk--white-soft" style={{ width: `${w}%` }} />)}
        </div>
        <div className="mini__main">
          <div className="lb-sk lb-sk--violet" style={{ width: '42%' }} />
          {[92, 78, 85].map(w => <div key={w} className="lb-sk" style={{ width: `${w}%` }} />)}
          <div className="mini__gap" />
          <div className="lb-sk lb-sk--violet" style={{ width: '36%' }} />
          <div className="mini__tiles"><span /><span /><span /></div>
        </div>
      </div>
    );
  }
  return (
    <div className={`mini mini--${kind}`}>
      <div className="mini__header">
        <div className="lb-sk lb-sk--ink" style={{ width: '46%' }} />
        <div className="lb-sk" style={{ width: '30%' }} />
      </div>
      <div className="mini__rule" />
      {kind === 'tailored' ? (
        <>
          <div className="lb-sk lb-sk--blue" style={{ width: '30%' }} />
          {[88, 94, 72].map((w, i) => (
            <div key={w} className="mini__li">
              <span className={i < 2 ? 'mini__hl' : ''} />
              <div className={`lb-sk${i < 2 ? ' lb-sk--hl' : ''}`} style={{ width: `${w}%` }} />
            </div>
          ))}
          <div className="mini__gap" />
          <div className="lb-sk lb-sk--blue" style={{ width: '24%' }} />
          {[80, 66].map(w => <div key={w} className="lb-sk" style={{ width: `${w}%` }} />)}
        </>
      ) : (
        <div className="mini__cols">
          <div>
            <div className="lb-sk lb-sk--blue" style={{ width: '50%' }} />
            {[90, 76, 84, 70].map(w => <div key={w} className="lb-sk" style={{ width: `${w}%` }} />)}
          </div>
          <div>
            <div className="lb-sk lb-sk--blue" style={{ width: '60%' }} />
            {[82, 68, 88, 60].map(w => <div key={w} className="lb-sk" style={{ width: `${w}%` }} />)}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── 8. ATS + honesty ── */

function ATSHonesty() {
  const does = [
    'Organiza la información con una estructura clara y fácil de interpretar',
    'Prioriza experiencias y habilidades relevantes para la vacante',
    'Utiliza plantillas diseñadas para formatos ATS friendly',
    'Te ayuda a convertir una vacante en una versión más estratégica de tu perfil',
  ];
  const doesnt = [
    'No garantiza una entrevista, contratación ni resultado específico',
    'No inventa habilidades, cargos, estudios, certificaciones ni resultados',
    'No afirma que un CV pueda superar todos los sistemas de selección',
    'No reemplaza la importancia de tener un perfil que realmente encaje con la vacante',
  ];
  return (
    <section className="lb-section lb-honesty">
      <Container>
        <div className="lb-head lb-head--wide" data-reveal>
          <Eyebrow>Honestidad e IA</Eyebrow>
          <h2 className="lb-h2">Tu experiencia real, presentada estratégicamente</h2>
          <p className="lb-lead">
            Muchas empresas utilizan sistemas de seguimiento de candidatos (ATS) para organizar y revisar
            aplicaciones. En Momentum creemos que la inteligencia artificial debe ayudarte a comunicar mejor
            tu trayectoria, no a inventar una que no existe.
          </p>
        </div>

        <div className="lb-ledger">
          <div className="lb-ledger__col lb-ledger__col--yes" data-reveal>
            <div className="lb-ledger__head">
              <span className="lb-ledger__glyph"><Icon d={I.check} size={18} strokeWidth={2.8} /></span>
              <h3>Lo que Momentum sí hace</h3>
            </div>
            <ul>
              {does.map(li => (
                <li key={li}><Icon d={I.check} size={16} strokeWidth={2.6} className="lb-ledger__i" />{li}</li>
              ))}
            </ul>
          </div>
          <div className="lb-ledger__col lb-ledger__col--no" data-reveal style={d(120)}>
            <div className="lb-ledger__head">
              <span className="lb-ledger__glyph"><Icon d={I.x} size={18} strokeWidth={2.8} /></span>
              <h3>Lo que Momentum no promete</h3>
            </div>
            <ul>
              {doesnt.map(li => (
                <li key={li}><Icon d={I.x} size={16} strokeWidth={2.6} className="lb-ledger__i" />{li}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="lb-statement" data-reveal>
          <p className="lb-statement__big">
            Un buen CV no inventa coincidencias. Hace visibles las coincidencias reales que ya existen en tu experiencia.
          </p>
          <p className="lb-statement__small">
            Si una vacante no encaja completamente con tu perfil, Momentum no inventa requisitos, responsabilidades
            ni resultados para forzar una coincidencia. En cambio, te ayuda a presentar de manera más clara y
            estratégica lo que realmente sabes hacer.
          </p>
        </div>
      </Container>
    </section>
  );
}

/* ── 9. Job tracking ── */

function JobTracking() {
  const items = [
    { title: 'Registra cada aplicación', body: 'Guarda la empresa, el cargo, la fecha de aplicación y los detalles importantes de la vacante.' },
    { title: 'Conecta el CV con la vacante', body: 'Consulta exactamente qué CV utilizaste para cada oportunidad.' },
    { title: 'Actualiza el estado del proceso', body: 'Lleva el control de aplicaciones enviadas, procesos en revisión, entrevistas, ofertas, rechazos o vacantes cerradas.' },
    { title: 'Visualiza tu búsqueda de empleo', body: 'Ten una visión clara de tu actividad para organizar seguimientos y tomar mejores decisiones.' },
  ];
  const columns = [
    { tone: 'blue', cards: [3, 2, 3] },
    { tone: 'amber', cards: [2, 3, 2] },
    { tone: 'violet', cards: [3, 2] },
    { tone: 'green', cards: [2] },
  ];
  return (
    <section id="seguimiento" className="lb-section lb-tracking">
      <Container>
        <div className="lb-split lb-split--center">
          <div data-reveal>
            <Eyebrow>Seguimiento de vacantes</Eyebrow>
            <h2 className="lb-h2">No pierdas el control de las oportunidades a las que aplicas</h2>
            <p className="lb-lead">
              Buscar empleo implica mucho más que enviar un CV. También requiere recordar dónde aplicaste,
              cuándo lo hiciste, qué versión de tu CV enviaste y en qué etapa se encuentra cada proceso.
              Momentum reúne esa información en un solo lugar.
            </p>
            <p className="lb-callout">
              Cada CV que creas puede convertirse en una aplicación organizada, no en otro archivo perdido entre tus carpetas.
            </p>
          </div>

          <div className="lb-board" data-reveal style={d(120)} aria-hidden="true">
            <div className="lb-board__bar">
              <span /><span /><span />
            </div>
            <div className="lb-board__cols">
              {columns.map((c, ci) => (
                <div key={c.tone} className={`lb-board__col lb-board__col--${c.tone}`}>
                  <div className="lb-board__colhead"><span className="lb-board__dot" /><div className="lb-sk" style={{ width: '60%' }} /></div>
                  {c.cards.map((lines, k) => (
                    <div key={k} className={`lb-board__card${ci === 1 && k === 0 ? ' is-active' : ''}`}>
                      <div className="lb-board__card-top">
                        <span className="lb-board__logo" />
                        <div className="lb-sk lb-sk--ink" style={{ width: '62%' }} />
                      </div>
                      {Array.from({ length: lines - 1 }).map((_, li) => (
                        <div key={li} className="lb-sk" style={{ width: `${80 - li * 18}%` }} />
                      ))}
                      <div className="lb-board__cv"><span /><div className="lb-sk lb-sk--blue" style={{ width: 28 }} /></div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lb-track-items">
          {items.map((it, i) => (
            <div key={it.title} className="lb-track-item" data-reveal style={d(i * 90)}>
              <span className="lb-track-item__n" aria-hidden="true">
                <Icon d={I.check} size={14} strokeWidth={2.8} />
              </span>
              <h3 className="lb-h3">{it.title}</h3>
              <p className="lb-body">{it.body}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ── 10. For whom ── */

function ForWhom() {
  const personas = [
    { title: 'Estudiantes y personas sin experiencia laboral formal', body: 'Convierte estudios, proyectos personales, prácticas, voluntariados, habilidades y cursos en un CV estructurado y profesional.' },
    { title: 'Recién graduados', body: 'Presenta tu formación, proyectos académicos, certificaciones y primeras experiencias de forma clara y relevante.' },
    { title: 'Profesionales con experiencia', body: 'Organiza una trayectoria amplia y adapta tus logros a diferentes oportunidades sin reconstruir el documento desde cero.' },
    { title: 'Personas en transición profesional', body: 'Destaca habilidades transferibles y experiencias relevantes mientras construyes una nueva dirección laboral.' },
  ];
  return (
    <section className="lb-section lb-whom">
      <Container>
        <div className="lb-head" data-reveal>
          <Eyebrow>Para quién es Momentum</Eyebrow>
          <h2 className="lb-h2">No necesitas tener una carrera perfecta para crear un gran CV</h2>
          <p className="lb-lead">
            Momentum está diseñado para acompañarte sin importar en qué etapa profesional te encuentres.
          </p>
        </div>
        <div className="lb-personas">
          {personas.map((p, i) => (
            <article key={p.title} className="lb-persona" data-reveal style={d(i * 90)}>
              <PersonaGlyph stage={i} />
              <div>
                <h3 className="lb-h3">{p.title}</h3>
                <p className="lb-body">{p.body}</p>
              </div>
            </article>
          ))}
        </div>
        <p className="lb-closing" data-reveal>
          Tu valor profesional no depende de tener un CV perfecto desde el inicio. Empieza con lo que tienes y constrúyelo desde allí.
        </p>
      </Container>
    </section>
  );
}

/* A small "growth curve" glyph: each persona is a later point on the same line. */
function PersonaGlyph({ stage }: { stage: number }) {
  const pts = [[8, 50], [30, 40], [52, 26], [74, 12]];
  const [cx, cy] = pts[stage];
  return (
    <svg className="lb-persona__glyph" viewBox="0 0 84 60" aria-hidden="true">
      <defs>
        <linearGradient id={`lbPg${stage}`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#4B6BFB" />
          <stop offset="100%" stopColor="#8B6CFF" />
        </linearGradient>
      </defs>
      <path d="M8 50 C 22 46, 26 42, 30 40 S 46 30, 52 26 S 68 15, 74 12" fill="none" stroke="#DDE3FE" strokeWidth="3" strokeLinecap="round" />
      <path d="M8 50 C 22 46, 26 42, 30 40 S 46 30, 52 26 S 68 15, 74 12" fill="none" stroke={`url(#lbPg${stage})`} strokeWidth="3" strokeLinecap="round" pathLength={100} strokeDasharray={`${[4, 36, 68, 100][stage]} 100`} />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === stage ? 0 : 3} fill={i < stage ? '#4B6BFB' : '#DDE3FE'} />
      ))}
      <circle cx={cx} cy={cy} r="9" fill={`url(#lbPg${stage})`} opacity=".18" />
      <circle cx={cx} cy={cy} r="5.5" fill={`url(#lbPg${stage})`} />
    </svg>
  );
}

/* ── 11. FAQ ── */

const FAQ_ITEMS = [
  { q: '¿Momentum CV inventa experiencia, habilidades o logros?', a: 'No. Momentum utiliza la información real disponible en tu perfil profesional. Puede ayudarte a redactar, organizar y presentar mejor tu experiencia, pero no inventa cargos, estudios, certificaciones, responsabilidades ni resultados.' },
  { q: '¿Qué es un CV ATS friendly?', a: 'Es un CV diseñado con una estructura clara que facilita su lectura por sistemas de seguimiento de candidatos (ATS) y por reclutadores. En Momentum, los CVs adaptados a una vacante y los CVs generales están orientados a este tipo de estructura.' },
  { q: '¿Momentum garantiza que conseguiré una entrevista o empleo?', a: 'No. Conseguir una entrevista depende de muchos factores, como los requisitos de la vacante, el número de candidatos y el proceso de selección de cada empresa. Momentum te ayuda a presentar tu perfil de forma más clara, estratégica y profesional.' },
  { q: '¿Puedo crear un CV si todavía no tengo experiencia laboral?', a: 'Sí. Puedes incluir educación, cursos, habilidades, proyectos personales, prácticas, voluntariados, actividades extracurriculares, emprendimientos y cualquier experiencia relevante para tu objetivo profesional.' },
  { q: '¿Puedo usar un CV que ya tengo?', a: 'Sí. Puedes adjuntar un CV anterior para aprovechar la información que ya existe y comenzar a construir o actualizar tu perfil profesional.' },
  { q: '¿Qué ocurre si olvido información importante sobre mi experiencia?', a: 'No pasa nada. Puedes añadirla más adelante. Momentum está diseñado para que tu perfil crezca contigo: puedes actualizarlo cada vez que recuerdes un detalle, completes un curso o tengas una nueva experiencia.' },
  { q: '¿Puedo crear más de un CV?', a: 'Sí. Puedes crear distintas versiones de tu CV para diferentes vacantes, sectores, objetivos profesionales o estilos de presentación.' },
  { q: '¿Puedo descargar mi CV más de una vez?', a: 'Sí. Una vez creado y revisado, podrás descargarlo cuando lo necesites.' },
  { q: '¿Cuándo debería usar CV Studio?', a: 'Es útil para áreas como diseño, marketing, contenido, comunicación, fotografía, arte, moda y otros roles donde la presentación visual aporta valor. Para vacantes con filtros ATS estrictos, recomendamos utilizar un CV adaptado a la vacante o un CV general.' },
  { q: '¿Puedo hacer seguimiento a mis aplicaciones?', a: 'Sí. Momentum te permite registrar las vacantes a las que aplicas, la fecha de aplicación, el estado del proceso y el CV que utilizaste en cada caso.' },
];

function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  return (
    <section id="faq" className="lb-section lb-faq">
      <Container className="lb-faq__grid">
        <div className="lb-faq__side" data-reveal>
          <Eyebrow>Preguntas frecuentes</Eyebrow>
          <h2 className="lb-h2">Todo lo que quieras saber antes de empezar</h2>
        </div>
        <div className="lb-faq__list" data-reveal style={d(100)}>
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = openIdx === i;
            const id = `lb-faq-${i}`;
            return (
              <div key={item.q} className={`lb-faq__item${isOpen ? ' is-open' : ''}`}>
                <button
                  className="lb-faq__q"
                  onClick={() => setOpenIdx(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  aria-controls={id}
                >
                  <span>{item.q}</span>
                  <span className="lb-faq__icon" aria-hidden="true" />
                </button>
                <div id={id} className="lb-faq__a" role="region" aria-hidden={!isOpen}>
                  <div>
                    <p>{item.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

/* ── 12. Final CTA ── */

function FinalCTA() {
  return (
    <section className="lb-section lb-final-wrap">
      <Container>
        <div className="lb-final" data-reveal>
          <div className="lb-final__bg" aria-hidden="true">
            <div className="lb-final__grid" />
            <div className="lb-final__orb lb-final__orb--a" />
            <div className="lb-final__orb lb-final__orb--b" />
          </div>
          <div className="lb-final__inner">
            <h2 className="lb-final__title">Tu próximo CV no tiene que empezar desde cero.</h2>
            <p className="lb-final__lead">
              Crea un perfil profesional que evoluciona contigo, genera CVs adaptados a tus oportunidades y mantén
              organizada tu búsqueda de empleo desde un solo lugar.
            </p>
            <a href="/register" className="lb-btn lb-btn--white lb-btn--lg">
              Crear mi CV gratis
              <Icon d={I.arrowRight} size={18} className="lb-btn__arrow" />
            </a>
            <p className="lb-final__foot">Tu información. Tu experiencia. Tu próximo paso.</p>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ── 13. Footer ── */

function Footer() {
  const producto = [
    { label: 'Cómo funciona', href: '#como-funciona' },
    { label: 'CV adaptado a vacantes', href: '#tipos-cv' },
    { label: 'CV general', href: '#tipos-cv' },
    { label: 'CV Studio', href: '#tipos-cv' },
    { label: 'Seguimiento de aplicaciones', href: '#seguimiento' },
  ];
  const empresa = [
    { label: 'Preguntas frecuentes', href: '#faq' },
    { label: 'Iniciar sesión', href: '/login' },
    { label: 'Crear cuenta', href: '/register' },
  ];
  const legal = [
    { label: 'Privacidad', href: '/privacidad' },
    { label: 'Términos y condiciones', href: '/terminos' },
    { label: 'Cookies', href: '/cookies' },
    { label: 'Uso de IA', href: '/uso-de-ia' },
  ];
  return (
    <footer className="lb-footer">
      <Container>
        <div className="lb-footer__grid">
          <div className="lb-footer__brand">
            <img src="/momentum-logo.svg" alt="Momentum" />
            <p>
              Momentum CV te ayuda a transformar tu experiencia real en CVs claros, profesionales y listos para nuevas oportunidades.
            </p>
          </div>
          <FooterCol title="Producto" links={producto} />
          <FooterCol title="Cuenta" links={empresa} />
          <FooterCol title="Legal" links={legal} />
        </div>
        <div className="lb-footer__bottom">
          © {new Date().getFullYear()} Momentum CV. Todos los derechos reservados.
        </div>
      </Container>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div className="lb-footer__col">
      <p className="lb-footer__title">{title}</p>
      <ul>
        {links.map(l => (
          <li key={l.label}><a href={l.href}>{l.label}</a></li>
        ))}
      </ul>
    </div>
  );
}
