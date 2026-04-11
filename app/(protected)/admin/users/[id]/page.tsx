 'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'

interface Profile {
  id: string
  email: string
  first_name: string
  last_name: string
  phone: string
  location: string
  linkedin_url: string
  role: string
  created_at: string
}

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

export default function AdminUserDetailPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [cvs, setCvs] = useState<CV[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string

  useEffect(() => {
    loadUser()
  }, [userId])

  async function loadUser() {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileData) setProfile(profileData)

    const { data: cvsData } = await supabase
      .from('cvs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (cvsData) setCvs(cvsData)

    setLoading(false)
  }

  async function updateRole(role: string) {
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId)

    if (!error && profile) {
      setProfile({ ...profile, role })
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
        Cargando usuario...
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        Usuario no encontrado.
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto py-6">
      <button
        onClick={() => router.push('/admin/users')}
        className="text-sm text-gray-500 hover:text-gray-700 mb-6 flex items-center gap-1"
      >
        ← Volver a usuarios
      </button>

      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {profile.first_name || profile.last_name
                ? `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim()
                : 'Sin nombre'}
            </h1>
            <p className="text-sm text-gray-500">{profile.email}</p>
          </div>
          <select
            value={profile.role ?? 'user'}
            onChange={e => updateRole(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-400 mb-1">Teléfono</p>
            <p className="text-gray-700">{profile.phone || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Ubicación</p>
            <p className="text-gray-700">{profile.location || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">LinkedIn</p>
            <p className="text-gray-700">{profile.linkedin_url || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Registro</p>
            <p className="text-gray-700">{formatDate(profile.created_at)}</p>
          </div>
        </div>
      </div>

      <h2 className="text-sm font-medium text-gray-900 mb-3">CVs generados ({cvs.length})</h2>

      {cvs.length === 0 ? (
        <p className="text-sm text-gray-400">Este usuario no ha generado CVs aún.</p>
      ) : (
        <div className="space-y-3">
          {cvs.map(cv => (
            <div key={cv.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="font-medium text-gray-900 text-sm">{cv.job_title_applied || 'Sin título'}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {cv.company_name || 'Sin empresa'} · {formatDate(cv.created_at)} · {cv.template_used}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
