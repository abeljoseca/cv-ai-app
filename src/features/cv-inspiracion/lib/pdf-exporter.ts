'use client'

import type { TemplateDataMarkers } from '../types/template.types'
import { injectDataIntoHTML } from './data-injector'

export async function exportCVToPDF(
  htmlTemplate: string,
  data: TemplateDataMarkers,
  filename = 'cv.pdf'
): Promise<void> {
  const injectedHTML = injectDataIntoHTML(htmlTemplate, data)

  // Render in hidden iframe to get accurate font rendering
  const iframe = document.createElement('iframe')
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:595.5px;height:842.25px;border:none;'
  document.body.appendChild(iframe)

  try {
    const iframeDoc = iframe.contentDocument!
    iframeDoc.open()
    iframeDoc.write(injectedHTML)
    iframeDoc.close()

    // Wait for fonts and images
    await new Promise(resolve => setTimeout(resolve, 800))
    await iframeDoc.fonts.ready

    const { default: html2canvas } = await import('html2canvas')
    const { default: jsPDF } = await import('jspdf')

    const canvas = await html2canvas(iframeDoc.body, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      width: 595.5,
      height: 842.25,
    })

    const imgData = canvas.toDataURL('image/png', 1.0)
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [595.5, 842.25] })
    pdf.addImage(imgData, 'PNG', 0, 0, 595.5, 842.25)
    pdf.save(filename)
  } finally {
    document.body.removeChild(iframe)
  }
}