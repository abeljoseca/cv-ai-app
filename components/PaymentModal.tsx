'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import QRCode from 'react-qr-code'
import type { CryptoNetwork } from '@/types'
import { NETWORK_LABELS, NETWORK_FEES, NETWORK_COLORS } from '@/lib/nowpayments'

interface PaymentModalProps {
  cvId?: string
  cvInspirationId?: string
  onSuccess: () => void
  onClose: () => void
}

interface PaymentData {
  payment_id: string
  nowpayments_payment_id: string
  direccion_wallet: string
  monto_cripto: number
  expiration_estimate_date: string
  red: CryptoNetwork
}

const NETWORKS: CryptoNetwork[] = ['TRON', 'BSC', 'MATIC']
const POLL_INTERVAL = 12_000 // 12 segundos

const STEP_SELECT  = 'select'
const STEP_PAYMENT = 'payment'
const STEP_SUCCESS = 'success'

type Step = typeof STEP_SELECT | typeof STEP_PAYMENT | typeof STEP_SUCCESS

export default function PaymentModal({ cvId, cvInspirationId, onSuccess, onClose }: PaymentModalProps) {
  const [step, setStep]               = useState<Step>(STEP_SELECT)
  const [selectedNetwork, setNetwork] = useState<CryptoNetwork | null>(null)
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [copied, setCopied]           = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const pollRef  = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTimers = useCallback(() => {
    if (pollRef.current)  clearInterval(pollRef.current)
    if (timerRef.current) clearInterval(timerRef.current)
  }, [])

  useEffect(() => () => clearTimers(), [clearTimers])

  async function handleCreatePayment(network: CryptoNetwork) {
    setLoading(true)
    setError(null)
    setNetwork(network)

    try {
      const endpoint = cvInspirationId
        ? '/api/payments/create-inspiracion'
        : '/api/payments/create'
      const payload = cvInspirationId
        ? { cv_inspiracion_id: cvInspirationId, red: network }
        : { cv_id: cvId, red: network }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Error al crear el pago.')

      if (data.already_paid) {
        setStep(STEP_SUCCESS)
        setTimeout(onSuccess, 1500)
        return
      }

      setPaymentData(data)
      setStep(STEP_PAYMENT)

      // Countdown timer
      if (data.expiration_estimate_date) {
        const expiresAt = new Date(data.expiration_estimate_date).getTime()
        const tick = () => {
          const secs = Math.max(0, Math.round((expiresAt - Date.now()) / 1000))
          setSecondsLeft(secs)
        }
        tick()
        timerRef.current = setInterval(tick, 1000)
      }

      // Poll for confirmation
      pollRef.current = setInterval(async () => {
        await checkStatus(data.payment_id)
      }, POLL_INTERVAL)
    } catch (err: any) {
      setError(err.message || 'Error inesperado. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  async function checkStatus(paymentId: string) {
    try {
      const res = await fetch(`/api/payments/status/${paymentId}`)
      const data = await res.json()

      if (data.confirmado) {
        clearTimers()
        setStep(STEP_SUCCESS)
        setTimeout(onSuccess, 1500)
      }
    } catch { /* non-critical polling failure */ }
  }

  function handleCopyAddress() {
    if (!paymentData) return
    navigator.clipboard.writeText(paymentData.direccion_wallet).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  function formatSeconds(s: number) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const urgencyColor = secondsLeft < 300 && secondsLeft > 0
    ? 'text-red-500'
    : 'text-[#64748b]'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: '#ffffff' }}
      >
        {/* Header */}
        <div
          className="px-6 pt-6 pb-5"
          style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
            aria-label="Cerrar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>

          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: '#4B6BFB' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </div>
            <div>
              <p className="text-white/60 text-xs font-medium tracking-wide uppercase">Desbloquear descarga</p>
              <p className="text-white text-lg font-bold leading-tight">CV Único</p>
            </div>
          </div>

          <div className="flex items-baseline gap-1 mt-3">
            <span className="text-3xl font-bold text-white">$2.99</span>
            <span className="text-white/50 text-sm">USDT</span>
          </div>
          <p className="text-white/50 text-xs mt-1">Pago único · Descarga inmediata tras confirmación</p>
        </div>

        {/* Body */}
        <div className="p-6">

          {/* STEP: SELECT NETWORK */}
          {step === STEP_SELECT && (
            <div>
              <p className="text-sm font-semibold text-[#1e293b] mb-3">Elige tu red de pago</p>
              <div className="flex flex-col gap-2">
                {NETWORKS.map(net => (
                  <button
                    key={net}
                    onClick={() => handleCreatePayment(net)}
                    disabled={loading}
                    className="flex items-center justify-between px-4 py-3 rounded-xl border-2 border-[#e2e8f0] hover:border-[#4B6BFB] transition-all group disabled:opacity-50"
                    style={{ background: '#f8fafc' }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ background: NETWORK_COLORS[net] }}
                      />
                      <div className="text-left">
                        <p className="text-sm font-semibold text-[#1e293b] group-hover:text-[#4B6BFB] transition-colors">
                          USDT · {NETWORK_LABELS[net]}
                        </p>
                        <p className="text-xs text-[#94a3b8]">Comisión de red {NETWORK_FEES[net]}</p>
                      </div>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" className="group-hover:stroke-[#4B6BFB] transition-colors">
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </button>
                ))}
              </div>

              {loading && (
                <div className="flex items-center justify-center gap-2 mt-4 text-sm text-[#64748b]">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  Generando dirección de pago…
                </div>
              )}

              {error && (
                <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* STEP: PAYMENT */}
          {step === STEP_PAYMENT && paymentData && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: '#22C55E' }} />
                <p className="text-xs font-medium text-[#22C55E]">Esperando pago en red {NETWORK_LABELS[paymentData.red]}</p>
                {secondsLeft > 0 && (
                  <span className={`ml-auto text-xs font-mono font-medium ${urgencyColor}`}>
                    {formatSeconds(secondsLeft)}
                  </span>
                )}
              </div>

              {/* QR */}
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-xl border-2 border-[#e2e8f0] bg-white">
                  <QRCode
                    value={paymentData.direccion_wallet}
                    size={160}
                    level="M"
                  />
                </div>
              </div>

              {/* Amount */}
              <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] mb-3">
                <span className="text-xs text-[#64748b]">Monto a enviar</span>
                <span className="text-sm font-bold text-[#1e293b]">
                  {paymentData.monto_cripto} USDT
                </span>
              </div>

              {/* Address */}
              <div className="rounded-xl border border-[#e2e8f0] overflow-hidden mb-4">
                <div className="px-3 py-1.5 bg-[#f1f5f9] border-b border-[#e2e8f0]">
                  <span className="text-xs text-[#64748b] font-medium">Dirección de pago</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2.5">
                  <p className="flex-1 text-xs font-mono text-[#334155] break-all leading-relaxed">
                    {paymentData.direccion_wallet}
                  </p>
                  <button
                    onClick={handleCopyAddress}
                    className="shrink-0 p-1.5 rounded-lg hover:bg-[#f1f5f9] transition-colors"
                    title="Copiar dirección"
                  >
                    {copied ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5">
                        <path d="M20 6L9 17l-5-5"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Warning */}
              <div className="flex gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
                <svg className="shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Envía <strong>exactamente</strong> el monto indicado solo por la red <strong>{NETWORK_LABELS[paymentData.red]}</strong>. Los pagos en otras redes se pierden de forma irreversible.
                </p>
              </div>

              <p className="text-center text-xs text-[#94a3b8] mt-4">
                Verificando automáticamente cada 12 segundos…
              </p>
            </div>
          )}

          {/* STEP: SUCCESS */}
          {step === STEP_SUCCESS && (
            <div className="flex flex-col items-center py-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ background: '#dcfce7' }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              </div>
              <p className="text-lg font-bold text-[#1e293b] mb-1">¡Pago confirmado!</p>
              <p className="text-sm text-[#64748b] text-center">Tu CV está desbloqueado. Iniciando descarga…</p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}