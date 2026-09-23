import LegalLayout, { Section, PlaceholderSection } from '@/components/LegalLayout';

export default function PrivacidadPage() {
  return (
    <LegalLayout title="Política de Privacidad" lastUpdated="22 de septiembre de 2026">
      <Section heading="1. Introducción">
        <p>
          Esta Política de Privacidad explica qué información recopila Momentum CV ("Momentum", "nosotros")
          cuando usas nuestra plataforma para crear currículums (CVs) profesionales, cómo la usamos, con
          quién la compartimos y qué control tienes sobre ella.
        </p>
        <p>
          Al crear una cuenta o usar Momentum, aceptas las prácticas descritas aquí. Si no estás de acuerdo,
          por favor no uses el servicio.
        </p>
      </Section>

      <Section heading="2. Qué información recopilamos">
        <p><strong>Información que nos das directamente:</strong></p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Datos de cuenta: nombre, apellido, correo electrónico, contraseña (si usas email/contraseña; si inicias sesión con Google o LinkedIn, ellos nos comparten tu nombre, correo y foto según su propia política).</li>
          <li>Datos de perfil profesional: experiencia laboral, educación, habilidades, idiomas, logros, certificaciones, proyectos, foto de perfil, teléfono, ciudad y país — la información que uses para construir tu perfil.</li>
          <li>Contenido que nos compartes para generar tu perfil: mensajes que escribes en el chat, documentos que subes (CVs anteriores, exportaciones de LinkedIn en PDF), o la URL de tu perfil de LinkedIn si eliges importarlo.</li>
          <li>Descripciones de vacantes que pegas para generar un CV adaptado a una oferta específica.</li>
          <li>Información de pago: si pagas por una descarga o por el Plan Pro, procesamos el pago a través de NOWPayments (criptomonedas) o PayPal (suscripciones) — nosotros no almacenamos números de tarjeta ni claves privadas de billeteras; esos proveedores manejan esa información directamente.</li>
          <li>Si participas en el programa de embajadores: tu dirección de wallet de criptomonedas para recibir pagos de comisiones.</li>
        </ul>
        <p><strong>Información que se genera automáticamente:</strong></p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Los CVs que la IA genera a partir de tu perfil, y su historial de versiones.</li>
          <li>Metadatos técnicos básicos necesarios para operar el servicio (por ejemplo, direcciones IP para limitar solicitudes abusivas — ver sección 9).</li>
        </ul>
      </Section>

      <Section heading="3. Cómo usamos tu información">
        <ul className="list-disc pl-5 space-y-1">
          <li>Para generar tus CVs: tu información de perfil se envía a nuestro proveedor de inteligencia artificial (Anthropic) exclusivamente para redactar y estructurar el contenido de tus CVs. La IA está instruida para no inventar experiencia, logros ni habilidades que no hayas proporcionado — ver nuestra <a href="/uso-de-ia" className="underline">Política de Uso de IA</a>.</li>
          <li>Para operar tu cuenta: autenticación, guardar tu progreso, mostrarte tus CVs y aplicaciones.</li>
          <li>Para procesar pagos y prevenir abuso del modelo de precios (por ejemplo, evitar que se generen CVs ilimitados sin pagar).</li>
          <li>Para el programa de embajadores: registrar referidos, calcular comisiones y procesar solicitudes de retiro.</li>
          <li>Para comunicarnos contigo sobre tu cuenta (confirmaciones, restablecimiento de contraseña, cambios en el servicio).</li>
          <li>Para mejorar el producto y prevenir fraude o uso indebido.</li>
        </ul>
        <p>
          No vendemos tu información personal a terceros, y no la usamos para publicidad dirigida.
        </p>
      </Section>

      <Section heading="4. Con quién compartimos información (proveedores de servicio)">
        <p>Usamos los siguientes proveedores para operar Momentum. Cada uno procesa únicamente la información necesaria para su función:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Anthropic</strong> (API de Claude) — genera el contenido de tus CVs, procesa el chat de perfil, y estructura documentos que subes.</li>
          <li><strong>Supabase</strong> — aloja nuestra base de datos, autenticación y almacenamiento de archivos (por ejemplo, tu foto de perfil).</li>
          <li><strong>NOWPayments</strong> — procesa pagos en criptomonedas para el Plan Inicio.</li>
          <li><strong>PayPal</strong> — procesa suscripciones del Plan Pro.</li>
          <li><strong>Apify</strong> — si eliges importar tu perfil de LinkedIn, este proveedor obtiene la información pública de la URL que nos das.</li>
          <li><strong>Cloudflare (Turnstile)</strong> — verifica que quien inicia sesión o se registra es una persona real, no un bot.</li>
          <li><strong>Upstash</strong> — limita la cantidad de solicitudes por usuario para evitar abuso; solo procesa identificadores técnicos (tu id de usuario o IP), no contenido de tu perfil.</li>
          <li><strong>Vercel</strong> — aloja la aplicación web.</li>
          <li><strong>Google / LinkedIn</strong> — si eliges iniciar sesión con estos proveedores, ellos verifican tu identidad y nos comparten los datos básicos de tu cuenta (nombre, correo, foto) que autorizas al conectar.</li>
        </ul>
        <p>
          También podemos compartir información si la ley lo exige, o para proteger los derechos, la
          seguridad o la propiedad de Momentum o de terceros.
        </p>
      </Section>

      <Section heading="5. Seguridad de la información">
        <p>
          Aplicamos controles de acceso a nivel de base de datos (Row Level Security) para que cada
          usuario solo pueda ver y modificar su propia información, cifrado en tránsito (HTTPS) para
          todas las comunicaciones, y verificación humana (captcha) en los formularios de acceso para
          reducir intentos automatizados de acceso indebido. Ningún sistema es 100% seguro, pero
          trabajamos activamente para proteger tu información.
        </p>
      </Section>

      <Section heading="6. Conservación y eliminación de datos">
        <p>
          Conservamos tu información mientras tu cuenta esté activa. Puedes solicitar la eliminación de
          tu cuenta y de tu información personal en cualquier momento escribiendo a
          <a href="mailto:contact@momentumcv.com" className="underline">contact@momentumcv.com</a>.
          Algunos registros (por ejemplo, historial de pagos) pueden conservarse por el tiempo que exija
          la ley aplicable, incluso después de eliminar tu cuenta.
        </p>
      </Section>

      <Section heading="7. Tus derechos sobre tu información">
        <p>Dependiendo de tu ubicación, puedes tener derecho a:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Acceder a la información que tenemos sobre ti.</li>
          <li>Corregir información incorrecta (puedes editar la mayoría de tu perfil directamente en la app).</li>
          <li>Solicitar la eliminación de tu cuenta e información.</li>
          <li>Solicitar una copia de tu información en un formato portátil.</li>
        </ul>
        <p>Para ejercer cualquiera de estos derechos, escríbenos a <a href="mailto:contact@momentumcv.com" className="underline">contact@momentumcv.com</a>.</p>
      </Section>

      <Section heading="8. Cookies y tecnologías similares">
        <p>Usamos un número reducido de cookies, todas necesarias para el funcionamiento del servicio:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Cookies de sesión de autenticación (Supabase) — te mantienen conectado a tu cuenta.</li>
          <li><code>momentum_ref</code> — recuerda por 30 días si llegaste a través del enlace de un embajador, para asignar correctamente la comisión de referido si te suscribes.</li>
        </ul>
        <p>No usamos cookies de publicidad ni de rastreo entre sitios. Ver más detalle en nuestra <a href="/cookies" className="underline">Política de Cookies</a>.</p>
      </Section>

      <Section heading="9. Prevención de abuso y límites de uso">
        <p>
          Para proteger el servicio de uso automatizado o abusivo, registramos temporalmente cuántas
          solicitudes hace cada cuenta o dirección IP en ventanas cortas de tiempo (por ejemplo, cuántos
          CVs se generan por minuto). Esta información técnica se usa únicamente para aplicar límites
          razonables y se descarta automáticamente después de la ventana de tiempo correspondiente.
        </p>
      </Section>

      <Section heading="10. Menores de edad">
        <p>
          Momentum no está dirigido a menores de 18 años y no está diseñado para su uso por parte de
          ellos. No recopilamos intencionalmente información de menores de 18 años; si tienes motivos
          para creer que un menor nos ha proporcionado información personal, contáctanos a
          <a href="mailto:contact@momentumcv.com" className="underline"> contact@momentumcv.com</a> para
          que la eliminemos.
        </p>
      </Section>

      <Section heading="11. Cambios a esta política">
        <p>
          Podemos actualizar esta política ocasionalmente. Si hacemos cambios significativos, te lo
          notificaremos por correo o mediante un aviso visible en la plataforma antes de que entren en vigor.
        </p>
      </Section>

      <Section heading="12. Contacto">
        <p>
          Para cualquier pregunta sobre esta política o sobre tu información, escríbenos a
          <a href="mailto:contact@momentumcv.com" className="underline"> contact@momentumcv.com</a>.
        </p>
      </Section>

      <PlaceholderSection heading="13. Datos legales de la empresa (razón social, dirección, jurisdicción)" />
    </LegalLayout>
  );
}
