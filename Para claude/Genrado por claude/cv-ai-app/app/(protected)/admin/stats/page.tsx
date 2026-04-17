'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface Stats {
  totalUsers: number
  totalCVs: number
  totalApplications: number
  cvsPerTemplate: Record<string, number>
  applicationsByStatus: Record<string, number>
}

export default function AdminStatsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    const { count: totalCVs } = await supabase
      .from('cvs')
      .select('*', { count: 'exact', head: true })

    const { count: totalApplications } = await supabase
      .from('job_applications')
      .select('*', { count: 'exact', head: true })

    const { data: cvTemplates } = await supabase
      .from('cvs')
      .select('template_used')

    const cvsPerTemplate: Record<string, number> = {}
    cvTemplates?.forEach(cv => {
      const t = cv.template_used ?? 'harvard'
      cvsPerTemplate[t] = (cvsPerTemplate[t] ?? 0) + 1
    })

    const { data: applications } = await supabase
      .from('job_applications')
      .select('status')

    const applicationsByStatus: Record<string, number> = {}
    applications?.forEach(app => {
      const s = app.status ?? 'waiting'
      applicationsByStatus[s] = (applicationsByStatus[s] ?? 0) + 1
    })

    setStats({
      totalUsers: totalUsers ?? 0,
      totalCVs: totalCVs ?? 0,
      totalApplications: totalApplications ?? 0,
      cvsPerTemplate,
      applicationsByStatus,
    })

    setLoading(false)
  }

  const statusLabels: Record<string, string> = {
    waiting: 'En espera',
    interviewing: 'Entrevistando',
    hired: 'Contratado',
    rejected: 'Rechazado',
    no_response: 'Sin respuesta',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        Cargando estadísticas...
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Estadísticas globales</h1>
        <button
          onClick={() => router.push('/admin/users')}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Ver usuarios
        </button>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-5 text-center">
          <p className="text-3xl font-semibold text-gray-900">{stats?.totalUsers}</p>
          <p className="text-xs text-gray-500 mt-1">Usuarios registrados</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 text-center">
          <p className="text-3xl font-semibold text-gray-900">{stats?.totalCVs}</p>
          <p className="text-xs text-gray-500 mt-1">CVs generados</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 text-center">
          <p className="text-3xl font-semibold text-gray-900">{stats?.totalApplications}</p>
          <p className="text-xs text-gray-500 mt-1">Aplicaciones registradas</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Templates más usados */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-medium text-gray-900 mb-4">CVs por template</h2>
          {Object.keys(stats?.cvsPerTemplate ?? {}).length === 0 ? (
            <p className="text-sm text-gray-400">Sin datos aún</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(stats?.cvsPerTemplate ?? {}).map(([template, count]) => (
                <div key={template} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 capitalize">{template}</span>
                  <span className="text-sm font-medium text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Aplicaciones por estado */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-medium text-gray-900 mb-4">Aplicaciones por estado</h2>
          {Object.keys(stats?.applicationsByStatus ?? {}).length === 0 ? (
            <p className="text-sm text-gray-400">Sin datos aún</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(stats?.applicationsByStatus ?? {}).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{statusLabels[status] ?? status}</span>
                  <span className="text-sm font-medium text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 
