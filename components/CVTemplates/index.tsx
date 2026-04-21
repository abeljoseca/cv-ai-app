import ClassicCV from './ClassicCV';
import ModernCV from './ModernCV';

interface CVData {
  nombre: string;
  titulo?: string;
  resumen?: string;
  contacto?: {
    email: string;
    telefono?: string;
    ubicacion?: string;
  };
  experiencias?: Array<{
    empresa: string;
    cargo: string;
    fecha_inicio: string;
    fecha_fin?: string;
    descripcion?: string;
  }>;
  educacion?: Array<{
    institucion: string;
    titulo: string;
    area?: string;
    fecha: string;
  }>;
  habilidades?: string[];
  idiomas?: Array<{
    nombre: string;
    nivel?: string;
  }>;
  logros?: string[];
}

interface CVRendererProps {
  estilo: 'classic' | 'modern' | 'minimal' | 'bold' | 'executive';
  data: CVData;
}

export default function CVRenderer({ estilo, data }: CVRendererProps) {
  switch (estilo) {
    case 'modern':
      return <ModernCV data={data} />;
    case 'classic':
    default:
      return <ClassicCV data={data} />;
    // TODO: Implementar minimal, bold, executive
  }
}
