import LegalLayout, { PlaceholderSection } from '@/components/LegalLayout';

const SECCIONES = [
  'Cómo usa Momentum la inteligencia artificial',
  'Qué información procesa la IA y con qué proveedor (Anthropic Claude)',
  'Principio de no invención: la IA no crea experiencia, logros ni habilidades que no existan en tu perfil',
  'Limitaciones de la IA y responsabilidad del usuario sobre la exactitud de su información',
  'Uso responsable recomendado al usuario',
  'Cambios a esta política',
  'Contacto',
];

export default function UsoDeIAPage() {
  return (
    <LegalLayout title="Uso Responsable de Inteligencia Artificial">
      {SECCIONES.map((s, i) => (
        <PlaceholderSection key={s} heading={`${i + 1}. ${s}`} />
      ))}
    </LegalLayout>
  );
}
