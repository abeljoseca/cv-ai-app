export default function UpgradePage() {
  return (
    <div style={{ fontFamily: "'Inter', sans-serif", maxWidth: '720px' }}>

      {/* Badge */}
      <div style={{ marginBottom: '24px' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#EEF2FF', color: '#4B6BFB', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '3px 9px', borderRadius: '20px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4B6BFB' }} />
          Desbloquea todo tu potencial profesional
        </span>
      </div>

      <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1A2B4C', margin: '0 0 6px', letterSpacing: '-0.4px' }}>
        Lleva tu búsqueda de empleo al siguiente nivel
      </h1>
      <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 32px', lineHeight: 1.6 }}>
        Elige el plan que mejor se adapte a tu ritmo y alcanza tus metas profesionales.
      </p>

      {/* Nota de desarrollo */}
      <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', padding: '12px 16px', marginBottom: '28px', fontSize: '12px', color: '#92400E', lineHeight: 1.6 }}>
        <strong>Nota:</strong> Esta sección está disponible de forma informativa. Los botones se activarán próximamente una vez validado el producto.
      </div>

      {/* Cards de planes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

        {/* Plan Básico */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '28px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1A2B4C', margin: '0 0 4px', textAlign: 'center' }}>Plan Básico</h2>
            <p style={{ fontSize: '14px', color: '#64748B', margin: 0, textAlign: 'center', fontWeight: 500 }}>Gratis</p>
          </div>
          <p style={{ fontSize: '13px', color: '#64748B', textAlign: 'center', margin: '0 0 20px', lineHeight: 1.5 }}>
            Para quienes están comenzando su búsqueda.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
            {[
              'Genera hasta 2 CVs por mes.',
              'Seguimiento de vacantes limitado.',
              'Actualización de perfil con IA limitada.',
              'Descargas limitadas.',
              'No incluye: Enlace web de CV, edición manual de contenido, ni envío por email.',
            ].map((item, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: '#64748B' }}>
                <span style={{ color: '#CBD5E1', flexShrink: 0, marginTop: '1px' }}>•</span>
                {item}
              </li>
            ))}
          </ul>
          <button
            disabled
            style={{ width: '100%', background: '#E2E8F0', color: '#94A3B8', border: 'none', borderRadius: '10px', padding: '13px', fontSize: '14px', fontWeight: 600, cursor: 'not-allowed', fontFamily: 'inherit' }}
          >
            Elegir
          </button>
        </div>

        {/* Plan Premium */}
        <div style={{ background: '#FFFFFF', border: '2px solid #4B6BFB', borderRadius: '16px', padding: '28px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: '#4B6BFB', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '3px 12px', borderRadius: '20px', letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            Recomendado
          </div>
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1A2B4C', margin: '0 0 4px', textAlign: 'center' }}>Plan Premium</h2>
            <p style={{ fontSize: '14px', color: '#64748B', margin: 0, textAlign: 'center', fontWeight: 500 }}>Precio por definir</p>
          </div>
          <p style={{ fontSize: '13px', color: '#64748B', textAlign: 'center', margin: '0 0 20px', lineHeight: 1.5 }}>
            Herramientas exclusivas para conseguir tu trabajo ideal más rápido.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
            {[
              'Genera hasta 20 CVs por mes.',
              'Seguimiento de vacantes ilimitado.',
              'Actualización de perfil con IA sin restricciones.',
              'Generación de enlace web para tu CV.',
              'Edición total del contenido de tu currículum.',
              'Envío directo de tu CV por email.',
              'Descargas ilimitadas en alta calidad.',
            ].map((item, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: '#64748B' }}>
                <span style={{ color: '#4B6BFB', flexShrink: 0, marginTop: '1px' }}>•</span>
                {item}
              </li>
            ))}
          </ul>
          <button
            disabled
            style={{ width: '100%', background: '#E2E8F0', color: '#94A3B8', border: 'none', borderRadius: '10px', padding: '13px', fontSize: '14px', fontWeight: 600, cursor: 'not-allowed', fontFamily: 'inherit' }}
          >
            Elegir Premium
          </button>
        </div>
      </div>
    </div>
  )
}