export interface IconDef {
  id: string
  name: string
  category: string
  paths: string[]
}

export const ICON_CATEGORIES = ['Contacto', 'Personas', 'Trabajo', 'Educación', 'Tech', 'Social', 'Misc']

export const ICONS: IconDef[] = [
  // ── Contacto ──────────────────────────────────────────────────────────────────
  { id: 'mail',       name: 'Email',         category: 'Contacto', paths: ['M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z', 'M22 6l-10 7L2 6'] },
  { id: 'phone',      name: 'Teléfono',      category: 'Contacto', paths: ['M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z'] },
  { id: 'phone-call', name: 'Llamada',        category: 'Contacto', paths: ['M15.05 5A5 5 0 0 1 19 8.95M15.05 1A9 9 0 0 1 23 8.94M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z'] },
  { id: 'map-pin',    name: 'Ubicación',      category: 'Contacto', paths: ['M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z', 'M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'] },
  { id: 'globe',      name: 'Web',            category: 'Contacto', paths: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'M2 12h20', 'M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z'] },
  { id: 'link',       name: 'Enlace',         category: 'Contacto', paths: ['M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71', 'M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71'] },
  { id: 'at-sign',    name: 'Arroba',         category: 'Contacto', paths: ['M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z', 'M12 8v.01M16 12c0 2.76-1.34 4-4 4s-4-2.24-4-4 1.79-4 4-4 4 1.34 4 4m0 0v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-9 9 9 9 0 0 0 5.39-1.69'] },
  { id: 'send',       name: 'Enviar',         category: 'Contacto', paths: ['M22 2L11 13', 'M22 2L15 22l-4-9-9-4z'] },

  // ── Personas ─────────────────────────────────────────────────────────────────
  { id: 'user',       name: 'Persona',        category: 'Personas', paths: ['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2', 'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'] },
  { id: 'users',      name: 'Personas',       category: 'Personas', paths: ['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2', 'M23 21v-2a4 4 0 0 1-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75', 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'] },
  { id: 'user-check', name: 'Verificado',     category: 'Personas', paths: ['M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2', 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M17 11l2 2 4-4'] },
  { id: 'smile',      name: 'Actitud',        category: 'Personas', paths: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'M8 14s1.5 2 4 2 4-2 4-2', 'M9 9h.01M15 9h.01'] },
  { id: 'baby',       name: 'Familia',        category: 'Personas', paths: ['M9 12h.01M15 12h.01M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5', 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'M9 9c-.2-1-.5-2-1-3 1 .5 3 1 4 1h2c1 0 3-.5 4-1-.5 1-.8 2-1 3'] },

  // ── Trabajo ──────────────────────────────────────────────────────────────────
  { id: 'briefcase',  name: 'Trabajo',        category: 'Trabajo',  paths: ['M20 7H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z', 'M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2'] },
  { id: 'building',   name: 'Empresa',        category: 'Trabajo',  paths: ['M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M9 22V12h6v10'] },
  { id: 'building-2', name: 'Oficina',        category: 'Trabajo',  paths: ['M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18z', 'M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2', 'M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2', 'M10 6h4M10 10h4M10 14h4M10 18h4'] },
  { id: 'award',      name: 'Premio',         category: 'Trabajo',  paths: ['M12 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14z', 'M8.21 13.89L7 23l5-3 5 3-1.21-9.12'] },
  { id: 'target',     name: 'Objetivo',       category: 'Trabajo',  paths: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z', 'M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z'] },
  { id: 'trending-up',name: 'Crecimiento',    category: 'Trabajo',  paths: ['M23 6l-9.5 9.5-5-5L1 18', 'M17 6h6v6'] },
  { id: 'clock',      name: 'Tiempo',         category: 'Trabajo',  paths: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'M12 6v6l4 2'] },
  { id: 'calendar',   name: 'Fecha',          category: 'Trabajo',  paths: ['M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z', 'M16 2v4M8 2v4M3 10h18'] },
  { id: 'bar-chart',  name: 'Estadísticas',   category: 'Trabajo',  paths: ['M18 20V10M12 20V4M6 20v-6'] },
  { id: 'pie-chart',  name: 'Gráfico',        category: 'Trabajo',  paths: ['M21.21 15.89A10 10 0 1 1 8 2.83', 'M22 12A10 10 0 0 0 12 2v10z'] },
  { id: 'dollar-sign',name: 'Finanzas',       category: 'Trabajo',  paths: ['M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'] },
  { id: 'handshake',  name: 'Colaboración',   category: 'Trabajo',  paths: ['M4.5 12H2', 'M22 12h-2.5', 'M7 12a5 5 0 0 1 5-5 5 5 0 0 1 5 5', 'M7 12c0 2 .9 3.9 2.5 5.2L12 19l2.5-1.8A6.6 6.6 0 0 0 17 12', 'M9.5 9.5L12 7l2.5 2.5'] },

  // ── Educación ────────────────────────────────────────────────────────────────
  { id: 'graduation', name: 'Graduación',     category: 'Educación',paths: ['M22 10v6M2 10l10-5 10 5-10 5z', 'M6 12v5c3 3 9 3 12 0v-5'] },
  { id: 'book',       name: 'Libro',          category: 'Educación',paths: ['M4 19.5A2.5 2.5 0 0 1 6.5 17H20', 'M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z'] },
  { id: 'book-open',  name: 'Lectura',        category: 'Educación',paths: ['M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z', 'M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z'] },
  { id: 'pen',        name: 'Escritura',      category: 'Educación',paths: ['M12 20h9', 'M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z'] },
  { id: 'lightbulb',  name: 'Innovación',     category: 'Educación',paths: ['M9 18h6M10 22h4M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.26C5.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z'] },
  { id: 'certificate',name: 'Certificado',    category: 'Educación',paths: ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', 'M14 2v6h6', 'M9 15l2 2 4-4'] },
  { id: 'medal',      name: 'Medalla',        category: 'Educación',paths: ['M12 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14z', 'M12 15v7', 'M9 18h6'] },
  { id: 'pencil-ruler',name: 'Diseño',        category: 'Educación',paths: ['M2 2l5 5M7 2l-5 5M12 2v4M10 4h4', 'M3 21l7-7 1 1-7 7z', 'M22 13l-9 9-1-1 9-9z', 'M15 6l3 3-5 5-3-3z'] },

  // ── Tech ─────────────────────────────────────────────────────────────────────
  { id: 'code',       name: 'Código',         category: 'Tech',     paths: ['M16 18l6-6-6-6', 'M8 6l-6 6 6 6'] },
  { id: 'terminal',   name: 'Terminal',       category: 'Tech',     paths: ['M4 17l6-6-6-6', 'M12 19h8'] },
  { id: 'cpu',        name: 'Hardware',       category: 'Tech',     paths: ['M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 0-2-2V9m0 0h18'] },
  { id: 'database',   name: 'Base datos',     category: 'Tech',     paths: ['M12 8a9 3 0 1 0 0-6 9 3 0 0 0 0 6z', 'M21 12c0 1.66-4 3-9 3s-9-1.34-9-3', 'M3 6v6c0 1.66 4 3 9 3s9-1.34 9-3V6'] },
  { id: 'server',     name: 'Servidor',       category: 'Tech',     paths: ['M22 2H2a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h20a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zM22 14H2a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h20a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2z', 'M6 6h.01M6 18h.01'] },
  { id: 'wrench',     name: 'Herramientas',   category: 'Tech',     paths: ['M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z'] },
  { id: 'settings',   name: 'Configuración',  category: 'Tech',     paths: ['M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z'] },
  { id: 'cloud',      name: 'Cloud',          category: 'Tech',     paths: ['M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z'] },
  { id: 'wifi',       name: 'Red',            category: 'Tech',     paths: ['M1.42 9a16 16 0 0 1 21.16 0', 'M5 12.55a11 11 0 0 1 14.08 0', 'M10.54 16.1a6 6 0 0 1 2.92 0', 'M12 20h.01'] },
  { id: 'layers',     name: 'Capas',          category: 'Tech',     paths: ['M12 2l10 6.5-10 6.5L2 8.5z', 'M2 15.5l10 6.5 10-6.5', 'M2 12l10 6.5 10-6.5'] },
  { id: 'figma',      name: 'Diseño UI',      category: 'Tech',     paths: ['M5 5.5A3.5 3.5 0 0 1 8.5 2H12v7H8.5A3.5 3.5 0 0 1 5 5.5z', 'M12 2h3.5a3.5 3.5 0 1 1 0 7H12V2z', 'M12 12.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z', 'M5 19.5A3.5 3.5 0 0 1 8.5 16H12v3.5a3.5 3.5 0 0 1-7 0z', 'M5 12.5A3.5 3.5 0 0 1 8.5 9H12v7H8.5A3.5 3.5 0 0 1 5 12.5z'] },

  // ── Social ───────────────────────────────────────────────────────────────────
  { id: 'linkedin',   name: 'LinkedIn',       category: 'Social',   paths: ['M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z', 'M2 9h4v12H2z', 'M4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z'] },
  { id: 'github',     name: 'GitHub',         category: 'Social',   paths: ['M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22'] },
  { id: 'twitter',    name: 'Twitter',        category: 'Social',   paths: ['M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z'] },
  { id: 'instagram',  name: 'Instagram',      category: 'Social',   paths: ['M7.8 2h8.4A5.8 5.8 0 0 1 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8A5.8 5.8 0 0 1 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2z', 'M12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8z', 'M17.5 6.5h.01'] },
  { id: 'youtube',    name: 'YouTube',        category: 'Social',   paths: ['M22.54 6.42a2.78 2.78 0 0 0-1.95-1.95C18.88 4 12 4 12 4s-6.88 0-8.59.47A2.78 2.78 0 0 0 1.46 6.42C1 8.15 1 12 1 12s0 3.85.46 5.58a2.78 2.78 0 0 0 1.95 1.95C5.12 20 12 20 12 20s6.88 0 8.59-.47a2.78 2.78 0 0 0 1.95-1.95C23 15.85 23 12 23 12s0-3.85-.46-5.58z', 'M9.75 15.02l5.75-3.02-5.75-3.02v6.04z'] },
  { id: 'facebook',   name: 'Facebook',       category: 'Social',   paths: ['M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z'] },
  { id: 'dribbble',   name: 'Dribbble',       category: 'Social',   paths: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72M10.48 21.33c1.37-5.47 4.31-9.16 12.16-12.08M2.38 11.48c4.71-1.13 7.81-.67 12.43 1.23M2.22 16.52c4.37-1.63 6.84-2.02 11.38.92'] },
  { id: 'behance',    name: 'Behance',        category: 'Social',   paths: ['M1 12.5A4.5 4.5 0 0 1 5.5 8H12v9H5.5A4.5 4.5 0 0 1 1 12.5z', 'M12 9.5A4.5 4.5 0 0 1 16.5 5H22', 'M12 14.5A4.5 4.5 0 0 0 16.5 19H22'] },
  { id: 'medium',     name: 'Medium',         category: 'Social',   paths: ['M13 12a5 5 0 1 0 10 0 5 5 0 0 0-10 0z', 'M1 12h6', 'M3.5 6l-1 12M9.5 6l1 12'] },

  // ── Misc ─────────────────────────────────────────────────────────────────────
  { id: 'star',       name: 'Estrella',       category: 'Misc',     paths: ['M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'] },
  { id: 'heart',      name: 'Intereses',      category: 'Misc',     paths: ['M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z'] },
  { id: 'check-circle',name:'Logro',          category: 'Misc',     paths: ['M22 11.08V12a10 10 0 1 1-5.93-9.14', 'M22 4L12 14.01l-3-3'] },
  { id: 'flag',       name: 'País',           category: 'Misc',     paths: ['M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z', 'M4 22v-7'] },
  { id: 'zap',        name: 'Habilidad',      category: 'Misc',     paths: ['M13 2L3 14h9l-1 8 10-12h-9l1-8z'] },
  { id: 'shield',     name: 'Seguridad',      category: 'Misc',     paths: ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'] },
  { id: 'eye',        name: 'Portafolio',     category: 'Misc',     paths: ['M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z', 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'] },
  { id: 'camera',     name: 'Fotografía',     category: 'Misc',     paths: ['M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z', 'M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'] },
  { id: 'mic',        name: 'Oratoria',       category: 'Misc',     paths: ['M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z', 'M19 10v2a7 7 0 0 1-14 0v-2', 'M12 19v4M8 23h8'] },
  { id: 'music',      name: 'Música',         category: 'Misc',     paths: ['M9 18V5l12-2v13', 'M9 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M21 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'] },
  { id: 'languages',  name: 'Idiomas',        category: 'Misc',     paths: ['M5 8l6 6', 'M4 14l6-6 2-3', 'M2 5h12', 'M7 2h1', 'M22 22l-5-10-5 10', 'M14 18h6'] },
  { id: 'car',        name: 'Licencia',       category: 'Misc',     paths: ['M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2h-3', 'M9 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4z', 'M15 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4z', 'M8 17v-5h8v5'] },
  { id: 'quote',      name: 'Referencias',    category: 'Misc',     paths: ['M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z', 'M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z'] },
  { id: 'printer',    name: 'Imprimir',       category: 'Misc',     paths: ['M6 9V2h12v7', 'M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2', 'M6 14h12v8H6z'] },
  { id: 'download',   name: 'Descargar',      category: 'Misc',     paths: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M7 10l5 5 5-5', 'M12 15V3'] },
  { id: 'share',      name: 'Compartir',      category: 'Misc',     paths: ['M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8', 'M16 6l-4-4-4 4', 'M12 2v13'] },
  { id: 'wallet',     name: 'Finanzas',       category: 'Misc',     paths: ['M21 12V7H5a2 2 0 0 1 0-4h14v4', 'M3 5v14a2 2 0 0 0 2 2h16v-5', 'M18 12a2 2 0 0 0 0 4h4v-4z'] },
  { id: 'sun',        name: 'Energía',        category: 'Misc',     paths: ['M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z', 'M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42'] },
]

export function iconToDataUrl(icon: IconDef, color = '#1A2B4C'): string {
  const pathEls = icon.paths.map(d =>
    `<path d="${d}" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`
  ).join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">${pathEls}</svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}