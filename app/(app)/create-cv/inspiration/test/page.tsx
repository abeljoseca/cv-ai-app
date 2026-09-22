'use client'

// Sprint 0 validation page: verifies Konva renders without SSR errors,
// fonts load via FontFace API, and mouse interaction works.
import dynamic from 'next/dynamic'
import { useState } from 'react'

const KonvaTestCanvas = dynamic(() => import('./KonvaTestCanvas'), { ssr: false })

export default function KonvaTestPage() {
  return (
    <div className="min-h-screen bg-[var(--color-surface)] p-10">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-xl font-semibold text-[var(--color-primary)] mb-2">
          Konva SSR Test — Sprint 0
        </h1>
        <p className="text-sm text-[var(--color-muted)] mb-6">
          Esta página valida que react-konva renderiza correctamente con Next.js App Router (SSR desactivado).
          Haz clic en los rectángulos para probar la interacción.
        </p>
        <div className="bg-white rounded-xl shadow-sm p-6 inline-block">
          <KonvaTestCanvas />
        </div>
      </div>
    </div>
  )
}