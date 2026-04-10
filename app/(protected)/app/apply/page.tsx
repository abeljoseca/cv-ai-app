'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Template = 'harvard'
type Step = 'form' | 'loading' | 'done' | 'error'

export default function ApplyPage() {
  const [jobDescription, setJobDescription] = useState('')
  const [template, setTemplate] = useState<Template>('harvard')
  const [step, setStep] = useState<Step>('form')
  const [loadingMessage, setLoadingMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const router = useRouter()

  async function handleGenerate() {
    if (!jobDescription.trim()) return

    setStep('loading')
    setLoadingMessage('Analizando la oferta laboral...')

    try {
      // Paso 1: Generar CV en JSON
      const cvResponse = await fetch('/api/generate-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription, template }),
      })

      const cvResult = await cvResponse.json()

      if (!cvResponse.ok) {
        if (cvResult.error === 'perfil_incompleto') {
          setErrorMessage(cvResult.message)
          setStep('error')
          return
        }
        throw new Error(cvResult.error)
      }

      setLoadingMessage('Generando tu CV personalizado...')

      // Paso 2: Generar DOCX
      const docxResponse = await fetch('/api/generate-docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvData: cvResult.cvData, template }),
      })

      if (!docxResponse.ok) {
        throw new Error('Error generando el documento')
      }

      setLoadingMessage('Preparando descarga...')

      // Paso 3: Descargar el archivo
      const blob = await docxResponse.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `CV_${cvResult.cvData.nombre_completo?.replace(/\s+/g, '_') ?? 'CV'}.docx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setStep('done')

    } catch (error) {
      console.error(error)
      setErrorMessage('Hubo un problema generando tu CV. Intenta de nuevo.')
      setStep('error')
    }
  }

  if (step === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-600 text-sm">{loadingMessage}</p>
      </div>
    )
  }

  if (step === 'done') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 max-w-md mx-auto text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <span className="text-green-600 text-3xl">✓</span>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">¡Tu CV está listo!</h2>
          <p className="text-gray-500 text-sm">El archivo se descargó automáticamente. Revísalo en tu carpeta de descargas.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { setStep('form'); setJobDescription('') }}
            className="px-4 py-2 border border-gray-300 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Generar otro CV
          </button>
          <button
            onClick={() => router.push('/app/chat')}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Volver al chat
          </button>
        </div>
      </div>
    )
  }

  if (step === 'error') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 max-w-md mx-auto text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
          <span className="text-red-600 text-3xl">!</span>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Algo salió mal</h2>
          <p className="text-gray-500 text-sm">{errorMessage}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setStep('form')}
            className="px-4 py-2 border border-gray-300 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Intentar de nuevo
          </button>
          <button
            onClick={() => router.push('/app/chat')}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Ir al chat
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">Aplicar a un trabajo</h1>
      <p className="text-gray-500 text-sm mb-8">Pega la oferta laboral y te generamos un CV optimizado para esa vacante.</p>

      {/* Selector de template */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Formato del CV</label>
        <div className="grid grid-cols-1 gap-3">
          <div
            onClick={() => setTemplate('harvard')}
            className={`border-2 rounded-xl p-4 cursor-pointer transition-colors ${
              template === 'harvard'
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                template === 'harvard' ? 'border-blue-600' : 'border-gray-300'
              }`}>
                {template === 'harvard' && (
                  <div className="w-2 h-2 rounded-full bg-blue-600" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Harvard</p>
                <p className="text-xs text-gray-500">Una columna, texto puro, máxima compatibilidad ATS</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Textarea para la oferta */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Oferta laboral
        </label>
        <textarea
          value={jobDescription}
          onChange={e => setJobDescription(e.target.value)}
          placeholder="Pega aquí el texto completo de la oferta de trabajo..."
          rows={12}
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <p className="text-xs text-gray-400 mt-1">
          Mientras más completa sea la oferta, mejor optimizado quedará tu CV.
        </p>
      </div>

      <button
        onClick={handleGenerate}
        disabled={!jobDescription.trim()}
        className="w-full bg-blue-600 text-white rounded-xl py-3 text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Generar CV
      </button>
    </div>
  )
}