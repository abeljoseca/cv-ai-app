// Client helper: asks the server to render the CV as PDF and saves the file.
// Throws with a user-facing Spanish message when the server refuses or fails.
export async function downloadCvPdf(cvId: string): Promise<void> {
  const res = await fetch(`/api/cv/${cvId}/pdf`)
  if (!res.ok) {
    let message = 'No se pudo generar el PDF. Inténtalo de nuevo.'
    try {
      const body = await res.json()
      if (typeof body?.error === 'string') message = body.error
    } catch { /* non-JSON error body */ }
    throw new Error(message)
  }

  const blob = await res.blob()
  const disposition = res.headers.get('Content-Disposition') ?? ''
  const match = /filename\*=UTF-8''([^;]+)/.exec(disposition)
  const fileName = match ? decodeURIComponent(match[1]) : 'CV.pdf'

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
