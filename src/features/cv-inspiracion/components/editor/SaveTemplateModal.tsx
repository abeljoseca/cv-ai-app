'use client'

import { useState } from 'react'
import { saveTemplate, updateTemplate } from '../../lib/supabase-cv-service'
import type { CanvasState } from '../../types/canvas.types'

interface Props {
  state: CanvasState
  existingTemplateId?: string
  onClose: () => void
  onSaved: (id: string) => void
}

export function SaveTemplateModal({ state, existingTemplateId, onClose, onSaved }: Props) {
  const [name, setName]               = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState<string | null>(null)

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    setError(null)
    try {
      let id: string
      if (existingTemplateId) {
        await updateTemplate(existingTemplateId, { name: name.trim(), description: description.trim(), canvas_state: state })
        id = existingTemplateId
      } else {
        id = await saveTemplate(name.trim(), description.trim(), state)
      }
      onSaved(id)
      onClose()
    } catch (e) {
      const msg =
        e instanceof Error ? e.message
        : typeof e === 'object' && e !== null && 'message' in e ? String((e as any).message)
        : JSON.stringify(e)
      setError(msg || 'Error desconocido')
      console.error('[SaveTemplate]', e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-[#e8eaed]">
          <h2 className="text-[15px] font-semibold text-[#1A2B4C]">
            {existingTemplateId ? 'Actualizar plantilla' : 'Guardar como plantilla'}
          </h2>
          <p className="text-xs text-[#64748b] mt-0.5">Se guardará en Supabase y estará disponible en la galería cuando la publiques.</p>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-[#475569] mb-1.5">Nombre de la plantilla *</label>
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

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 break-all whitespace-pre-wrap">{error}</p>
          )}
        </div>

        <div className="px-6 pb-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={saving}
            className="h-9 px-4 text-sm font-medium text-[#475569] border border-[#e2e8f0] rounded-lg hover:bg-[#f8fafc] disabled:opacity-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="h-9 px-4 text-sm font-semibold text-white bg-[#4B6BFB] rounded-lg hover:bg-[#3b5beb] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {saving && <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
            {saving ? 'Guardando...' : existingTemplateId ? 'Actualizar' : 'Guardar plantilla'}
          </button>
        </div>
      </div>
    </div>
  )
}