import LegalLayout, { Section } from '@/components/LegalLayout';

export default function UsoDeIAPage() {
  return (
    <LegalLayout title="Uso Responsable de Inteligencia Artificial" lastUpdated="22 de septiembre de 2026">
      <Section heading="1. Cómo usa Momentum la inteligencia artificial">
        <p>
          Momentum usa un modelo de lenguaje de IA para ayudarte a construir tu perfil profesional
          (mediante una conversación tipo chat), redactar y estructurar el contenido de tus CVs, adaptar
          un CV a una vacante específica, y organizar información que subas (por ejemplo, un CV anterior
          en PDF o una exportación de LinkedIn).
        </p>
      </Section>

      <Section heading="2. Qué información procesa la IA y con qué proveedor">
        <p>
          Usamos la API de <strong>Claude, de Anthropic</strong>, como proveedor de inteligencia
          artificial. Le enviamos únicamente la información necesaria para la tarea en curso: los datos
          de tu perfil (experiencia, educación, habilidades, etc.), el texto que escribes en el chat, el
          contenido de documentos que subes, y la descripción de la vacante cuando generas un CV adaptado
          a una oferta. Anthropic procesa esta información como proveedor de servicio, conforme a su
          propia política de tratamiento de datos para clientes de API.
        </p>
      </Section>

      <Section heading="3. Principio de no invención">
        <p>
          Este es el principio central del diseño de Momentum: la IA está instruida explícitamente para
          <strong> no inventar</strong> cargos, empresas, fechas, estudios, certificaciones, habilidades,
          logros ni cifras que no hayas proporcionado tú mismo. Su función es redactar mejor, organizar y
          dar formato profesional a tu experiencia real — no crear una experiencia que no tienes.
        </p>
      </Section>

      <Section heading="4. Limitaciones de la IA y tu responsabilidad">
        <p>
          Como cualquier sistema de IA, puede cometer errores de redacción, interpretar mal una
          instrucción ambigua, o requerir que corrijas un detalle. Por eso, antes de enviar un CV a un
          empleador, <strong>siempre debes revisarlo tú mismo</strong> y confirmar que cada dato es
          exacto. Eres el responsable final del contenido de los documentos que envías, no Momentum ni su
          proveedor de IA.
        </p>
      </Section>

      <Section heading="5. Uso responsable recomendado">
        <ul className="list-disc pl-5 space-y-1">
          <li>No pidas a la IA que agregue experiencia, títulos o habilidades que no tienes.</li>
          <li>Revisa siempre el CV generado antes de descargarlo o enviarlo.</li>
          <li>Si detectas un error o una alucinación del modelo, corrígelo directamente en el chat o el editor antes de continuar.</li>
        </ul>
      </Section>

      <Section heading="6. Cambios a esta política">
        <p>
          Podemos actualizar esta política si cambiamos de proveedor de IA o la forma en que la usamos.
          Los cambios significativos se reflejarán en la fecha de "Última actualización" al inicio de esta
          página.
        </p>
      </Section>

      <Section heading="7. Contacto">
        <p>
          Si tienes preguntas sobre cómo usamos la IA, escríbenos a
          <a href="mailto:contact@momentumcv.com" className="underline"> contact@momentumcv.com</a>.
        </p>
      </Section>
    </LegalLayout>
  );
}
