import LegalLayout, { PlaceholderSection } from '@/components/LegalLayout';

const SECCIONES = [
  'Introducción y aceptación de los términos',
  'Descripción del servicio',
  'Cuentas de usuario',
  'Uso aceptable de la plataforma',
  'Contenido generado por el usuario y por IA',
  'Planes, pagos y reembolsos',
  'Programa de embajadores',
  'Propiedad intelectual',
  'Limitación de responsabilidad',
  'Terminación de la cuenta',
  'Modificaciones a estos términos',
  'Ley aplicable y jurisdicción',
  'Contacto',
];

export default function TerminosPage() {
  return (
    <LegalLayout title="Términos y Condiciones">
      {SECCIONES.map((s, i) => (
        <PlaceholderSection key={s} heading={`${i + 1}. ${s}`} />
      ))}
    </LegalLayout>
  );
}
