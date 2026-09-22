'use client'

import type { CVTemplate } from '../../types/template.types'

interface Props {
  template: CVTemplate
  onSelect: (id: string) => void
}

export function TemplateCard({ template, onSelect }: Props) {
  return (
    <button
      onClick={() => onSelect(template.id)}
      className="group flex flex-col overflow-hidden rounded-xl border border-[var(--color-border)] bg-white hover:border-[var(--color-accent)] hover:shadow-md transition-all text-left"
    >
      <div className="aspect-[595/842] w-full bg-[var(--color-surface)] flex items-center justify-center overflow-hidden">
        {template.thumbnail ? (
          <img src={template.thumbnail} alt={template.name} className="w-full h-full object-cover" />
        ) : (
          <TemplateMiniPreview />
        )}
      </div>
      <div className="p-3">
        <p className="text-sm font-semibold text-[var(--color-primary)] group-hover:text-[var(--color-accent)] transition-colors">
          {template.name}
        </p>
        <p className="text-xs text-[var(--color-muted)] mt-0.5 line-clamp-2">{template.description}</p>
      </div>
    </button>
  )
}

function TemplateMiniPreview() {
  return (
    <div className="w-full h-full flex" style={{ background: '#f8f8f8' }}>
      <div style={{ width: '43%', background: '#444444' }} />
      <div className="flex-1 p-2 flex flex-col gap-1">
        <div className="h-1.5 w-3/4 bg-gray-300 rounded" />
        <div className="h-1 w-1/2 bg-gray-200 rounded" />
        <div className="mt-1 h-1 w-full bg-gray-200 rounded" />
        <div className="h-1 w-full bg-gray-200 rounded" />
        <div className="h-1 w-2/3 bg-gray-200 rounded" />
      </div>
    </div>
  )
}