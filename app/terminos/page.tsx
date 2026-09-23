import LegalLayout, { Section, PlaceholderSection } from '@/components/LegalLayout';

export default function TerminosPage() {
  return (
    <LegalLayout title="Términos y Condiciones" lastUpdated="22 de septiembre de 2026">
      <Section heading="1. Aceptación de los términos">
        <p>
          Al crear una cuenta o usar Momentum CV ("Momentum", "el servicio"), aceptas estos Términos y
          Condiciones y nuestra <a href="/privacidad" className="underline">Política de Privacidad</a>.
          Si no estás de acuerdo, no uses el servicio.
        </p>
      </Section>

      <Section heading="2. Descripción del servicio">
        <p>
          Momentum es una plataforma que usa inteligencia artificial para ayudarte a crear currículums
          (CVs) profesionales a partir de tu experiencia real. Ofrecemos tres formas de generar un CV: un
          CV general, un CV adaptado a una vacante específica, y CV Studio (un editor visual con
          plantillas). También ofrecemos seguimiento de aplicaciones a vacantes.
        </p>
        <p>
          Momentum no garantiza que el uso del servicio resulte en una entrevista, oferta de trabajo o
          cualquier otro resultado laboral.
        </p>
      </Section>

      <Section heading="3. Tu cuenta">
        <ul className="list-disc pl-5 space-y-1">
          <li>Eres responsable de mantener la confidencialidad de tu contraseña y de toda actividad en tu cuenta.</li>
          <li>Debes darnos información verdadera al registrarte.</li>
          <li>Podemos suspender o cerrar cuentas que violen estos términos, incluyendo uso fraudulento, abuso del sistema de códigos de descuento, o intentos de evadir los límites del plan gratuito.</li>
        </ul>
      </Section>

      <Section heading="4. El principio de no invención (integridad de la información)">
        <p>
          Momentum usa IA para redactar, organizar y presentar mejor tu experiencia — nunca para inventar
          cargos, empresas, estudios, certificaciones, habilidades o resultados que no hayas proporcionado.
          Eres responsable de que la información que ingreses sea veraz. Momentum no se hace responsable
          por consecuencias derivadas de información falsa que el usuario haya introducido
          deliberadamente. Ver más detalle en nuestra <a href="/uso-de-ia" className="underline">Política de Uso de IA</a>.
        </p>
      </Section>

      <Section heading="5. Planes y pagos">
        <p><strong>Plan Inicio:</strong> crear un CV es gratuito. Descargarlo tiene un costo fijo por CV
          (mostrado en la app antes de pagar), procesado en criptomonedas (USDT) a través de NOWPayments.
          Mientras tengas un CV sin pagar, no podrás generar uno nuevo — debes descargar (pagar) el
          anterior o eliminarlo primero.
        </p>
        <p><strong>Plan Pro:</strong> suscripción mensual o anual que elimina ese límite y agrega
          beneficios adicionales (ver la página de planes), procesada a través de PayPal Subscriptions.
          Puedes cancelar tu suscripción en cualquier momento desde tu cuenta; la cancelación aplica de
          inmediato y no se prorratea el tiempo restante ya pagado.
        </p>
        <p>
          Los precios pueden cambiar; te avisaremos con anticipación razonable si afecta una suscripción activa.
          Los pagos en criptomonedas son, por su naturaleza, irreversibles una vez confirmados en la
          blockchain — verifica siempre la red y el monto antes de enviar un pago.
        </p>
      </Section>

      <Section heading="6. Códigos de descuento y programa de embajadores">
        <p>
          Algunos usuarios participan como embajadores de Momentum, recibiendo comisiones por referidos
          que se convierten en usuarios de pago. Si eres embajador, aplican además los términos
          específicos del programa que aceptas al unirte a él.
        </p>
      </Section>

      <Section heading="7. Propiedad intelectual">
        <p>
          El contenido de tu perfil y los CVs que generas son tuyos. Momentum retiene todos los derechos
          sobre el software, las plantillas de diseño, la marca y la tecnología de la plataforma. No
          puedes copiar, revender ni distribuir el software de Momentum sin autorización.
        </p>
      </Section>

      <Section heading="8. Limitación de responsabilidad">
        <p>
          Momentum se ofrece "tal cual". En la máxima medida permitida por la ley, no somos responsables
          por daños indirectos, pérdida de oportunidades laborales, o decisiones que tomes basándote en
          el contenido generado por la IA. Eres responsable de revisar cualquier CV antes de enviarlo a un
          empleador.
        </p>
      </Section>

      <Section heading="9. Terminación">
        <p>
          Puedes eliminar tu cuenta en cualquier momento. Podemos suspender o terminar tu acceso si
          violas estos términos, sin perjuicio de los pagos ya realizados por servicios ya prestados.
        </p>
      </Section>

      <Section heading="10. Cambios a estos términos">
        <p>
          Podemos actualizar estos términos ocasionalmente. Si el cambio es significativo, te lo
          notificaremos antes de que entre en vigor. El uso continuado del servicio después de un cambio
          implica tu aceptación de los nuevos términos.
        </p>
      </Section>

      <PlaceholderSection heading="11. Ley aplicable, jurisdicción y datos legales de la empresa" />
    </LegalLayout>
  );
}
