'use client'

interface Props {
  canUndo: boolean
  canRedo: boolean
  isExporting: boolean
  isSaving: boolean
  scale: number
  onUndo: () => void
  onRedo: () => void
  onExport: () => void
  onSave: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onZoomReset: () => void
}

export function Toolbar({
  canUndo, canRedo, isExporting, isSaving, scale,
  onUndo, onRedo, onExport, onSave, onZoomIn, onZoomOut, onZoomReset,
}: Props) {
  return (
    <div className="flex items-center gap-1 px-3 h-11 bg-white border-b border-[#e2e8f0] shadow-sm flex-shrink-0">

      {/* Undo / Redo */}
      <div className="flex items-center gap-0.5 mr-1">
        <IconButton onClick={onUndo} disabled={!canUndo} title="Deshacer (Ctrl+Z)">
          <UndoIcon />
        </IconButton>
        <IconButton onClick={onRedo} disabled={!canRedo} title="Rehacer (Ctrl+Y)">
          <RedoIcon />
        </IconButton>
      </div>

      <Divider />

      {/* Zoom */}
      <div className="flex items-center gap-0.5">
        <IconButton onClick={onZoomOut} title="Alejar">
          <MinusIcon />
        </IconButton>
        <button
          onClick={onZoomReset}
          className="px-2 py-1 text-xs font-medium text-[#475569] hover:bg-[#f1f5f9] rounded transition-colors min-w-[48px] text-center"
          title="Restablecer zoom"
        >
          {Math.round(scale * 100)}%
        </button>
        <IconButton onClick={onZoomIn} title="Acercar">
          <PlusIcon />
        </IconButton>
      </div>

      <Divider />

      {/* Save */}
      <button
        onClick={onSave}
        disabled={isSaving}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#475569] border border-[#e2e8f0] rounded-md hover:bg-[#f8fafc] disabled:opacity-40 transition-colors"
      >
        <SaveIcon />
        {isSaving ? 'Guardando…' : 'Guardar'}
      </button>

      {/* Export — pushed to the right */}
      <button
        onClick={onExport}
        disabled={isExporting}
        className="ml-auto flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-[#4B6BFB] rounded-md hover:bg-[#3b5beb] disabled:opacity-50 transition-colors shadow-sm"
      >
        <DownloadIcon />
        {isExporting ? 'Generando PDF…' : 'Descargar PDF'}
      </button>
    </div>
  )
}

function IconButton({ onClick, disabled, title, children }: {
  onClick: () => void
  disabled?: boolean
  title?: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="w-7 h-7 flex items-center justify-center rounded text-[#475569] hover:bg-[#f1f5f9] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div className="w-px h-5 bg-[#e2e8f0] mx-1" />
}

function UndoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7v6h6" /><path d="M3 13C4.5 9 8.5 6 13 6a10 10 0 0 1 9 6" />
    </svg>
  )
}

function RedoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 7v6h-6" /><path d="M21 13C19.5 9 15.5 6 11 6a10 10 0 0 0-9 6" />
    </svg>
  )
}

function MinusIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12" /></svg>
}

function PlusIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
}

function SaveIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17,21 17,13 7,13 7,21" /><polyline points="7,3 7,8 15,8" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7,10 12,15 17,10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}