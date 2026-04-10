'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface CV {
  id: string
  title: string
  job_title_applied: string
  company_name: string
  template_used: string
  created_at: string
  applied: boolean
  application_result: string
}

const resultLabels: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Pendiente',     color: 'bg-yellow-100 text-yellow-800' },
  interview: { label: 'En entrevista', color: 'bg-blue-100 text-blue-800' },
  hired:     { label: 'Contratado',    color: 'bg-green-100 text-green-800' },
  rejected:  { label: 'Rechazado',     color: 'bg-red-100 text-red-800' },
  no_response: { label: 'Sin respuesta', color: 'bg-gray-100 text-gray-800' },
}

export default function CVsPage() {
  const [cvs, setCvs] = useState<CV[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadCVs()
  }, [])

  async function loadCVs() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data } = await supabase
      .from('cvs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (data) setCvs(data)
    setLoading(false)
  }

  async function toggleApplied(cv: CV) {
    const { error } = await supabase
      .from('cvs')
      .update({ applied: !cv.applied })
      .eq('id', cv.id)

    if (!error) {
      setCvs(prev => prev.map(c =>
        c.id === cv.id ? { ...c, applied: !c.applied } : c
      ))
    }
  }

  async function updateResult(cv: CV, result: string) {
    const { error } = await supabase
      .from('cvs')
      .update({ application_result: result })
      .eq('id', cv.id)

    if (!error) {
      setCvs(prev => prev.map(c =>
        c.id === cv.id ? { ...c, application_result: result } : c
      ))
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        Cargando CVs...
      </div>
    )
  }

  if (cvs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
        <p className="text-gray-500">Todavía no has generado ningún CV.</p>
        <button
          onClick={() => router.push('/app/apply')}
          className="bg-blue-600 text-white rounded-xl px-6 py-3 text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Generar mi primer CV
        </button>
      </div>
    )
  }

  const totalCVs = cvs.length
  const applied = cvs.filter(c => c.applied).length
  const interviews = cvs.filter(c => c.application_result === 'interview' || c.application_result === 'hired').length

  return (
    <div className="max-w-3xl mx-auto py-6">
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">Mis CVs</h1>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-semibold text-gray-900">{totalCVs}</p>
          <p className="text-xs text-gray-500 mt-1">CVs generados</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-semibold text-gray-900">{applied}</p>
          <p className="text-xs text-gray-500 mt-1">Aplicaciones enviadas</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-semibold text-gray-900">{interviews}</p>
          <p className="text-xs text-gray-500 mt-1">Entrevistas o más</p>
        </div>
      </div>

      {/* Lista de CVs */}
      <div className="space-y-3">
        {cvs.map(cv => (
          <div key={cv.id} className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">{cv.job_title_applied || 'Sin título'}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {cv.company_name || 'Sin empresa'} · {formatDate(cv.created_at)} · {cv.template_used}
                </p>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${resultLabels[cv.application_result]?.color ?? 'bg-gray-100 text-gray-800'}`}>
                {resultLabels[cv.application_result]?.label ?? 'Pendiente'}
              </span>
            </div>

            <div className="flex items-center gap-4 mt-4">
              {/* Toggle aplicado */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cv.applied}
                  onChange={() => toggleApplied(cv)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600"
                />
                <span className="text-xs text-gray-600">Apliqué con este CV</span>
              </label>

              {/* Selector de resultado */}
              {cv.applied && (
                <select
                  value={cv.application_result}
                  onChange={e => updateResult(cv, e.target.value)}
                  className="text-xs border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Pendiente</option>
                  <option value="interview">En entrevista</option>
                  <option value="hired">Contratado</option>
                  <option value="rejected">Rechazado</option>
                  <option value="no_response">Sin respuesta</option>
                </select>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}