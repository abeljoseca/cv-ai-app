// Europass template for CVs with the style's own schema ('europass@2').
// Visual source of truth: estilos-de-cv/specs/europass-cv-ejemplo-v2.html (same classes,
// same measurements). Values come from the contract (contract.ts) and code formatters
// (format.ts); "_" fields are never rendered. Legacy Europass CVs keep EuropassCV.tsx.

import EditableField from './EditableField'
import type { CVEditProps } from './index'
import { CV_FONT } from './fonts'
import { CEFR_LEVELS, CEFR_SKILLS, type CefrBreakdown } from '@/lib/cefr'
import {
  EUROPASS_DEFAULT_ACCENT, EUROPASS_DEFAULT_DENSITY, EUROPASS_DEFAULT_PHOTO_SIZE, EUROPASS_DENSITIES,
  EUROPASS_HEADER_ORDER, EUROPASS_PHOTO_SIZES, EUROPASS_SECTIONS, type EuropassDensity, type EuropassPhotoSize,
} from '@/lib/cv/styles/europass/contract'
import { CEFR_SKILL_LABELS, DIGCOMP_AREA_LABELS, drivingLicenceLabel, iscedLabel } from '@/lib/cv/styles/europass/format'
import { DIGCOMP_AREAS, type EuropassContent, type PerfilTipo } from '@/lib/cv/styles/europass/schema'
import { shouldShowArea } from '@/lib/format-education'

// Editor-only controls for the CEFR table (spec §7.3, change 29). Passed only by the CV
// editor; the print page, the PDF and thumbnails never get them.
export interface EuropassLanguageEditor {
  onNiveles: (idiomaId: string, niveles: CefrBreakdown) => void
  onNivelGeneral: (idiomaId: string, nivel: string) => void
}

export interface EuropassV2Props extends CVEditProps {
  data: EuropassContent
  densidad?: EuropassDensity
  fotoTam?: EuropassPhotoSize
  idiomasEditor?: EuropassLanguageEditor
}

const CSS = `
.ep2, .ep2 *{ box-sizing: border-box; }
.ep2-page{
  width: 210mm; max-width: 100%; min-height: 297mm; margin: 0 auto; padding: 22mm;
  background: #ffffff; color: #000000; line-height: var(--lh);
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
.ep2 p{ margin: 0; }
.ep2 .header{
  display: flex; justify-content: space-between; align-items: flex-start; gap: 20px;
  border-bottom: 2.5px solid var(--acento); padding-bottom: 14px; margin-bottom: 18px;
}
.ep2 .id-block{ flex: 1; min-width: 0; }
.ep2 .nombre{ font-weight: 700; font-size: 20pt; margin: 0; letter-spacing: .2px; }
.ep2 .titulo-profesional{ font-size: 11.5pt; color: #595959; margin: 2px 0 8px; }
.ep2 .datos-personales{
  font-size: 10.5pt; display: grid; grid-template-columns: auto auto; justify-content: space-between; gap: 2px 18px;
}
.ep2 .datos-personales > div{ overflow-wrap: break-word; }
.ep2 .datos-personales .label{ color: #595959; font-style: italic; font-size: 10pt; }
.ep2 .foto{ width: var(--foto-w); height: var(--foto-h); flex-shrink: 0; overflow: hidden; background: #e8ecf5; }
.ep2 .foto img{ width: 100%; height: 100%; max-width: none; object-fit: cover; display: block; }

.ep2 section{ margin-bottom: var(--entre-secciones); }
.ep2 h2.section-title{
  font-weight: 700; font-size: 13pt; color: var(--acento); text-transform: uppercase; letter-spacing: .4px;
  margin: 0 0 var(--bajo-titulo) 0; padding-bottom: 3px; border-bottom: 1px solid #e8ecf5;
  break-after: avoid; page-break-after: avoid;
}
.ep2 .sobre-mi p{ font-size: 10.5pt; }

.ep2 .item{ margin-bottom: var(--entre-items); break-inside: avoid; page-break-inside: avoid; }
.ep2 .item:last-child{ margin-bottom: 0; }
.ep2 .item-row{ display: flex; justify-content: space-between; align-items: baseline; gap: 10px; }
.ep2 .item-titulo{ font-weight: 700; font-size: 11.5pt; }
.ep2 .item-fecha{ font-style: italic; font-size: 10pt; color: #595959; white-space: nowrap; }
.ep2 .item-area{ font-size: 10.5pt; color: #595959; margin: 1px 0 0 0; }
.ep2 .item-sub{ font-size: 10.5pt; margin: 1px 0 3px 0; }
.ep2 .item-sub .lugar{ color: #595959; font-style: italic; }
.ep2 ul.bullets{ margin: 0; padding-left: 18px; font-size: 10.5pt; list-style: disc outside; }
.ep2 ul.bullets li{ margin-bottom: 1.5pt; display: list-item; }
.ep2 .item-meta{ font-size: 9.5pt; color: #595959; margin-top: 2px; }

.ep2 .lengua-materna{ font-size: 10.5pt; margin: 0 0 8px 0; }
.ep2 .otras-lenguas{ font-size: 10.5pt; margin: 8px 0 0 0; }
.ep2 table.cefr{ width: 100%; border-collapse: collapse; font-size: 9.5pt; break-inside: avoid; page-break-inside: avoid; }
.ep2 table.cefr th, .ep2 table.cefr td{ border: 1px solid #e8ecf5; padding: 5px 6px; text-align: center; }
.ep2 table.cefr th{ background: #e8ecf5; color: var(--acento); font-weight: 700; font-size: 9pt; }
.ep2 table.cefr td:first-child, .ep2 table.cefr th:first-child{ text-align: left; font-weight: 700; }
.ep2 .cefr-nota{ font-size: 9.5pt; color: #595959; margin-top: 4px; font-style: italic; }

.ep2 .chip-list{ display: flex; flex-wrap: wrap; gap: 6px; }
.ep2 .chip{ font-size: 9.5pt; background: #e8ecf5; padding: 3px 9px; border-radius: 3px; }

.ep2 .digcomp-grid{ display: grid; grid-template-columns: 1fr 1fr; gap: 6px 20px; font-size: 10pt; }
.ep2 .chip-list + .digcomp-grid{ margin-top: 8pt; }
.ep2 .digcomp-item{ display: flex; justify-content: space-between; gap: 8px; border-bottom: 1px dotted #e8ecf5; padding-bottom: 3px; }
.ep2 .digcomp-nivel{ font-weight: 700; color: var(--acento); font-size: 9.5pt; white-space: nowrap; }

.ep2 .subgrupo{ margin-bottom: var(--entre-items); break-inside: avoid; page-break-inside: avoid; }
.ep2 .subgrupo:last-child{ margin-bottom: 0; }
.ep2 .subgrupo-titulo{ font-size: 10pt; font-style: italic; font-weight: 700; color: #595959; margin: 0 0 2px; }

.ep2 .anexos-list{ font-size: 10.5pt; }
.ep2 .anexos-list div{ margin-bottom: 3px; }
.ep2 .anexos-list .num{ color: var(--acento); font-weight: 700; margin-right: 6px; }

/* Editor-only (never printed): CEFR capsule and cell selectors. */
.ep2 .ep2-capsula{
  font-family: system-ui, -apple-system, "Segoe UI", sans-serif; font-size: 12px; line-height: 1.4;
  background: #EEF2FF; color: #3730A3; border: 1px solid #C7D2FE; border-radius: 8px;
  padding: 6px 10px; margin: 0 0 6px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
}
.ep2 .ep2-capsula button{
  font: inherit; font-weight: 600; background: #4B6BFB; color: #fff; border: none; border-radius: 6px;
  padding: 3px 10px; cursor: pointer; margin-left: auto;
}
.ep2 .ep2-capsula select{ font: inherit; border: 1px solid #C7D2FE; border-radius: 6px; padding: 2px 4px; background: #fff; color: #1e1b4b; }
.ep2 table.cefr.ep2-resaltada{ outline: 1.5px solid #C7D2FE; outline-offset: 3px; border-radius: 2px; }
.ep2 table.cefr select.ep2-celda{
  appearance: none; -webkit-appearance: none; border: none; background: transparent; font: inherit; color: inherit;
  text-align: center; text-align-last: center; cursor: pointer; padding: 0 2px;
  border-bottom: 1px dashed #A5B4FC;
}
/* Not confirmed yet: each level is a filled pill with a chevron, so it invites a review. */
.ep2 table.cefr select.ep2-celda.ep2-celda-pendiente{
  border: 1px solid #A5B4FC; border-radius: 999px; background-color: #E0E7FF; color: #3730A3; font-weight: 700;
  padding: 1px 16px 1px 8px; text-align-last: left;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5' viewBox='0 0 8 5'%3E%3Cpath d='M1 1l3 3 3-3' fill='none' stroke='%233730A3' stroke-width='1.4' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 6px center;
}
.ep2 table.cefr select.ep2-celda.ep2-celda-pendiente:hover{ background-color: #C7D2FE; }

@media print{
  .ep2-page{ margin: 0; padding: 0; width: auto; max-width: none; min-height: auto; }
  .ep2 .ep2-capsula{ display: none !important; }
}
`

const PERFIL_LABELS: Record<PerfilTipo, string> = { linkedin: 'LinkedIn', orcid: 'ORCID', researchgate: 'ResearchGate' }

const ADICIONAL_LABELS = Object.fromEntries(
  (EUROPASS_SECTIONS.find(s => s.key === 'informacion_adicional')?.fields ?? []).map(f => [f.key, f.label]),
) as Record<string, string>
const ADICIONAL_ORDER = ['logros_destacados', 'publicaciones', 'ponencias', 'voluntariado', 'premios_becas', 'afiliaciones'] as const

// "https://www.linkedin.com/in/ana/" → "linkedin.com/in/ana"
function displayUrl(url: string): string {
  return url.trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/+$/, '')
}

function dateRange(inicio: string | null, fin: string | null): string | null {
  if (inicio && fin) return `${inicio} – ${fin}`
  return inicio ?? fin ?? null
}

function headerFields(ip: EuropassContent['informacion_personal']): Array<{ key: string; label: string; value: string }> {
  const perfil = (tipo: PerfilTipo) => ip.perfiles.find(p => p.tipo === tipo && p.activo && p.url)
  const out: Array<{ key: string; label: string; value: string }> = []
  for (const key of EUROPASS_HEADER_ORDER) {
    switch (key) {
      case 'fecha_nacimiento':
        if (ip.fecha_nacimiento.activo && ip.fecha_nacimiento.valor) out.push({ key, label: 'Fecha de nacimiento', value: ip.fecha_nacimiento.valor })
        break
      case 'nacionalidad':
        if (ip.nacionalidad.activo && ip.nacionalidad.valor) out.push({ key, label: 'Nacionalidad', value: ip.nacionalidad.valor })
        break
      case 'direccion_o_ciudad':
        // The full address replaces "city, country": never both (spec §4.1).
        if (ip.direccion.activo && ip.direccion.valor) out.push({ key, label: 'Dirección', value: ip.direccion.valor })
        else if (ip.ciudad_pais) out.push({ key, label: 'Ciudad', value: ip.ciudad_pais })
        break
      case 'telefono':
        if (ip.telefono) out.push({ key, label: 'Teléfono', value: ip.telefono })
        break
      case 'email':
        if (ip.email) out.push({ key, label: 'Email', value: ip.email })
        break
      default: {
        const p = perfil(key)
        if (p) out.push({ key, label: PERFIL_LABELS[key], value: displayUrl(p.url) })
      }
    }
  }
  return out
}

export default function EuropassV2CV({
  data, isEditMode = false, onFieldChange, accentColor, densidad, fotoTam, idiomasEditor,
}: EuropassV2Props) {
  const ip = data.informacion_personal
  const d = EUROPASS_DENSITIES[densidad ?? EUROPASS_DEFAULT_DENSITY] ?? EUROPASS_DENSITIES[EUROPASS_DEFAULT_DENSITY]
  const foto = EUROPASS_PHOTO_SIZES[fotoTam ?? EUROPASS_DEFAULT_PHOTO_SIZE] ?? EUROPASS_PHOTO_SIZES[EUROPASS_DEFAULT_PHOTO_SIZE]
  const vars = {
    '--acento': accentColor || EUROPASS_DEFAULT_ACCENT,
    '--lh': String(d.lineHeight),
    '--entre-secciones': d.entreSecciones,
    '--bajo-titulo': d.bajoTitulo,
    '--entre-items': d.entreItems,
    '--foto-w': foto.width,
    '--foto-h': foto.height,
    fontFamily: CV_FONT.carlito,
  } as React.CSSProperties

  const datos = headerFields(ip)
  const showFoto = ip.foto.activo && !!ip.foto.url

  const experiencias = data.experiencia_laboral
  const formacion = data.educacion_formacion
  const { lenguas_maternas: maternas, otras_lenguas } = data.competencias_linguisticas
  const conNivel = otras_lenguas.filter(l => l.niveles)
  // Not confirmed yet: listed without a level, below the table (CEO decision 2026-09-25).
  const sinNivel = otras_lenguas.filter(l => !l.niveles)
  const certs = otras_lenguas.filter(l => l.certificacion.activo && l.certificacion.valor)
  const herramientas = data.competencias_digitales.herramientas
  const digcomp = data.competencias_digitales.digcomp
  const permiso = data.permiso_conducir.activo ? data.permiso_conducir.categorias : []
  const adicional = data.informacion_adicional.activo
    ? ADICIONAL_ORDER.filter(k => data.informacion_adicional[k].activo && data.informacion_adicional[k].items.length > 0)
    : []
  const anexos = data.anexos.activo ? data.anexos.items : []

  return (
    <div className="ep2" style={vars}>
      <style>{CSS}</style>
      <div className="ep2-page">

        {/* 1. Información personal */}
        <header className="header">
          <div className="id-block">
            <p className="nombre">{ip.nombre_completo}</p>
            {ip.titulo_profesional && <p className="titulo-profesional">{ip.titulo_profesional}</p>}
            {datos.length > 0 && (
              <div className="datos-personales">
                {datos.map(f => (
                  <div key={f.key}><span className="label">{f.label}:</span> {f.value}</div>
                ))}
              </div>
            )}
          </div>
          {showFoto && (
            <div className="foto">
              {/* eslint-disable-next-line @next/next/no-img-element -- printed by headless Chromium; must be a plain img */}
              <img src={ip.foto.url!} alt="" />
            </div>
          )}
        </header>

        {/* 2. Sobre mí */}
        {data.sobre_mi.texto && (
          <section className="sobre-mi">
            <h2 className="section-title">Sobre mí</h2>
            <EditableField tag="p" value={data.sobre_mi.texto} path="sobre_mi.texto" isEditMode={isEditMode} onFieldChange={onFieldChange} />
          </section>
        )}

        {/* 3. Experiencia laboral */}
        {experiencias.length > 0 && (
          <section>
            <h2 className="section-title">Experiencia laboral</h2>
            {experiencias.map((e, i) => {
              const fecha = dateRange(e.fecha_inicio, e.fecha_fin)
              const bullets = e.bullets.map((b, j) => ({ b, j })).filter(x => x.b.texto.trim())
              return (
                <div className="item" key={e._id}>
                  <div className="item-row">
                    <span className="item-titulo">{e.cargo}</span>
                    {fecha && <span className="item-fecha">{fecha}</span>}
                  </div>
                  <div className="item-sub">
                    {e.empleador}
                    {e.lugar.activo && e.lugar.valor && <span> — <span className="lugar">{e.lugar.valor}</span></span>}
                  </div>
                  {bullets.length > 0 && (
                    <ul className="bullets">
                      {bullets.map(({ b, j }) => (
                        <EditableField key={j} tag="li" value={b.texto} path={`experiencia_laboral.${i}.bullets.${j}.texto`} isEditMode={isEditMode} onFieldChange={onFieldChange} />
                      ))}
                    </ul>
                  )}
                  {e.sector_nace.activo && e.sector_nace.valor && (
                    <div className="item-meta">Sector de actividad (NACE): {e.sector_nace.valor}</div>
                  )}
                </div>
              )
            })}
          </section>
        )}

        {/* 4. Educación y formación (incluye cursos y certificaciones) */}
        {formacion.length > 0 && (
          <section>
            <h2 className="section-title">Educación y formación</h2>
            {formacion.map(ed => {
              const fecha = dateRange(ed.fecha_inicio, ed.fecha_fin)
              const lugar = ed.lugar.activo ? ed.lugar.valor : null
              const meta = [
                ed.nivel_isced.activo && iscedLabel(ed.nivel_isced.valor) ? `Nivel CINE/ISCED: ${iscedLabel(ed.nivel_isced.valor)}` : null,
                ed.materias.activo && ed.materias.valor ? `Materias principales: ${ed.materias.valor}` : null,
              ].filter(Boolean)
              return (
                <div className="item" key={ed._id}>
                  <div className="item-row">
                    <span className="item-titulo">{ed.titulo}</span>
                    {fecha && <span className="item-fecha">{fecha}</span>}
                  </div>
                  {shouldShowArea(ed.titulo, ed.area) && <div className="item-area">{ed.area}</div>}
                  {(ed.institucion || lugar) && (
                    <div className="item-sub">
                      {ed.institucion}
                      {lugar && <span>{ed.institucion ? ' — ' : ''}<span className="lugar">{lugar}</span></span>}
                    </div>
                  )}
                  {meta.length > 0 && <div className="item-meta">{meta.join(' · ')}</div>}
                </div>
              )
            })}
          </section>
        )}

        {/* 5. Competencias lingüísticas */}
        {(maternas.length > 0 || otras_lenguas.length > 0) && (
          <section>
            <h2 className="section-title">Competencias lingüísticas</h2>
            {maternas.length > 0 && (
              <p className="lengua-materna"><b>{maternas.length > 1 ? 'Lenguas maternas' : 'Lengua materna'}:</b> {maternas.join(', ')}</p>
            )}
            {idiomasEditor && conNivel.filter(l => l._id && !l.niveles_confirmados).map(l => (
              <div className="ep2-capsula" key={`c-${l._id}`}>
                <span>Tu nivel general de {l.idioma.toLowerCase()} es {l.niveles!.comprension_auditiva}. Ajusta si alguna habilidad es distinta.</span>
                <button type="button" onClick={() => idiomasEditor.onNiveles(l._id!, l.niveles!)}>Confirmar</button>
              </div>
            ))}
            {conNivel.length > 0 && (
              <table className={`cefr${idiomasEditor && conNivel.some(l => l._id && !l.niveles_confirmados) ? ' ep2-resaltada' : ''}`}>
                <thead>
                  <tr>
                    <th scope="col">Idioma</th>
                    {CEFR_SKILLS.map(s => {
                      const [first, ...rest] = CEFR_SKILL_LABELS[s].split(' ')
                      return <th scope="col" key={s}>{first}<br />{rest.join(' ')}</th>
                    })}
                  </tr>
                </thead>
                <tbody>
                  {conNivel.map(l => (
                    <tr key={l.idioma}>
                      <td>{l.idioma}</td>
                      {CEFR_SKILLS.map(s => (
                        <td key={s}>
                          {idiomasEditor && l._id ? (
                            <select className={`ep2-celda${l.niveles_confirmados ? '' : ' ep2-celda-pendiente'}`} aria-label={`${l.idioma}: ${CEFR_SKILL_LABELS[s]}`} value={l.niveles![s]}
                              onChange={e => idiomasEditor.onNiveles(l._id!, { ...l.niveles!, [s]: e.target.value as CefrBreakdown[typeof s] })}>
                              {CEFR_LEVELS.filter(v => v !== 'Nativo').map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                          ) : l.niveles![s]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {sinNivel.length > 0 && (
              <p className="otras-lenguas"><b>Otras lenguas:</b> {sinNivel.map(l => l.idioma).join(', ')}</p>
            )}
            {idiomasEditor && sinNivel.filter(l => l._id).map(l => (
              <div className="ep2-capsula" key={`n-${l._id}`} style={{ marginTop: 6 }}>
                <span>Indica tu nivel de {l.idioma.toLowerCase()} para mostrarlo en la tabla:</span>
                <select aria-label={`Nivel de ${l.idioma}`} defaultValue="" onChange={e => e.target.value && idiomasEditor.onNivelGeneral(l._id!, e.target.value)}>
                  <option value="" disabled>Elegir nivel</option>
                  {CEFR_LEVELS.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            ))}
            {certs.length > 0 && (
              <p className="cefr-nota">
                {certs.length > 1 ? 'Certificaciones oficiales' : 'Certificación oficial'}:{' '}
                {certs.map(l => `${l.certificacion.valor} (${l.idioma.toLowerCase()})`).join(' · ')}
              </p>
            )}
          </section>
        )}

        {/* 6. Competencias digitales */}
        {(herramientas.length > 0 || digcomp.activo) && (
          <section>
            <h2 className="section-title">Competencias digitales</h2>
            {herramientas.length > 0 && (
              <div className="chip-list">{herramientas.map(h => <span className="chip" key={h}>{h}</span>)}</div>
            )}
            {digcomp.activo && (
              <div className="digcomp-grid">
                {DIGCOMP_AREAS.map(a => (
                  <div className="digcomp-item" key={a}>
                    <span>{DIGCOMP_AREA_LABELS[a]}</span>
                    <span className="digcomp-nivel">{digcomp[a]}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* 7. Otras competencias */}
        {data.otras_competencias.length > 0 && (
          <section>
            <h2 className="section-title">Otras competencias</h2>
            <div className="chip-list">{data.otras_competencias.map(c => <span className="chip" key={c}>{c}</span>)}</div>
          </section>
        )}

        {/* 8. Permiso de conducir */}
        {permiso.length > 0 && (
          <section>
            <h2 className="section-title">Permiso de conducir</h2>
            <div className="chip-list">{permiso.map(c => <span className="chip" key={c}>{drivingLicenceLabel(c)}</span>)}</div>
          </section>
        )}

        {/* 9. Información adicional */}
        {adicional.length > 0 && (
          <section>
            <h2 className="section-title">Información adicional</h2>
            {adicional.map(k => (
              <div className="subgrupo" key={k}>
                <p className="subgrupo-titulo">{ADICIONAL_LABELS[k]}</p>
                <ul className="bullets">{data.informacion_adicional[k].items.map((t, n) => <li key={n}>{t}</li>)}</ul>
              </div>
            ))}
          </section>
        )}

        {/* 10. Anexos */}
        {anexos.length > 0 && (
          <section>
            <h2 className="section-title">Anexos</h2>
            <div className="anexos-list">
              {anexos.map((a, n) => <div key={n}><span className="num">{n + 1}.</span> {a}</div>)}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
