import LegalLayout, { Section, PlaceholderSection } from '@/components/LegalLayout';

export default function CookiesPage() {
  return (
    <LegalLayout title="Política de Cookies" lastUpdated="22 de septiembre de 2026">
      <Section heading="1. Qué son las cookies">
        <p>
          Las cookies son pequeños archivos que un sitio web guarda en tu navegador para recordar
          información entre visitas o entre páginas de una misma visita.
        </p>
      </Section>

      <Section heading="2. Cookies que utilizamos">
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Cookies de sesión de autenticación</strong> (gestionadas por Supabase) — te mantienen
            conectado a tu cuenta mientras navegas Momentum. Son estrictamente necesarias: sin ellas no
            podrías iniciar sesión.
          </li>
          <li>
            <strong><code>momentum_ref</code></strong> — si llegas a Momentum a través del enlace de un
            embajador, esta cookie recuerda esa referencia por 30 días, para poder asignar correctamente
            la comisión si más adelante te suscribes al Plan Pro. No se usa para rastrearte en otros
            sitios.
          </li>
        </ul>
        <p>No usamos cookies de publicidad, de rastreo entre sitios, ni vendemos datos de navegación a terceros.</p>
      </Section>

      <Section heading="3. Cookies de terceros">
        <p>
          Cloudflare Turnstile (nuestro verificador anti-bots en los formularios de acceso) y, si inicias
          sesión con Google o LinkedIn, esos proveedores pueden establecer sus propias cookies conforme a
          sus propias políticas durante el proceso de autenticación. Momentum no controla esas cookies.
        </p>
      </Section>

      <Section heading="4. Cómo controlar o eliminar cookies">
        <p>
          Puedes borrar o bloquear cookies desde la configuración de tu navegador. Ten en cuenta que
          bloquear las cookies de sesión te impedirá iniciar sesión en Momentum.
        </p>
      </Section>

      <Section heading="5. Cambios a esta política">
        <p>
          Podemos actualizar esta política si cambiamos las cookies que usamos. Los cambios significativos
          se reflejarán en la fecha de "Última actualización" al inicio de esta página.
        </p>
      </Section>

      <PlaceholderSection heading="6. Contacto" />
    </LegalLayout>
  );
}
