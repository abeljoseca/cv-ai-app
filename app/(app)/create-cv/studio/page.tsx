'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { TemplateGallery } from '@/src/features/cv-inspiracion/components/gallery/TemplateGallery'
import { createCVInspiración } from '@/src/features/cv-inspiracion/lib/supabase-cv-service'
import { getTemplateById } from '@/src/features/cv-inspiracion/templates'
import { templateToCanvasState } from '@/src/features/cv-inspiracion/lib/template-parser'
import type { CanvasState } from '@/src/features/cv-inspiracion/types/canvas.types'

export default function InspiracioGalleryPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
    })
  }, [router])

  async function handleTemplateSelect(templateId: string) {
    if (!userId) return

    setIsCreating(true)
    setCreateError(null)
    try {
      // Chequeo previo para no depender del texto crudo del error de RLS —
      // CV Studio inserta directo desde el cliente, así que estas reglas se
      // aplican también a nivel de política, pero acá damos el mensaje
      // correcto en vez de dejar pasar "new row violates row-level security policy".
      const supabaseCheck = createClient()
      const [{ data: tieneCvSinPagar }, { data: sinCreditos }] = await Promise.all([
        supabaseCheck.rpc('user_has_unpaid_cv', { p_user_id: userId }),
        supabaseCheck.rpc('user_free_generations_exhausted', { p_user_id: userId }),
      ])
      if (tieneCvSinPagar) {
        setCreateError('Ya tienes un CV sin pagar. Complétalo para poder crear uno nuevo.')
        setIsCreating(false)
        return
      }
      if (sinCreditos) {
        setCreateError('Ya alcanzaste el límite de CVs gratis. Hazte Pro para continuar creando CVs y encuentra ese trabajo deseado.')
        setIsCreating(false)
        return
      }

      let initialState: CanvasState

      // Try TypeScript templates first (legacy), then Supabase
      const tsTemplate = getTemplateById(templateId)
      if (tsTemplate) {
        initialState = templateToCanvasState(tsTemplate)
      } else {
        // Supabase template: canvas_state is already a CanvasState
        const supabase = createClient()
        const { data, error } = await supabase
          .from('cv_templates')
          .select('canvas_state')
          .eq('id', templateId)
          .single()
        if (error || !data) throw new Error('Plantilla no encontrada')
        initialState = data.canvas_state as CanvasState
      }

      const record = await createCVInspiración(userId, templateId, initialState)
      router.push(`/create-cv/studio/editor/${record.id}`)
    } catch (e) {
      const msg = e instanceof Error ? e.message : JSON.stringify(e)
      console.error('Error al crear CV inspiración:', e)
      setCreateError(`Error: ${msg}`)
      setIsCreating(false)
    }
  }

  if (isCreating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-[var(--color-muted)]">Creando tu CV…</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {createError && (
        <div className="mx-auto max-w-2xl mt-6 px-4">
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {createError}
          </div>
        </div>
      )}
      <TemplateGallery onSelect={handleTemplateSelect} />
    </>
  )
}