import LegalLayout, { PlaceholderSection } from '@/components/LegalLayout';

const SECCIONES = [
  'Qué son las cookies',
  'Cookies que utilizamos (sesión, atribución de embajadores, preferencias)',
  'Cookies de terceros',
  'Cómo controlar o eliminar cookies',
  'Cambios a esta política',
  'Contacto',
];

export default function CookiesPage() {
  return (
    <LegalLayout title="Política de Cookies">
      {SECCIONES.map((s, i) => (
        <PlaceholderSection key={s} heading={`${i + 1}. ${s}`} />
      ))}
    </LegalLayout>
  );
}
