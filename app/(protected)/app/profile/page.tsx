'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  const [message, setMessage] = useState('')
  const [importMessage, setImportMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data } = await supabase
      .from('profiles')
      .select('first_name, last_name, phone, location, linkedin_url')
      .eq('id', user.id)
      .single()

    if (data) {
      setFirstName(data.first_name || '')
      setLastName(data.last_name || '')
      setPhone(data.phone || '')
      setLocation(data.location || '')
      setLinkedinUrl(data.linkedin_url || '')
    }

    setLoading(false)
  }

  async function handleSave() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setSaving(true)
    setMessage('')

    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: firstName,
        last_name: lastName,
        phone,
        location,
        linkedin_url: linkedinUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (error) {
      setMessage('Error al guardar. Intenta de nuevo.')
    } else {
      setMessage('Perfil guardado correctamente.')
    }

    setSaving(false)
  }

  async function handlePDFImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    setImportMessage('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/import-pdf', {
        method: 'POST',
        body: formData,
      })

      const result = await res.json()

      if (!res.ok) {
        setImportMessage(`Error: ${result.error}`)
        return
      }

      const campos = result.campos_encontrados?.join(', ') ?? ''
      setImportMessage(`Listo. Se importó: ${campos}.`)

    } catch {
      setImportMessage('Error procesando el archivo. Intenta de nuevo.')
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        Cargando perfil...
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">Mi Perfil</h1>
      <p className="text-gray-500 text-sm mb-8">Estos datos aparecerán en tus CVs generados.</p>

      {/* Importar PDF */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <p className="text-sm font-medium text-blue-900 mb-1">Importar desde PDF</p>
        <p className="text-xs text-blue-700 mb-3">
          Sube tu perfil de LinkedIn en PDF o un CV anterior para importar tu experiencia automáticamente.
        </p>
        <label className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
          importing
            ? 'bg-blue-200 text-blue-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}>
          {importing ? 'Procesando...' : '⬆ Subir PDF'}
          <input
            type="file"
            accept=".pdf"
            onChange={handlePDFImport}
            disabled={importing}
            className="hidden"
          />
        </label>
        {importMessage && (
          <p className={`text-xs mt-2 ${
            importMessage.startsWith('Error')
              ? 'text-red-600'
              : 'text-green-700'
          }`}>
            {importMessage}
          </p>
        )}
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              type="text"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              placeholder="Abel"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
            <input
              type="text"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              placeholder="Colmenares"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
          <input
            type="text"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="+58 412 000 0000"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad y país</label>
          <input
            type="text"
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder="Caracas, Venezuela"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
          <input
            type="text"
            value={linkedinUrl}
            onChange={e => setLinkedinUrl(e.target.value)}
            placeholder="https://linkedin.com/in/tu-perfil"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {message && (
          <div className={`text-sm px-4 py-3 rounded-xl ${
            message.includes('Error')
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}>
            {message}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-blue-600 text-white rounded-xl py-3 text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>

        <hr className="my-4 border-gray-200" />

        <button
          onClick={handleSignOut}
          className="w-full border border-gray-300 text-gray-700 rounded-xl py-3 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}