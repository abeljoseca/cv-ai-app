'use client'

import { useState, useEffect } from 'react'
import type { CanvasState } from '../../types/canvas.types'

interface Props {
  state: CanvasState
  currentPageIdx: number
  onClose: () => void
}

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function ExportTemplateModal({ state, currentPageIdx, onClose }: Props) {
  const [name, setName]               = useState('')
  const [description, setDescription] = useState('')
  const [templateId, setTemplateId]   = useState('')

  useEffect(() => {
    setTemplateId(name ? `${slugify(name)}-v1` : '')
  }, [name])

  function handleExport() {
    const varName = name
      ? name.replace(/(?:^|\s+)(\w)/g, (_, c: string) => c.toUpperCase()).replace(/\s+/g, '').replace(/^(.)/, (c: string) => c.toLowerCase())
      : 'miPlantilla'

    const activeLayers = state.pages
      ? (state.pages[currentPageIdx]?.layers ?? state.layers)
      : state.layers

    const template = {
      id: templateId || 'plantilla-v1',
      name: name || 'Mi Plantilla',
      description,
      canvasWidth: state.canvasWidth,
      canvasHeight: state.canvasHeight,
      layers: activeLayers,
    }

    const ts = [
      `import type { CVTemplate } from '../types/template.types'`,
      ``,
      `export const ${varName}: CVTemplate = ${JSON.stringify(template, null, 2)}`,
    ].join('\n')

    const blob = new Blob([ts], { type: 'text/plain' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `${templateId || 'plantilla-v1'}.ts`
    a.click()
    URL.revokeObjectURL(url)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-[#e8eaed]">
          <h2 className="text-[15px] font-semibold text-[#1A2B4C]">Exportar como plantilla</h2>
          <p className="text-xs text-[#64748b] mt-0.5">Genera un archivo <code>.ts</code> listo para pegar en <code>/templates/</code></p>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-[#475569] mb-1.5">Nombre de la plantilla</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="ej. Corporativa Moderna"
              className="w-full h-9 px-3 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4B6BFB] focus:ring-1 focus:ring-[#4B6BFB]/30 transition-colors"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#475569] mb-1.5">Descripción corta</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="ej. Diseño limpio para perfiles ejecutivos"
              className="w-full h-9 px-3 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4B6BFB] focus:ring-1 focus:ring-[#4B6BFB]/30 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#475569] mb-1.5">ID de plantilla</label>
            <input
              type="text"
              value={templateId}
              onChange={e => setTemplateId(e.target.value)}
              placeholder="se genera automáticamente"
              className="w-full h-9 px-3 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4B6BFB] focus:ring-1 focus:ring-[#4B6BFB]/30 transition-colors font-mono text-[#475569]"
            />
            <p className="text-[11px] text-[#94a3b8] mt-1">Editable. Se usa como clave única en el sistema.</p>
          </div>
        </div>

        <div className="px-6 pb-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="h-9 px-4 text-sm font-medium text-[#475569] border border-[#e2e8f0] rounded-lg hover:bg-[#f8fafc] transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleExport}
            disabled={!name.trim()}
            className="h-9 px-4 text-sm font-semibold text-white bg-[#4B6BFB] rounded-lg hover:bg-[#3b5beb] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Descargar .ts
          </button>
        </div>
      </div>
    </div>
  )
}