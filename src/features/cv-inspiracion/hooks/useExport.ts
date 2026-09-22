'use client'

import { useState, useCallback } from 'react'
import type { TemplateDataMarkers } from '../types/template.types'
import { getHTMLTemplateById } from '../templates'
import { exportCVToPDF } from '../lib/pdf-exporter'

export function useExport(templateId: string) {
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const exportToPDF = useCallback(async (data: TemplateDataMarkers, filename?: string) => {
    const html = getHTMLTemplateById(templateId)
    if (!html) {
      setError('Plantilla HTML no disponible para exportar.')
      return
    }
    setIsExporting(true)
    setError(null)
    try {
      await exportCVToPDF(html, data, filename ?? 'cv.pdf')
    } catch (e) {
      setError('Error al generar el PDF. Inténtalo de nuevo.')
      console.error(e)
    } finally {
      setIsExporting(false)
    }
  }, [templateId])

  return { exportToPDF, isExporting, error }
}