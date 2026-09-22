// Avoids showing an education "area" subtitle that just repeats a phrase already
// present in the degree/course title (e.g. titulo "Asistencia Virtual con enfoque
// en Análisis de Datos" + area "Análisis de Datos" — same idea said twice).
function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}

export function shouldShowArea(titulo: string | null | undefined, area: string | null | undefined): boolean {
  if (!area || !area.trim()) return false
  if (!titulo) return true
  return !normalize(titulo).includes(normalize(area))
}
