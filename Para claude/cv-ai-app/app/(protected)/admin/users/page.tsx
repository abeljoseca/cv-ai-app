 'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface UserData {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  created_at: string
  cv_count: number
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, role, created_at, email')
      .order('created_at', { ascending: false })

    if (!profiles) {
      setLoading(false)
      return
    }

    const usersWithCVs = await Promise.all(
      profiles.map(async (profile) => {
        const { count } = await supabase
          .from('cvs')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', profile.id)

        return {
          ...profile,
          cv_count: count ?? 0,
        }
      })
    )

    setUsers(usersWithCVs)
    setLoading(false)
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const filtered = users.filter(u =>
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.first_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.last_name?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        Cargando usuarios...
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Usuarios</h1>
          <p className="text-sm text-gray-500 mt-1">{users.length} usuarios registrados</p>
        </div>
        <button
          onClick={() => router.push('/admin/stats')}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Ver estadísticas
        </button>
      </div>

      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Buscar por nombre o email"
        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
      />

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Usuario</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Rol</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">CVs</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Registro</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user, i) => (
              <tr
                key={user.id}
                className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                  i === filtered.length - 1 ? 'border-b-0' : ''
                }`}
                onClick={() => router.push(`/admin/users/${user.id}`)}
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">
                    {user.first_name || user.last_name
                      ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim()
                      : 'Sin nombre'}
                  </p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    user.role === 'admin'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role ?? 'user'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-700">{user.cv_count}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(user.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
