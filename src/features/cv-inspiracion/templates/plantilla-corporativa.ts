import type { CVTemplate } from '../types/template.types'
import { plantillaCorporativaHTML } from './plantilla-corporativa-html'

// Canvas dimensions: A4 at 72dpi (matches html2canvas output)
const W = 595.5
const H = 842.25
const SIDEBAR_W = 257
const CONTENT_X = SIDEBAR_W
const CONTENT_W = W - SIDEBAR_W
const SIDEBAR_BG = '#444444'
const WHITE = '#ffffff'
const GRAY_LIGHT = '#cccccc'
const GRAY_MUTED = '#aaaaaa'
const CONTENT_DARK = '#333333'
const CONTENT_MED = '#555555'
const CONTENT_SOFT = '#666666'

export const plantillaCorporativa: CVTemplate = {
  id: 'corporativa-v1',
  name: 'Corporativa',
  description: 'Diseño profesional con barra lateral oscura. Ideal para posiciones en empresas tradicionales.',
  canvasWidth: W,
  canvasHeight: H,
  fonts: [
    {
      family: 'Poppins',
      weight: '400',
      url: 'https://fonts.gstatic.com/s/poppins/v21/pxiEyp8kv8JHgFVrJJfecg.woff2',
    },
    {
      family: 'Poppins',
      weight: '600',
      url: 'https://fonts.gstatic.com/s/poppins/v21/pxiByp8kv8JHgFVrLEj6Z1xlFQ.woff2',
    },
    {
      family: 'Poppins',
      weight: '700',
      url: 'https://fonts.gstatic.com/s/poppins/v21/pxiByp8kv8JHgFVrLCz7Z1xlFQ.woff2',
    },
  ],
  layers: [
    // ─── BACKGROUNDS ───
    { id: 'bg-white', name: 'Fondo blanco', type: 'rect', x: 0, y: 0, width: W, height: H, fill: WHITE, locked: true },
    { id: 'bg-sidebar', name: 'Barra lateral', type: 'rect', x: 0, y: 0, width: SIDEBAR_W, height: H, fill: SIDEBAR_BG, locked: true },

    // ─── PHOTO ───
    { id: 'photo-border', name: 'Borde foto', type: 'circle', x: SIDEBAR_W / 2, y: 68, radius: 44, fill: 'transparent', stroke: 'rgba(255,255,255,0.5)', strokeWidth: 2.5 },
    {
      id: 'photo',
      name: 'Foto perfil',
      type: 'image',
      x: SIDEBAR_W / 2 - 40,
      y: 28,
      width: 80,
      height: 80,
      src: 'USUARIO_FOTO',
      clipShape: 'circle',
      dataKey: 'USUARIO_FOTO',
    },

    // ─── NAME & TITLE ───
    {
      id: 'nombre',
      name: 'Nombre',
      type: 'text',
      x: 8,
      y: 122,
      width: SIDEBAR_W - 16,
      text: 'USUARIO_NOMBRE USUARIO_APELLIDO',
      fontSize: 13,
      fontFamily: 'Poppins',
      fontWeight: '700',
      fontStyle: 'normal',
      fill: WHITE,
      align: 'center',
      wrap: 'word',
      letterSpacing: 0.6,
      dataKey: 'USUARIO_NOMBRE',
    },
    {
      id: 'profesion',
      name: 'Profesión',
      type: 'text',
      x: 8,
      y: 143,
      width: SIDEBAR_W - 16,
      text: 'USUARIO_PROFESION',
      fontSize: 9,
      fontFamily: 'Poppins',
      fontWeight: '400',
      fill: GRAY_LIGHT,
      align: 'center',
      dataKey: 'USUARIO_PROFESION',
    },

    // ─── DIVIDERS ───
    { id: 'div-1', name: 'Divisor 1', type: 'line', x: 0, y: 0, points: [12, 162, SIDEBAR_W - 12, 162], stroke: 'rgba(255,255,255,0.2)', strokeWidth: 0.5 },
    { id: 'div-2', name: 'Divisor 2', type: 'line', x: 0, y: 0, points: [12, 225, SIDEBAR_W - 12, 225], stroke: 'rgba(255,255,255,0.2)', strokeWidth: 0.5 },
    { id: 'div-3', name: 'Divisor 3', type: 'line', x: 0, y: 0, points: [12, 318, SIDEBAR_W - 12, 318], stroke: 'rgba(255,255,255,0.2)', strokeWidth: 0.5 },
    { id: 'div-4', name: 'Divisor 4', type: 'line', x: 0, y: 0, points: [12, 400, SIDEBAR_W - 12, 400], stroke: 'rgba(255,255,255,0.2)', strokeWidth: 0.5 },

    // ─── CONTACT SECTION ───
    { id: 'hdr-contact', type: 'text', name: 'Título Contacto', x: 12, y: 170, width: SIDEBAR_W - 24, text: 'CONTACT', fontSize: 7.5, fontFamily: 'Poppins', fontWeight: '700', fill: WHITE, letterSpacing: 1.8 },
    { id: 'contact-phone', type: 'text', name: 'Teléfono', x: 22, y: 183, width: SIDEBAR_W - 34, text: 'USUARIO_TELEFONO', fontSize: 7.5, fontFamily: 'Poppins', fill: '#dddddd', dataKey: 'USUARIO_TELEFONO', wrap: 'word' },
    { id: 'contact-email', type: 'text', name: 'Email', x: 22, y: 197, width: SIDEBAR_W - 34, text: 'USUARIO_EMAIL', fontSize: 7.5, fontFamily: 'Poppins', fill: '#dddddd', dataKey: 'USUARIO_EMAIL', wrap: 'word' },
    { id: 'contact-location', type: 'text', name: 'Ubicación', x: 22, y: 211, width: SIDEBAR_W - 34, text: 'USUARIO_CIUDAD, USUARIO_PAIS', fontSize: 7.5, fontFamily: 'Poppins', fill: '#dddddd', wrap: 'word', dataKey: 'USUARIO_CIUDAD' },

    // ─── EDUCATION ───
    { id: 'hdr-edu', type: 'text', name: 'Título Educación', x: 12, y: 233, width: SIDEBAR_W - 24, text: 'EDUCATION', fontSize: 7.5, fontFamily: 'Poppins', fontWeight: '700', fill: WHITE, letterSpacing: 1.8 },
    { id: 'edu1-inst', type: 'text', name: 'Edu 1 Institución', x: 12, y: 246, width: SIDEBAR_W - 24, text: 'USUARIO_EDU1_INSTITUCION', fontSize: 8, fontFamily: 'Poppins', fontWeight: '600', fill: WHITE, wrap: 'word', dataKey: 'USUARIO_EDU1_INSTITUCION' },
    { id: 'edu1-titulo', type: 'text', name: 'Edu 1 Título', x: 12, y: 258, width: SIDEBAR_W - 24, text: 'USUARIO_EDU1_TITULO', fontSize: 7.5, fontFamily: 'Poppins', fontStyle: 'italic', fill: GRAY_LIGHT, wrap: 'word', dataKey: 'USUARIO_EDU1_TITULO' },
    { id: 'edu1-fechas', type: 'text', name: 'Edu 1 Fechas', x: 12, y: 272, width: SIDEBAR_W - 24, text: 'USUARIO_EDU1_FECHAS', fontSize: 7, fontFamily: 'Poppins', fill: GRAY_MUTED, dataKey: 'USUARIO_EDU1_FECHAS' },
    { id: 'edu2-inst', type: 'text', name: 'Edu 2 Institución', x: 12, y: 284, width: SIDEBAR_W - 24, text: 'USUARIO_EDU2_INSTITUCION', fontSize: 8, fontFamily: 'Poppins', fontWeight: '600', fill: WHITE, wrap: 'word', dataKey: 'USUARIO_EDU2_INSTITUCION' },
    { id: 'edu2-titulo', type: 'text', name: 'Edu 2 Título', x: 12, y: 296, width: SIDEBAR_W - 24, text: 'USUARIO_EDU2_TITULO', fontSize: 7.5, fontFamily: 'Poppins', fontStyle: 'italic', fill: GRAY_LIGHT, wrap: 'word', dataKey: 'USUARIO_EDU2_TITULO' },
    { id: 'edu2-fechas', type: 'text', name: 'Edu 2 Fechas', x: 12, y: 310, width: SIDEBAR_W - 24, text: 'USUARIO_EDU2_FECHAS', fontSize: 7, fontFamily: 'Poppins', fill: GRAY_MUTED, dataKey: 'USUARIO_EDU2_FECHAS' },

    // ─── SKILLS ───
    { id: 'hdr-skills', type: 'text', name: 'Título Skills', x: 12, y: 326, width: SIDEBAR_W - 24, text: 'SKILLS', fontSize: 7.5, fontFamily: 'Poppins', fontWeight: '700', fill: WHITE, letterSpacing: 1.8 },
    { id: 'skill-1', type: 'text', name: 'Habilidad 1', x: 22, y: 339, width: SIDEBAR_W - 34, text: 'USUARIO_HABILIDAD_1', fontSize: 7.5, fontFamily: 'Poppins', fill: '#dddddd', dataKey: 'USUARIO_HABILIDAD_1' },
    { id: 'skill-2', type: 'text', name: 'Habilidad 2', x: 22, y: 352, width: SIDEBAR_W - 34, text: 'USUARIO_HABILIDAD_2', fontSize: 7.5, fontFamily: 'Poppins', fill: '#dddddd', dataKey: 'USUARIO_HABILIDAD_2' },
    { id: 'skill-3', type: 'text', name: 'Habilidad 3', x: 22, y: 365, width: SIDEBAR_W - 34, text: 'USUARIO_HABILIDAD_3', fontSize: 7.5, fontFamily: 'Poppins', fill: '#dddddd', dataKey: 'USUARIO_HABILIDAD_3' },
    { id: 'skill-4', type: 'text', name: 'Habilidad 4', x: 22, y: 378, width: SIDEBAR_W - 34, text: 'USUARIO_HABILIDAD_4', fontSize: 7.5, fontFamily: 'Poppins', fill: '#dddddd', dataKey: 'USUARIO_HABILIDAD_4' },
    { id: 'skill-5', type: 'text', name: 'Habilidad 5', x: 22, y: 391, width: SIDEBAR_W - 34, text: 'USUARIO_HABILIDAD_5', fontSize: 7.5, fontFamily: 'Poppins', fill: '#dddddd', dataKey: 'USUARIO_HABILIDAD_5' },
    { id: 'skill-6', type: 'text', name: 'Habilidad 6', x: 22, y: 404, width: SIDEBAR_W - 34, text: 'USUARIO_HABILIDAD_6', fontSize: 7.5, fontFamily: 'Poppins', fill: '#dddddd', dataKey: 'USUARIO_HABILIDAD_6' },

    // ─── LANGUAGES ───
    { id: 'hdr-langs', type: 'text', name: 'Título Idiomas', x: 12, y: 416, width: SIDEBAR_W - 24, text: 'LANGUAGES', fontSize: 7.5, fontFamily: 'Poppins', fontWeight: '700', fill: WHITE, letterSpacing: 1.8 },
    { id: 'idioma-1', type: 'text', name: 'Idioma 1', x: 22, y: 429, width: SIDEBAR_W - 34, text: 'USUARIO_IDIOMA_1', fontSize: 7.5, fontFamily: 'Poppins', fill: '#dddddd', dataKey: 'USUARIO_IDIOMA_1' },
    { id: 'idioma-2', type: 'text', name: 'Idioma 2', x: 22, y: 442, width: SIDEBAR_W - 34, text: 'USUARIO_IDIOMA_2', fontSize: 7.5, fontFamily: 'Poppins', fill: '#dddddd', dataKey: 'USUARIO_IDIOMA_2' },

    // ─── CONTENT: PROFILE ───
    { id: 'hdr-perfil', type: 'text', name: 'Título Perfil', x: CONTENT_X + 18, y: 28, width: CONTENT_W - 36, text: 'PROFILE', fontSize: 7.5, fontFamily: 'Poppins', fontWeight: '700', fill: '#444444', letterSpacing: 1.8 },
    { id: 'content-line-perfil', type: 'line', x: 0, y: 0, points: [CONTENT_X + 18, 40, W - 18, 40], stroke: '#444444', strokeWidth: 0.75 },
    { id: 'resumen', type: 'text', name: 'Resumen', x: CONTENT_X + 18, y: 46, width: CONTENT_W - 36, text: 'USUARIO_RESUMEN', fontSize: 7.5, fontFamily: 'Poppins', fill: '#555555', lineHeight: 1.55, wrap: 'word', dataKey: 'USUARIO_RESUMEN' },

    // ─── CONTENT: EXPERIENCE ───
    { id: 'hdr-exp', type: 'text', name: 'Título Experiencia', x: CONTENT_X + 18, y: 112, width: CONTENT_W - 36, text: 'EXPERIENCE', fontSize: 7.5, fontFamily: 'Poppins', fontWeight: '700', fill: '#444444', letterSpacing: 1.8 },
    { id: 'content-line-exp', type: 'line', x: 0, y: 0, points: [CONTENT_X + 18, 124, W - 18, 124], stroke: '#444444', strokeWidth: 0.75 },

    // Exp 1
    { id: 'exp1-empresa', type: 'text', name: 'Exp 1 Empresa', x: CONTENT_X + 18, y: 130, width: CONTENT_W - 80, text: 'USUARIO_EXP1_EMPRESA', fontSize: 8, fontFamily: 'Poppins', fontWeight: '700', fill: CONTENT_DARK, wrap: 'word', dataKey: 'USUARIO_EXP1_EMPRESA' },
    { id: 'exp1-fechas', type: 'text', name: 'Exp 1 Fechas', x: W - 100, y: 130, width: 82, text: 'USUARIO_EXP1_FECHAS – USUARIO_EXP1_FECHA_FIN', fontSize: 7, fontFamily: 'Poppins', fill: '#888888', align: 'right', wrap: 'word', dataKey: 'USUARIO_EXP1_FECHAS' },
    { id: 'exp1-cargo', type: 'text', name: 'Exp 1 Cargo', x: CONTENT_X + 18, y: 142, width: CONTENT_W - 36, text: 'USUARIO_EXP1_CARGO', fontSize: 7.5, fontFamily: 'Poppins', fontWeight: '600', fontStyle: 'italic', fill: CONTENT_MED, dataKey: 'USUARIO_EXP1_CARGO' },
    { id: 'exp1-d1', type: 'text', name: 'Exp 1 Desc 1', x: CONTENT_X + 22, y: 155, width: CONTENT_W - 42, text: '• USUARIO_EXP1_DESC1', fontSize: 7, fontFamily: 'Poppins', fill: CONTENT_SOFT, wrap: 'word', dataKey: 'USUARIO_EXP1_DESC1' },
    { id: 'exp1-d2', type: 'text', name: 'Exp 1 Desc 2', x: CONTENT_X + 22, y: 167, width: CONTENT_W - 42, text: '• USUARIO_EXP1_DESC2', fontSize: 7, fontFamily: 'Poppins', fill: CONTENT_SOFT, wrap: 'word', dataKey: 'USUARIO_EXP1_DESC2' },
    { id: 'exp1-d3', type: 'text', name: 'Exp 1 Desc 3', x: CONTENT_X + 22, y: 179, width: CONTENT_W - 42, text: '• USUARIO_EXP1_DESC3', fontSize: 7, fontFamily: 'Poppins', fill: CONTENT_SOFT, wrap: 'word', dataKey: 'USUARIO_EXP1_DESC3' },
    { id: 'exp1-d4', type: 'text', name: 'Exp 1 Desc 4', x: CONTENT_X + 22, y: 191, width: CONTENT_W - 42, text: '• USUARIO_EXP1_DESC4', fontSize: 7, fontFamily: 'Poppins', fill: CONTENT_SOFT, wrap: 'word', dataKey: 'USUARIO_EXP1_DESC4' },
    { id: 'exp1-d5', type: 'text', name: 'Exp 1 Desc 5', x: CONTENT_X + 22, y: 203, width: CONTENT_W - 42, text: '• USUARIO_EXP1_DESC5', fontSize: 7, fontFamily: 'Poppins', fill: CONTENT_SOFT, wrap: 'word', dataKey: 'USUARIO_EXP1_DESC5' },

    // Exp 2
    { id: 'exp2-empresa', type: 'text', name: 'Exp 2 Empresa', x: CONTENT_X + 18, y: 218, width: CONTENT_W - 80, text: 'USUARIO_EXP2_EMPRESA', fontSize: 8, fontFamily: 'Poppins', fontWeight: '700', fill: CONTENT_DARK, wrap: 'word', dataKey: 'USUARIO_EXP2_EMPRESA' },
    { id: 'exp2-fechas', type: 'text', name: 'Exp 2 Fechas', x: W - 100, y: 218, width: 82, text: 'USUARIO_EXP2_FECHAS – USUARIO_EXP2_FECHA_FIN', fontSize: 7, fontFamily: 'Poppins', fill: '#888888', align: 'right', wrap: 'word', dataKey: 'USUARIO_EXP2_FECHAS' },
    { id: 'exp2-cargo', type: 'text', name: 'Exp 2 Cargo', x: CONTENT_X + 18, y: 230, width: CONTENT_W - 36, text: 'USUARIO_EXP2_CARGO', fontSize: 7.5, fontFamily: 'Poppins', fontWeight: '600', fontStyle: 'italic', fill: CONTENT_MED, dataKey: 'USUARIO_EXP2_CARGO' },
    { id: 'exp2-d1', type: 'text', name: 'Exp 2 Desc 1', x: CONTENT_X + 22, y: 243, width: CONTENT_W - 42, text: '• USUARIO_EXP2_DESC1', fontSize: 7, fontFamily: 'Poppins', fill: CONTENT_SOFT, wrap: 'word', dataKey: 'USUARIO_EXP2_DESC1' },
    { id: 'exp2-d2', type: 'text', name: 'Exp 2 Desc 2', x: CONTENT_X + 22, y: 255, width: CONTENT_W - 42, text: '• USUARIO_EXP2_DESC2', fontSize: 7, fontFamily: 'Poppins', fill: CONTENT_SOFT, wrap: 'word', dataKey: 'USUARIO_EXP2_DESC2' },
    { id: 'exp2-d3', type: 'text', name: 'Exp 2 Desc 3', x: CONTENT_X + 22, y: 267, width: CONTENT_W - 42, text: '• USUARIO_EXP2_DESC3', fontSize: 7, fontFamily: 'Poppins', fill: CONTENT_SOFT, wrap: 'word', dataKey: 'USUARIO_EXP2_DESC3' },
    { id: 'exp2-d4', type: 'text', name: 'Exp 2 Desc 4', x: CONTENT_X + 22, y: 279, width: CONTENT_W - 42, text: '• USUARIO_EXP2_DESC4', fontSize: 7, fontFamily: 'Poppins', fill: CONTENT_SOFT, wrap: 'word', dataKey: 'USUARIO_EXP2_DESC4' },
    { id: 'exp2-d5', type: 'text', name: 'Exp 2 Desc 5', x: CONTENT_X + 22, y: 291, width: CONTENT_W - 42, text: '• USUARIO_EXP2_DESC5', fontSize: 7, fontFamily: 'Poppins', fill: CONTENT_SOFT, wrap: 'word', dataKey: 'USUARIO_EXP2_DESC5' },

    // Exp 3
    { id: 'exp3-empresa', type: 'text', name: 'Exp 3 Empresa', x: CONTENT_X + 18, y: 306, width: CONTENT_W - 80, text: 'USUARIO_EXP3_EMPRESA', fontSize: 8, fontFamily: 'Poppins', fontWeight: '700', fill: CONTENT_DARK, wrap: 'word', dataKey: 'USUARIO_EXP3_EMPRESA' },
    { id: 'exp3-fechas', type: 'text', name: 'Exp 3 Fechas', x: W - 100, y: 306, width: 82, text: 'USUARIO_EXP3_FECHAS – USUARIO_EXP3_FECHA_FIN', fontSize: 7, fontFamily: 'Poppins', fill: '#888888', align: 'right', wrap: 'word', dataKey: 'USUARIO_EXP3_FECHAS' },
    { id: 'exp3-cargo', type: 'text', name: 'Exp 3 Cargo', x: CONTENT_X + 18, y: 318, width: CONTENT_W - 36, text: 'USUARIO_EXP3_CARGO', fontSize: 7.5, fontFamily: 'Poppins', fontWeight: '600', fontStyle: 'italic', fill: CONTENT_MED, dataKey: 'USUARIO_EXP3_CARGO' },
    { id: 'exp3-d1', type: 'text', name: 'Exp 3 Desc 1', x: CONTENT_X + 22, y: 331, width: CONTENT_W - 42, text: '• USUARIO_EXP3_DESC1', fontSize: 7, fontFamily: 'Poppins', fill: CONTENT_SOFT, wrap: 'word', dataKey: 'USUARIO_EXP3_DESC1' },
    { id: 'exp3-d2', type: 'text', name: 'Exp 3 Desc 2', x: CONTENT_X + 22, y: 343, width: CONTENT_W - 42, text: '• USUARIO_EXP3_DESC2', fontSize: 7, fontFamily: 'Poppins', fill: CONTENT_SOFT, wrap: 'word', dataKey: 'USUARIO_EXP3_DESC2' },
    { id: 'exp3-d3', type: 'text', name: 'Exp 3 Desc 3', x: CONTENT_X + 22, y: 355, width: CONTENT_W - 42, text: '• USUARIO_EXP3_DESC3', fontSize: 7, fontFamily: 'Poppins', fill: CONTENT_SOFT, wrap: 'word', dataKey: 'USUARIO_EXP3_DESC3' },
    { id: 'exp3-d4', type: 'text', name: 'Exp 3 Desc 4', x: CONTENT_X + 22, y: 367, width: CONTENT_W - 42, text: '• USUARIO_EXP3_DESC4', fontSize: 7, fontFamily: 'Poppins', fill: CONTENT_SOFT, wrap: 'word', dataKey: 'USUARIO_EXP3_DESC4' },
    { id: 'exp3-d5', type: 'text', name: 'Exp 3 Desc 5', x: CONTENT_X + 22, y: 379, width: CONTENT_W - 42, text: '• USUARIO_EXP3_DESC5', fontSize: 7, fontFamily: 'Poppins', fill: CONTENT_SOFT, wrap: 'word', dataKey: 'USUARIO_EXP3_DESC5' },

    // ─── CONTENT: REFERENCES ───
    { id: 'hdr-ref', type: 'text', name: 'Título Referencias', x: CONTENT_X + 18, y: 398, width: CONTENT_W - 36, text: 'REFERENCES', fontSize: 7.5, fontFamily: 'Poppins', fontWeight: '700', fill: '#444444', letterSpacing: 1.8 },
    { id: 'content-line-ref', type: 'line', x: 0, y: 0, points: [CONTENT_X + 18, 410, W - 18, 410], stroke: '#444444', strokeWidth: 0.75 },
    { id: 'ref1-nombre', type: 'text', name: 'Ref 1 Nombre', x: CONTENT_X + 18, y: 416, width: CONTENT_W - 36, text: 'USUARIO_REF1_NOMBRE', fontSize: 8, fontFamily: 'Poppins', fontWeight: '700', fill: CONTENT_DARK, dataKey: 'USUARIO_REF1_NOMBRE' },
    { id: 'ref1-cargo', type: 'text', name: 'Ref 1 Cargo', x: CONTENT_X + 18, y: 428, width: CONTENT_W - 36, text: 'USUARIO_REF1_CARGO', fontSize: 7.5, fontFamily: 'Poppins', fill: CONTENT_MED, dataKey: 'USUARIO_REF1_CARGO' },
    { id: 'ref1-contacto', type: 'text', name: 'Ref 1 Contacto', x: CONTENT_X + 18, y: 440, width: CONTENT_W - 36, text: 'USUARIO_REF1_CONTACTO', fontSize: 7, fontFamily: 'Poppins', fill: '#888888', dataKey: 'USUARIO_REF1_CONTACTO' },
  ],
}

export const plantillaCorporativaHTMLTemplate = plantillaCorporativaHTML