import type { CVTemplate } from '../types/template.types'
import { plantillaCorporativa, plantillaCorporativaHTMLTemplate } from './plantilla-corporativa'
import { corporativaPrueba } from './corporativa-prueba-v1'
import { testFuncional } from './test-funcional-v1'
import { cvPlantillaBlanca } from './cv-plantilla-blanca-v1'

export const templates: CVTemplate[] = [plantillaCorporativa, corporativaPrueba, testFuncional, cvPlantillaBlanca]

export function getTemplateById(id: string): CVTemplate | null {
  return templates.find(t => t.id === id) ?? null
}

export function getHTMLTemplateById(id: string): string | null {
  if (id === 'corporativa-v1') return plantillaCorporativaHTMLTemplate
  return null
}

export { plantillaCorporativa, plantillaCorporativaHTMLTemplate }