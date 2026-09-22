'use client'

import { useEffect, useState } from 'react'
import { templates } from '../../templates'
import { listPublishedTemplates } from '../../lib/supabase-cv-service'
import { TemplateCard } from './TemplateCard'
import type { SupabaseTemplate } from '../../types/template.types'

interface Props {
  onSelect: (templateId: string) => void
}

export function TemplateGallery({ onSelect }: Props) {
  const [supabaseTemplates, setSupabaseTemplates] = useState<SupabaseTemplate[]>([])
  const [loadingRemote, setLoadingRemote] = useState(true)

  useEffect(() => {
    listPublishedTemplates()
      .then(setSupabaseTemplates)
      .finally(() => setLoadingRemote(false))
  }, [])

  // Supabase templates take priority; TypeScript fallback fills the rest
  const supabaseIds = new Set(supabaseTemplates.map(t => t.id))
  const fallbackTemplates = templates.filter(t => !supabaseIds.has(t.id))

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[var(--color-primary)] tracking-tight">
          Elige una plantilla
        </h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          Selecciona el diseño base y personaliza cada detalle en el editor.
        </p>
      </div>

      {loadingRemote ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-7 h-7 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {supabaseTemplates.map(t => (
            <TemplateCard
              key={t.id}
              template={{ id: t.id, name: t.name, description: t.description ?? '', thumbnail: t.thumbnail_url, canvasWidth: t.canvas_state.canvasWidth, canvasHeight: t.canvas_state.canvasHeight, layers: t.canvas_state.layers }}
              onSelect={onSelect}
            />
          ))}
          {fallbackTemplates.map(t => (
            <TemplateCard key={t.id} template={t} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  )
}