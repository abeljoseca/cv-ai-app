'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { calcularPuntajeCompletitud } from '@/lib/completitud';

/* ─────────────────────────────────────────────────────────────────────────
   Icons — small inline SVGs, no external icon library
───────────────────────────────────────────────────────────────────────── */

function Icon({ path, className = 'w-5 h-5', style }: { path: string; className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}

const ICONS = {
  profile: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  target: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M12 12h.01',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z',
  download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3',
  chevronDown: 'M6 9l6 6 6-6',
  check: 'M20 6 9 17l-5-5',
  x: 'M18 6 6 18M6 6l12 12',
  arrowRight: 'M5 12h14 M12 5l7 7-7 7',
} as const;

/* ─────────────────────────────────────────────────────────────────────────
   Section shell
───────────────────────────────────────────────────────────────────────── */

function Section({ id, className = '', children }: { id?: string; className?: string; children: React.ReactNode }) {
  return (
    <section id={id} className={`px-6 sm:px-8 ${className}`}>
      <div className="max-w-6xl mx-auto">{children}</div>
    </section>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--blue)' }}>{children}</p>;
}

/* ─────────────────────────────────────────────────────────────────────────
   Landing page (rendered for signed-out visitors)
───────────────────────────────────────────────────────────────────────── */

function Landing() {
  return (
    <div style={{ background: 'var(--bg)', color: 'var(--ink)' }}>
      <Navbar />
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
      <Footer />
    </div>
  );
}

/* ── 1. Navbar ── */

function Navbar() {
  const [open, setOpen] = useState(false);
  const links = [
    { href: '#como-funciona', label: 'Cómo funciona' },
    { href: '#tipos-cv', label: 'Tipos de CV' },
    { href: '#seguimiento', label: 'Seguimiento de vacantes' },
    { href: '#faq', label: 'Preguntas frecuentes' },
  ];
  return (
    <header className="sticky top-0 z-40 backdrop-blur" style={{ background: 'rgba(247,248,251,.85)', borderBottom: '1px solid var(--line)' }}>
      <div className="max-w-6xl mx-auto px-6 sm:px-8 h-16 flex items-center justify-between">
        <img src="/momentum-logo.svg" alt="Momentum" style={{ height: 26 }} />

        <nav className="hidden lg:flex items-center gap-7">
          {links.map(l => (
            <a key={l.href} href={l.href} className="text-sm font-medium hover:opacity-70 transition-opacity" style={{ color: 'var(--mute)' }}>
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <a href="/login" className="text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-70 transition-opacity" style={{ color: 'var(--ink)' }}>
            Iniciar sesión
          </a>
          <a href="/register" className="text-sm font-semibold px-4 py-2.5 rounded-lg text-white transition-transform hover:-translate-y-0.5" style={{ background: 'var(--blue)' }}>
            Crear mi CV gratis
          </a>
        </div>

        <button className="lg:hidden p-2 -mr-2" onClick={() => setOpen(o => !o)} aria-label="Abrir menú">
          <Icon path={open ? 'M18 6 6 18M6 6l12 12' : 'M3 6h18M3 12h18M3 18h18'} className="w-6 h-6" />
        </button>
      </div>

      {open && (
        <div className="lg:hidden px-6 pb-5 flex flex-col gap-4" style={{ borderTop: '1px solid var(--line)' }}>
          {links.map(l => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-sm font-medium pt-4" style={{ color: 'var(--mute)' }}>
              {l.label}
            </a>
          ))}
          <a href="/login" className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Iniciar sesión</a>
          <a href="/register" className="text-sm font-semibold text-center px-4 py-2.5 rounded-lg text-white" style={{ background: 'var(--blue)' }}>
            Crear mi CV gratis
          </a>
        </div>
      )}
    </header>
  );
}

/* ── 2. Hero ── */

function Hero() {
  return (
    <Section className="pt-16 pb-20 sm:pt-24 sm:pb-28">
      <div className="grid lg:grid-cols-2 gap-14 items-center">
        <div>
          <h1 className="font-extrabold tracking-tight" style={{ fontSize: 'clamp(2rem, 4.5vw, 3.25rem)', lineHeight: 1.08, color: 'var(--ink)' }}>
            Tu experiencia cambia.<br />Tu CV también debería hacerlo.
          </h1>
          <p className="mt-6 text-lg leading-relaxed" style={{ color: 'var(--mute)', maxWidth: 520 }}>
            Crea CVs profesionales, adaptados a cada vacante y basados únicamente en tu experiencia real.
            Guarda tu información una sola vez y deja que Momentum la transforme en el CV que necesitas, cuando lo necesites.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <a href="/register" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-white font-semibold transition-transform hover:-translate-y-0.5" style={{ background: 'var(--blue)' }}>
              Crear mi CV gratis
              <Icon path={ICONS.arrowRight} className="w-4 h-4" />
            </a>
            <a href="#como-funciona" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold" style={{ border: '1px solid var(--line)', color: 'var(--ink)', background: 'var(--surface)' }}>
              Ver cómo funciona
            </a>
          </div>

          <p className="mt-4 text-sm" style={{ color: 'var(--mute)' }}>No necesitas empezar desde cero cada vez que aplicas.</p>

          <ul className="mt-8 grid grid-cols-2 gap-x-6 gap-y-3">
            {['CVs compatibles con sistemas ATS', 'Adaptados a vacantes específicas', 'Sin inventar experiencia ni información', 'Descárgalos cuando quieras'].map(item => (
              <li key={item} className="flex items-start gap-2 text-sm" style={{ color: 'var(--ink)' }}>
                <span className="mt-0.5 flex-shrink-0 rounded-full p-0.5" style={{ background: 'var(--blue-50)', color: 'var(--blue)' }}>
                  <Icon path={ICONS.check} className="w-3.5 h-3.5" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <HeroVisual />
      </div>
    </Section>
  );
}

function HeroVisual() {
  return (
    <div className="relative">
      <div className="absolute inset-0 -z-10 rounded-[2rem] blur-3xl opacity-60" style={{ background: 'radial-gradient(circle at 30% 20%, var(--blue-100), transparent 60%)' }} />

      {/* Chat card */}
      <div className="rounded-2xl p-5 mb-4" style={{ background: 'var(--surface)', border: '1px solid var(--line)', boxShadow: '0 4px 6px rgba(15,23,42,.04), 0 12px 32px -4px rgba(15,23,42,.08)' }}>
        <div className="flex justify-end mb-3">
          <div className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm text-white" style={{ background: 'var(--blue)' }}>
            Trabajé como asistente administrativo durante dos años y gestionaba agendas, correos y reportes semanales.
          </div>
        </div>
        <div className="flex justify-start gap-2 items-start">
          <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white" style={{ background: 'var(--ink)' }}>M</div>
          <div className="max-w-[85%] rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm" style={{ background: 'var(--lav)', color: 'var(--ink)' }}>
            He añadido esta experiencia a tu perfil profesional.
          </div>
        </div>
      </div>

      {/* CV preview + tracker row */}
      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-3 rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--line)', boxShadow: '0 4px 6px rgba(15,23,42,.04), 0 12px 32px -4px rgba(15,23,42,.08)' }}>
          <div className="h-2.5 w-2/3 rounded-full mb-2.5" style={{ background: 'var(--ink)', opacity: 0.85 }} />
          <div className="h-2 w-1/2 rounded-full mb-4" style={{ background: 'var(--line)' }} />
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-2 mb-2 items-start">
              <span className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0" style={{ background: 'var(--blue)' }} />
              <div className="h-2 rounded-full flex-1" style={{ background: 'var(--line-soft)', maxWidth: `${90 - i * 12}%` }} />
            </div>
          ))}
        </div>

        <div className="col-span-2 rounded-2xl p-4 flex flex-col justify-between" style={{ background: 'var(--surface)', border: '1px solid var(--line)', boxShadow: '0 4px 6px rgba(15,23,42,.04), 0 12px 32px -4px rgba(15,23,42,.08)' }}>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-full w-fit" style={{ background: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#16A34A' }} />
            Enviada
          </span>
          <div>
            <p className="text-xs font-semibold leading-tight" style={{ color: 'var(--ink)' }}>Analista de Operaciones</p>
            <p className="text-[11px] mt-1" style={{ color: 'var(--mute)' }}>Aplicación enviada</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── 3. Trust strip ── */

function TrustStrip() {
  const items = [
    { icon: ICONS.profile, title: 'Tu información, siempre disponible', body: 'Crea y actualiza tu perfil profesional una sola vez. Momentum recuerda tu experiencia para que no tengas que hacerlo.' },
    { icon: ICONS.target, title: 'Adaptado a cada oportunidad', body: 'Introduce los detalles de una vacante y recibe un CV diseñado para destacar la experiencia más relevante de tu perfil.' },
    { icon: ICONS.shield, title: 'Información real, nunca inventada', body: 'Momentum utiliza únicamente la información que existe en tu perfil. Si una vacante no encaja contigo, no inventamos habilidades ni experiencias.' },
    { icon: ICONS.download, title: 'Listo para descargar y enviar', body: 'Revisa tu CV, ajusta lo que necesites y descárgalo todas las veces que quieras.' },
  ];
  return (
    <Section className="py-16 sm:py-20" id="beneficios">
      <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12" style={{ color: 'var(--ink)' }}>
        Un CV más estratégico, sin empezar de cero
      </h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map(it => (
          <div key={it.title} className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: 'var(--blue-50)', color: 'var(--blue)' }}>
              <Icon path={it.icon} className="w-5 h-5" />
            </div>
            <h3 className="font-semibold mb-2" style={{ color: 'var(--ink)' }}>{it.title}</h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--mute)' }}>{it.body}</p>
          </div>
        ))}
      </div>
    </Section>
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
    <Section className="py-16 sm:py-20">
      <div className="grid lg:grid-cols-2 gap-12 items-start">
        <div>
          <Eyebrow>El problema</Eyebrow>
          <h2 className="text-2xl sm:text-3xl font-bold mt-2 mb-5" style={{ color: 'var(--ink)' }}>
            Crear un CV no debería sentirse como empezar tu carrera desde cero
          </h2>
          <p className="leading-relaxed mb-4" style={{ color: 'var(--mute)' }}>
            Cada vez que aparece una oportunidad, muchas personas tienen que volver a buscar fechas, recordar
            responsabilidades, encontrar logros antiguos, reorganizar secciones y redactar todo otra vez.
          </p>
          <p className="leading-relaxed mb-6" style={{ color: 'var(--mute)' }}>
            Y cuando el perfil cambia —con una nueva experiencia, curso, habilidad o proyecto— el CV suele
            quedarse desactualizado.
          </p>
          <p className="leading-relaxed font-medium" style={{ color: 'var(--ink)' }}>
            Momentum CV elimina ese ciclo. Tu trayectoria vive en un perfil profesional que puedes enriquecer
            con el tiempo, y desde allí puedes crear el CV adecuado para cada aplicación.
          </p>
        </div>
        <div className="rounded-2xl p-2" style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
          {pains.map((p, i) => (
            <div key={p} className="flex items-start gap-3 px-4 py-3.5" style={{ borderBottom: i < pains.length - 1 ? '1px solid var(--line-soft)' : 'none' }}>
              <span className="mt-0.5 text-lg leading-none" style={{ color: 'var(--mute)' }}>&ldquo;</span>
              <p className="text-sm italic" style={{ color: 'var(--ink)' }}>{p}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
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
  return (
    <Section id="como-funciona" className="py-16 sm:py-20">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <Eyebrow>Cómo funciona</Eyebrow>
        <h2 className="text-2xl sm:text-3xl font-bold mt-2 mb-4" style={{ color: 'var(--ink)' }}>
          De tu experiencia a un CV listo para enviar
        </h2>
        <p style={{ color: 'var(--mute)' }}>
          No necesitas ser experto en redacción, diseño ni sistemas ATS. Momentum te acompaña desde tu perfil hasta la aplicación.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {steps.map(s => (
          <div key={s.n}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm mb-4 text-white" style={{ background: 'var(--blue)' }}>
              {s.n}
            </div>
            <h3 className="font-semibold mb-2" style={{ color: 'var(--ink)' }}>{s.title}</h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--mute)' }}>{s.body}</p>
          </div>
        ))}
      </div>

      {/* "Cuéntalo como lo recuerdas" example */}
      <div className="rounded-2xl overflow-hidden grid lg:grid-cols-2" style={{ border: '1px solid var(--line)', background: 'var(--surface)' }}>
        <div className="p-8" style={{ borderRight: '1px solid var(--line)' }}>
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--mute)' }}>Cuéntalo como lo recuerdas</p>
          <p className="italic leading-relaxed" style={{ color: 'var(--ink)' }}>
            &ldquo;Trabajé ayudando en una empresa pequeña. Respondía correos y mensajes, atendía clientes por
            WhatsApp, organizaba pedidos y a veces hacía publicaciones para Instagram. También llevaba una
            hoja de cálculo con pagos.&rdquo;
          </p>
        </div>
        <div className="p-8">
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--blue)' }}>Así podría verse en tu perfil</p>
          <p className="font-semibold text-sm mb-2" style={{ color: 'var(--ink)' }}>Asistente de Operaciones y Atención al Cliente</p>
          <ul className="space-y-1.5">
            {[
              'Gestioné la atención a clientes a través de WhatsApp y correo electrónico.',
              'Organicé pedidos y realicé seguimiento a solicitudes de clientes.',
              'Actualicé registros de pagos y control operativo en hojas de cálculo.',
              'Apoyé la creación y publicación de contenido para Instagram.',
            ].map(li => (
              <li key={li} className="text-sm flex gap-2" style={{ color: 'var(--mute)' }}>
                <span className="flex-shrink-0" style={{ color: 'var(--blue)' }}>–</span>{li}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="text-center text-sm mt-6" style={{ color: 'var(--mute)' }}>
        Momentum no cambia tu historia. La convierte en información clara, organizada y útil para un proceso de selección.
      </p>

      <div className="flex justify-center mt-8">
        <a href="/register" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold transition-transform hover:-translate-y-0.5" style={{ background: 'var(--blue)' }}>
          Crear mi perfil profesional
        </a>
      </div>
    </Section>
  );
}

/* ── 6. Living profile ── */

function LivingProfile() {
  const cards = [
    { title: 'Habla con la IA de forma natural', body: 'No hace falta conocer el formato correcto. Puedes explicar tus experiencias con tus propias palabras.' },
    { title: 'Sube un CV anterior', body: 'Aprovecha la información que ya tienes para comenzar más rápido.' },
    { title: 'Agrega información cuando la recuerdes', body: 'No tienes que completar toda tu trayectoria en una sola sesión.' },
    { title: 'Mantén todo actualizado', body: 'Una nueva experiencia puede estar disponible para tus futuros CVs sin volver a escribirla desde cero.' },
  ];
  return (
    <Section className="py-16 sm:py-20">
      <div className="rounded-3xl p-8 sm:p-12" style={{ background: 'var(--ink)' }}>
        <Eyebrow>Perfil vivo</Eyebrow>
        <h2 className="text-2xl sm:text-3xl font-bold mt-2 mb-4 text-white max-w-2xl">
          Tu perfil profesional no es un formulario. Es una historia que evoluciona contigo.
        </h2>
        <p className="leading-relaxed max-w-2xl mb-10" style={{ color: 'rgba(255,255,255,.65)' }}>
          Tu carrera cambia con el tiempo. Adquieres nuevas habilidades, participas en proyectos, cambias de
          trabajo, tomas cursos o descubres logros que antes no habías incluido. Momentum te permite construir
          un perfil profesional vivo, en lugar de crear un CV desde cero cada vez.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map(c => (
            <div key={c.title} className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)' }}>
              <h3 className="font-semibold text-sm mb-2 text-white">{c.title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,.6)' }}>{c.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-10 font-medium text-white">
          Tu información permanece contigo. Cada nuevo CV comienza con una mejor versión de tu perfil.
        </p>
      </div>
    </Section>
  );
}

/* ── 7. CV types ── */

function CVTypes() {
  const types = [
    {
      badge: 'ATS Friendly', badgeColor: '#166534', badgeBg: '#F0FDF4', badgeBorder: '#BBF7D0',
      title: 'CV adaptado a una vacante', subtitle: 'Destaca lo más relevante para esa oportunidad',
      body: 'Introduce la descripción de la vacante y Momentum analiza sus requisitos frente a tu perfil profesional. Luego organiza tus experiencias, habilidades y logros reales para crear un CV enfocado en esa aplicación.',
      bullets: ['Prioriza los elementos más relevantes de tu perfil', 'Diseñado para estructuras claras y compatibles con ATS', 'Ideal para aplicar a un cargo específico', 'No agrega experiencia que no posees'],
      cta: 'Crear CV adaptado',
    },
    {
      badge: 'ATS Friendly', badgeColor: '#166534', badgeBg: '#F0FDF4', badgeBorder: '#BBF7D0',
      title: 'CV general', subtitle: 'Cuenta tu trayectoria completa con claridad',
      body: 'Un CV general reúne y estructura tu experiencia profesional, educación, habilidades y proyectos en un solo documento versátil. Ideal si tienes un perfil amplio o estás explorando diferentes oportunidades.',
      bullets: ['Resume tu recorrido profesional de forma estratégica', 'Mantiene una estructura limpia y ATS friendly', 'Útil como CV principal o documento de referencia', 'Se construye a partir de toda la información de tu perfil'],
      cta: 'Crear CV general',
    },
    {
      badge: 'Visual / creativo', badgeColor: '#9333EA', badgeBg: '#FAF5FF', badgeBorder: '#E9D5FF',
      title: 'CV Studio', subtitle: 'Haz que tu perfil también se vea memorable',
      body: 'Para quienes trabajan en áreas creativas o desean priorizar una presentación visual llamativa, Momentum ofrece plantillas premium que puedes personalizar con total libertad de diseño.',
      bullets: ['Plantillas visuales y profesionales', 'Personalización de estilos, colores y estructura', 'Diseñado para compartir directamente con reclutadores o portafolios', 'Puede no ser ideal para ATS estrictos'],
      cta: 'Explorar CV Studio',
    },
  ];
  return (
    <Section id="tipos-cv" className="py-16 sm:py-20">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <Eyebrow>Tipos de CV</Eyebrow>
        <h2 className="text-2xl sm:text-3xl font-bold mt-2 mb-4" style={{ color: 'var(--ink)' }}>
          Un CV para cada forma de buscar trabajo
        </h2>
        <p style={{ color: 'var(--mute)' }}>
          No todas las oportunidades requieren el mismo enfoque. Momentum te ayuda a elegir el formato que mejor responde a tu objetivo.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {types.map(t => (
          <div key={t.title} className="rounded-2xl p-6 flex flex-col" style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
            <span className="inline-flex w-fit items-center text-[11px] font-semibold px-2.5 py-1 rounded-full mb-4" style={{ color: t.badgeColor, background: t.badgeBg, border: `1px solid ${t.badgeBorder}` }}>
              {t.badge}
            </span>
            <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--ink)' }}>{t.title}</h3>
            <p className="text-sm font-medium mb-3" style={{ color: 'var(--blue)' }}>{t.subtitle}</p>
            <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--mute)' }}>{t.body}</p>
            <ul className="space-y-2 mb-6 flex-1">
              {t.bullets.map(b => (
                <li key={b} className="flex items-start gap-2 text-sm" style={{ color: 'var(--ink)' }}>
                  <span className="mt-0.5 flex-shrink-0" style={{ color: 'var(--blue)' }}><Icon path={ICONS.check} className="w-3.5 h-3.5" /></span>
                  {b}
                </li>
              ))}
            </ul>
            <a href="/register" className="text-center text-sm font-semibold px-4 py-2.5 rounded-xl" style={{ background: 'var(--blue-50)', color: 'var(--blue)' }}>
              {t.cta}
            </a>
          </div>
        ))}
      </div>
      <p className="text-center text-sm" style={{ color: 'var(--mute)' }}>
        Si una vacante exige un CV ATS friendly, recomendamos elegir un CV adaptado a la vacante o un CV general.
      </p>
    </Section>
  );
}

/* ── 8. ATS + honesty ── */

function ATSHonesty() {
  return (
    <Section className="py-16 sm:py-20">
      <div className="max-w-3xl mx-auto text-center mb-12">
        <Eyebrow>Honestidad e IA</Eyebrow>
        <h2 className="text-2xl sm:text-3xl font-bold mt-2 mb-5" style={{ color: 'var(--ink)' }}>
          Tu experiencia real, presentada estratégicamente
        </h2>
        <p className="leading-relaxed" style={{ color: 'var(--mute)' }}>
          Muchas empresas utilizan sistemas de seguimiento de candidatos (ATS) para organizar y revisar
          aplicaciones. En Momentum creemos que la inteligencia artificial debe ayudarte a comunicar mejor
          tu trayectoria, no a inventar una que no existe.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-10">
        <div className="rounded-2xl p-6" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
          <h3 className="font-semibold mb-4" style={{ color: '#166534' }}>Lo que Momentum sí hace</h3>
          <ul className="space-y-2.5">
            {[
              'Organiza la información con una estructura clara y fácil de interpretar',
              'Prioriza experiencias y habilidades relevantes para la vacante',
              'Utiliza plantillas diseñadas para formatos ATS friendly',
              'Te ayuda a convertir una vacante en una versión más estratégica de tu perfil',
            ].map(li => (
              <li key={li} className="flex items-start gap-2 text-sm" style={{ color: '#166534' }}>
                <Icon path={ICONS.check} className="w-4 h-4 flex-shrink-0 mt-0.5" />{li}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl p-6" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
          <h3 className="font-semibold mb-4" style={{ color: '#B91C1C' }}>Lo que Momentum no promete</h3>
          <ul className="space-y-2.5">
            {[
              'No garantiza una entrevista, contratación ni resultado específico',
              'No inventa habilidades, cargos, estudios, certificaciones ni resultados',
              'No afirma que un CV pueda superar todos los sistemas de selección',
              'No reemplaza la importancia de tener un perfil que realmente encaje con la vacante',
            ].map(li => (
              <li key={li} className="flex items-start gap-2 text-sm" style={{ color: '#B91C1C' }}>
                <Icon path={ICONS.x} className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {li}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="text-center max-w-2xl mx-auto">
        <p className="text-lg font-semibold mb-4" style={{ color: 'var(--ink)' }}>
          Un buen CV no inventa coincidencias. Hace visibles las coincidencias reales que ya existen en tu experiencia.
        </p>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--mute)' }}>
          Si una vacante no encaja completamente con tu perfil, Momentum no inventa requisitos, responsabilidades
          ni resultados para forzar una coincidencia. En cambio, te ayuda a presentar de manera más clara y
          estratégica lo que realmente sabes hacer.
        </p>
      </div>
    </Section>
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
  return (
    <Section id="seguimiento" className="py-16 sm:py-20">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <Eyebrow>Seguimiento de vacantes</Eyebrow>
          <h2 className="text-2xl sm:text-3xl font-bold mt-2 mb-5" style={{ color: 'var(--ink)' }}>
            No pierdas el control de las oportunidades a las que aplicas
          </h2>
          <p className="leading-relaxed mb-6" style={{ color: 'var(--mute)' }}>
            Buscar empleo implica mucho más que enviar un CV. También requiere recordar dónde aplicaste,
            cuándo lo hiciste, qué versión de tu CV enviaste y en qué etapa se encuentra cada proceso.
            Momentum reúne esa información en un solo lugar.
          </p>
          <p className="font-medium" style={{ color: 'var(--ink)' }}>
            Cada CV que creas puede convertirse en una aplicación organizada, no en otro archivo perdido entre tus carpetas.
          </p>
        </div>
        <div className="grid gap-4">
          {items.map(it => (
            <div key={it.title} className="rounded-xl p-4 flex gap-4" style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
              <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: 'var(--blue-50)', color: 'var(--blue)' }}>
                <Icon path={ICONS.check} className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1" style={{ color: 'var(--ink)' }}>{it.title}</h3>
                <p className="text-sm" style={{ color: 'var(--mute)' }}>{it.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
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
    <Section className="py-16 sm:py-20">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <Eyebrow>Para quién es Momentum</Eyebrow>
        <h2 className="text-2xl sm:text-3xl font-bold mt-2 mb-4" style={{ color: 'var(--ink)' }}>
          No necesitas tener una carrera perfecta para crear un gran CV
        </h2>
        <p style={{ color: 'var(--mute)' }}>
          Momentum está diseñado para acompañarte sin importar en qué etapa profesional te encuentres.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 gap-6 mb-10">
        {personas.map(p => (
          <div key={p.title} className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
            <h3 className="font-semibold mb-2" style={{ color: 'var(--ink)' }}>{p.title}</h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--mute)' }}>{p.body}</p>
          </div>
        ))}
      </div>
      <p className="text-center font-medium max-w-xl mx-auto" style={{ color: 'var(--ink)' }}>
        Tu valor profesional no depende de tener un CV perfecto desde el inicio. Empieza con lo que tienes y constrúyelo desde allí.
      </p>
    </Section>
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
    <Section id="faq" className="py-16 sm:py-20">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <Eyebrow>Preguntas frecuentes</Eyebrow>
        <h2 className="text-2xl sm:text-3xl font-bold mt-2" style={{ color: 'var(--ink)' }}>
          Todo lo que quieras saber antes de empezar
        </h2>
      </div>
      <div className="max-w-3xl mx-auto rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
        {FAQ_ITEMS.map((item, i) => {
          const isOpen = openIdx === i;
          return (
            <div key={item.q} style={{ borderBottom: i < FAQ_ITEMS.length - 1 ? '1px solid var(--line-soft)' : 'none' }}>
              <button
                onClick={() => setOpenIdx(isOpen ? null : i)}
                className="w-full flex items-center justify-between gap-4 text-left px-5 py-4.5 sm:px-6 sm:py-5"
              >
                <span className="font-medium text-sm sm:text-base" style={{ color: 'var(--ink)' }}>{item.q}</span>
                <Icon path={ICONS.chevronDown} className="w-4 h-4 flex-shrink-0 transition-transform" style={{ color: 'var(--mute)', transform: isOpen ? 'rotate(180deg)' : 'none' }} />
              </button>
              {isOpen && (
                <div className="px-5 sm:px-6 pb-5 -mt-1">
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--mute)' }}>{item.a}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Section>
  );
}

/* ── 12. Final CTA ── */

function FinalCTA() {
  return (
    <Section className="py-16 sm:py-20">
      <div className="rounded-3xl text-center px-6 py-16 sm:py-20" style={{ background: 'var(--blue)' }}>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-white max-w-2xl mx-auto mb-5">
          Tu próximo CV no tiene que empezar desde cero.
        </h2>
        <p className="max-w-xl mx-auto mb-8" style={{ color: 'rgba(255,255,255,.85)' }}>
          Crea un perfil profesional que evoluciona contigo, genera CVs adaptados a tus oportunidades y mantén
          organizada tu búsqueda de empleo desde un solo lugar.
        </p>
        <a href="/register" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold transition-transform hover:-translate-y-0.5" style={{ background: 'white', color: 'var(--blue)' }}>
          Crear mi CV gratis
        </a>
        <p className="mt-5 text-sm" style={{ color: 'rgba(255,255,255,.7)' }}>Tu información. Tu experiencia. Tu próximo paso.</p>
      </div>
    </Section>
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
  return (
    <footer className="mt-8" style={{ borderTop: '1px solid var(--line)', background: 'var(--surface)' }}>
      <Section className="py-14">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10 mb-12">
          <div className="lg:col-span-1">
            <img src="/momentum-logo.svg" alt="Momentum" style={{ height: 24, marginBottom: 14 }} />
            <p className="text-sm leading-relaxed max-w-xs" style={{ color: 'var(--mute)' }}>
              Momentum CV te ayuda a transformar tu experiencia real en CVs claros, profesionales y listos para nuevas oportunidades.
            </p>
          </div>
          <FooterCol title="Producto" links={producto} />
          <FooterCol title="Cuenta" links={empresa} />
        </div>
        <div className="pt-6 text-xs" style={{ borderTop: '1px solid var(--line-soft)', color: 'var(--mute)' }}>
          © {new Date().getFullYear()} Momentum CV. Todos los derechos reservados.
        </div>
      </Section>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: 'var(--ink)' }}>{title}</p>
      <ul className="space-y-2.5">
        {links.map(l => (
          <li key={l.label}>
            <a href={l.href} className="text-sm hover:opacity-70 transition-opacity" style={{ color: 'var(--mute)' }}>{l.label}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Entry point — session check first; landing only renders for signed-out
   visitors. Signed-in users keep the existing redirect behavior.
───────────────────────────────────────────────────────────────────────── */

export default function HomePage() {
  const router = useRouter();
  const supabase = createClient();
  const [isChecking, setIsChecking] = useState(true);
  const [showLanding, setShowLanding] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkUserAndRedirect() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          if (isMounted) {
            setShowLanding(true);
            setIsChecking(false);
          }
          return;
        }

        const [
          { data: profile },
          { data: experiencias },
          { data: educaciones },
          { data: habilidades },
          { data: logros },
          { data: idiomas },
        ] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', user.id).single(),
          supabase.from('experiencia').select('*').eq('user_id', user.id),
          supabase.from('educacion').select('*').eq('user_id', user.id),
          supabase.from('habilidades').select('*').eq('user_id', user.id),
          supabase.from('logros').select('*').eq('user_id', user.id),
          supabase.from('idiomas').select('*').eq('user_id', user.id),
        ]);

        if (isMounted) {
          let hasProgress = profile?.onboarding_completado ?? false;

          if (!hasProgress && profile) {
            const puntaje = calcularPuntajeCompletitud(
              profile,
              experiencias ?? [],
              educaciones ?? [],
              habilidades ?? [],
              logros ?? [],
              idiomas ?? []
            );
            hasProgress = puntaje >= 30;
          }

          if (hasProgress) {
            if (!profile?.onboarding_completado) {
              supabase.from('profiles').update({ onboarding_completado: true }).eq('id', user.id).then(() => {});
            }
            router.replace('/profile');
          } else {
            router.replace('/onboarding');
          }
          setIsChecking(false);
        }
      } catch (error) {
        console.error('Error checking user:', error);
        if (isMounted) {
          setShowLanding(true);
          setIsChecking(false);
        }
      }
    }

    checkUserAndRedirect();

    return () => {
      isMounted = false;
    };
  }, [router, supabase]);

  if (showLanding) {
    return <Landing />;
  }

  if (!isChecking) {
    return null;
  }

  return (
    <div className="flex items-center justify-center h-screen bg-white">
      <div className="text-center">
        <div className="text-4xl font-bold text-blue-600 mb-4">Momentum</div>
        <p className="text-gray-500">Cargando...</p>
      </div>
    </div>
  );
}
