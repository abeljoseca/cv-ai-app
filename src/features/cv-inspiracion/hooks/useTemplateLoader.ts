'use client'

import { useEffect, useState } from 'react'
import { getTemplateById } from '../templates'
import type { CVTemplate } from '../types/template.types'
import { loadFonts } from '../lib/konva-utils'

export function useTemplateLoader(templateId: string) {
  const [template, setTemplate] = useState<CVTemplate | null>(null)
  const [fontsReady, setFontsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const t = getTemplateById(templateId)
    if (!t) {
      setError(`Plantilla "${templateId}" no encontrada.`)
      return
    }
    setTemplate(t)

    if (t.fonts && t.fonts.length > 0) {
      loadFonts(t.fonts.map(f => ({ ...f, weight: f.weight?.toString() })))
        .then(() => setFontsReady(true))
        .catch(() => setFontsReady(true)) // Degrade gracefully
    } else {
      setFontsReady(true)
    }
  }, [templateId])

  return { template, fontsReady, error }
}