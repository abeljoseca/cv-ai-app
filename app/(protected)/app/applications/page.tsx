'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface Application {
  id: string
  company_name: string
  job_title: string
  application_date: string
  status: string
  notes: string
  created_at: string
}

const statusConfig: Record<string, { label: string; color: string }> = {
  waiting:      { label: 'En espera',     color: 'bg-yellow-100 text-yellow-800' },
  interviewing: { label: 'Entrevistando', color: 'bg-blue-100 text-blue-800' },
  hired:        { label: 'Contratado',    color: 'bg-green-100 text-green-800' },
  rejected:     { label: 'Rechazado',     color: 'bg-red-100 text-red-800' },
  no_response:  { label: 'Sin respuesta', color: 'bg-gray-100 text-gray-800' },
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState('all')
  const [newApp, setNewApp] = useState({
    company_name: '',
    job_title: '',
    application_date: new Date().toISOString().split('T')[0],
    status: 'waiting',
    notes: '',
  })
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadApplications()
  }, [])

  async function loadApplications() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data } = await supabase
      .from('job_applications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (data) setApplications(data)
    setLoading(false)
  }

  async function handleCreate() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('job_applications')
      .insert({ user_id: user.id, ...newApp })
      .select()
      .single()

    if (!error && data) {
      setApplications(prev => [data, ...prev])
      setShowForm(false)
      setNewApp({
        company_name: '',
        job_title: '',
        application_date: new Date().toISOString().split('T')[0],
        status: 'waiting',
        notes: '',
      })
    }
  }

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase
      .from('job_applications')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (!error) {
      setApplications(prev => prev.map(a =>
        a.id === id ? { ...a, status } : a
      ))
    }
  }

  async function deleteApplication(id: string) {
    const { error } = await supabase
      .from('job_applications')
      .delete()
      .eq('id', id)

    if (!error) {
      setApplications(prev => prev.filter(a => a.id !== id))
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const filtered = filter === 'all'
    ? applications
    : applications.filter(a => a.status === filter)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        Cargando aplicaciones...
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Mis Aplicaciones</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + Nueva aplicación
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
          <h2 className="text-sm font-medium text-gray-900 mb-4">Nueva aplicación</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Empresa</label>
                <input
                  type="text"
                  value={newApp.company_name}
                  onChange={e => setNewApp(p => ({ ...p, company_name: e.target.value }))}
                  placeholder="Google"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Puesto</label>
                <input
                  type="text"
                  value={newApp.job_title}
                  onChange={e => setNewApp(p => ({ ...p, job_title: e.target.value }))}
                  placeholder="Frontend Developer"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Fecha de aplicación</label>
                <input
                  type="date"
                  value={newApp.application_date}
                  onChange={e => setNewApp(p => ({ ...p, application_date: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Estado</label>
                <select
                  value={newApp.status}
                  onChange={e => setNewApp(p => ({ ...p, status: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="waiting">En espera</option>
                  <option value="interviewing">Entrevistando</option>
                  <option value="hired">Contratado</option>
                  <option value="rejected">Rechazado</option>
                  <option value="no_response">Sin respuesta</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Notas (opcional)</label>
              <textarea
                value={newApp.notes}
                onChange={e => setNewApp(p => ({ ...p, notes: e.target.value }))}
                placeholder="Contacto, próximos pasos..."
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={!newApp.company_name || !newApp.job_title}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-4 flex-wrap">
        {[
          { value: 'all',          label: 'Todas' },
          { value: 'waiting',      label: 'En espera' },
          { value: 'interviewing', label: 'Entrevistando' },
          { value: 'hired',        label: 'Contratados' },
          { value: 'rejected',     label: 'Rechazados' },
          { value: 'no_response',  label: 'Sin respuesta' },
        ].map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f.value
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          {applications.length === 0
            ? 'Todavía no has registrado ninguna aplicación.'
            : 'No hay aplicaciones en esta categoría.'}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(app => (
            <div key={app.id} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">{app.job_title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {app.company_name} · {formatDate(app.application_date)}
                  </p>
                  {app.notes && (
                    <p className="text-xs text-gray-400 mt-2">{app.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusConfig[app.status]?.color ?? 'bg-gray-100 text-gray-800'}`}>
                    {statusConfig[app.status]?.label ?? app.status}
                  </span>
                  <button
                    onClick={() => deleteApplication(app.id)}
                    className="text-gray-300 hover:text-red-400 transition-colors text-xs"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="mt-3">
                <select
                  value={app.status}
                  onChange={e => updateStatus(app.id, e.target.value)}
                  className="text-xs border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="waiting">En espera</option>
                  <option value="interviewing">Entrevistando</option>
                  <option value="hired">Contratado</option>
                  <option value="rejected">Rechazado</option>
                  <option value="no_response">Sin respuesta</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 
