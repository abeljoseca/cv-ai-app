import LegalLayout, { PlaceholderSection } from '@/components/LegalLayout';

const SECCIONES = [
  'Introducción',
  'Qué información recopilamos',
  'Cómo usamos tu información',
  'Información compartida con terceros (Anthropic, Supabase, NOWPayments, Apify)',
  'Datos de perfil profesional y CVs generados',
  'Seguridad de la información',
  'Conservación y eliminación de datos',
  'Tus derechos sobre tus datos',
  'Cookies y tecnologías similares',
  'Menores de edad',
  'Cambios a esta política',
  'Contacto',
];

export default function PrivacidadPage() {
  return (
    <LegalLayout title="Política de Privacidad">
      {SECCIONES.map((s, i) => (
        <PlaceholderSection key={s} heading={`${i + 1}. ${s}`} />
      ))}
    </LegalLayout>
  );
}
