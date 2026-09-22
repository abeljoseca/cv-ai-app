'use client'

import { useRef } from 'react'
import Link from 'next/link'

interface Props {
  scale: number
  isSaving: boolean
  isExporting: boolean
  canUndo: boolean
  canRedo: boolean
  isAdmin?: boolean
  sidebarOpen?: boolean
  onSave: () => void
  onExport: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onZoomReset: () => void
  onUndo: () => void
  onRedo: () => void
  onImportSVG: (svgText: string) => void
  onExportJSON: () => void
  onSaveTemplate?: () => void
  onToggleSidebar?: () => void
}

export function TopBar({
  scale, isSaving, isExporting,
  canUndo, canRedo,
  isAdmin, sidebarOpen,
  onSave, onExport,
  onZoomIn, onZoomOut, onZoomReset,
  onUndo, onRedo,
  onImportSVG, onExportJSON, onSaveTemplate,
  onToggleSidebar,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') onImportSVG(reader.result)
    }
    reader.readAsText(file)
    e.target.value = ''
  }
  return (
    <div className="flex items-center h-[52px] px-4 bg-white border-b border-[#e8eaed] flex-shrink-0 z-20" style={{ boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
      {onToggleSidebar && (
        <>
          <button
            onClick={onToggleSidebar}
            title={sidebarOpen ? 'Ocultar menú principal' : 'Mostrar menú principal'}
            className="w-8 h-8 flex items-center justify-center rounded-md text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#4B6BFB] transition-colors mr-1 flex-shrink-0"
          >
            {sidebarOpen ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <line x1="9" y1="3" x2="9" y2="21"/>
                <polyline points="5,9 3,12 5,15"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <line x1="9" y1="3" x2="9" y2="21"/>
                <polyline points="13,9 15,12 13,15"/>
              </svg>
            )}
          </button>
          <div className="w-px h-5 bg-[#e8eaed] mr-2" />
        </>
      )}

      <Link
        href="/cvs"
        className="flex items-center gap-1.5 text-sm text-[#64748b] hover:text-[#1A2B4C] transition-colors mr-4"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15,18 9,12 15,6" />
        </svg>
        <span className="font-medium">Mis CVs</span>
      </Link>

      <div className="w-px h-5 bg-[#e8eaed] mr-3" />

      {/* History */}
      <div className="flex items-center gap-0.5 mr-3">
        <TopBtn onClick={onUndo} disabled={!canUndo} title="Deshacer (Ctrl+Z)">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 7v6h6"/><path d="M3 13C4.5 9 8.5 6 13 6a10 10 0 0 1 9 6"/></svg>
        </TopBtn>
        <TopBtn onClick={onRedo} disabled={!canRedo} title="Rehacer (Ctrl+Y)">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 7v6h-6"/><path d="M21 13C19.5 9 15.5 6 11 6a10 10 0 0 0-9 6"/></svg>
        </TopBtn>
      </div>

      {/* Zoom */}
      <div className="flex items-center gap-0.5">
        <TopBtn onClick={onZoomOut} title="Alejar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </TopBtn>
        <button
          onClick={onZoomReset}
          className="px-2 h-7 text-xs font-medium text-[#475569] hover:bg-[#f1f5f9] rounded-md transition-colors min-w-[50px] text-center"
        >
          {Math.round(scale * 100)}%
        </button>
        <TopBtn onClick={onZoomIn} title="Acercar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </TopBtn>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".svg"
          className="hidden"
          onChange={handleFileChange}
        />
        {isAdmin && (
          <>
            {onSaveTemplate && (
              <button
                onClick={onSaveTemplate}
                title="Guardar diseño actual como plantilla en Supabase (solo admin)"
                className="h-8 px-3 text-xs font-medium text-white bg-[#0F9B6A] rounded-lg hover:bg-[#0a8059] transition-colors flex items-center gap-1.5"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/>
                  <polyline points="7 3 7 8 15 8"/>
                </svg>
                Guardar Plantilla
              </button>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Importar SVG como capas editables (solo admin)"
              className="h-8 px-3 text-xs font-medium text-[#475569] border border-[#e2e8f0] rounded-lg hover:bg-[#f8fafc] transition-colors flex items-center gap-1.5"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Importar SVG
            </button>
            <button
              onClick={onExportJSON}
              title="Exportar canvas como JSON compatible con Resumint (solo admin)"
              className="h-8 px-3 text-xs font-medium text-[#475569] border border-[#e2e8f0] rounded-lg hover:bg-[#f8fafc] transition-colors flex items-center gap-1.5"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              Exportar JSON
            </button>
          </>
        )}
        <button
          onClick={onSave}
          disabled={isSaving}
          className="h-8 px-3 text-xs font-medium text-[#475569] border border-[#e2e8f0] rounded-lg hover:bg-[#f8fafc] disabled:opacity-40 transition-colors"
        >
          {isSaving ? 'Guardando…' : 'Guardar'}
        </button>
        <button
          onClick={onExport}
          disabled={isExporting}
          className="h-8 px-4 text-xs font-semibold text-white bg-[#4B6BFB] rounded-lg hover:bg-[#3b5beb] disabled:opacity-50 transition-colors"
          style={{ boxShadow: '0 1px 4px rgba(75,107,251,0.35)' }}
        >
          {isExporting ? 'Generando…' : 'Descargar PDF'}
        </button>
      </div>
    </div>
  )
}

function TopBtn({ children, onClick, disabled, title }: {
  children: React.ReactNode; onClick: () => void; disabled?: boolean; title?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="w-8 h-8 flex items-center justify-center rounded-lg text-[#475569] hover:bg-[#f1f5f9] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
    >
      {children}
    </button>
  )
}