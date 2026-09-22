// NOWPayments API client
// Docs: https://documenter.getpostman.com/view/7907941/2s93JqTRWN

import type { CryptoNetwork } from '@/types'

const API_URL = 'https://api.nowpayments.io/v1'

export const NETWORK_CURRENCY: Record<CryptoNetwork, string> = {
  TRON:  'usdttrc20',
  BSC:   'usdtbsc',
  MATIC: 'usdtmatic',
}

export const NETWORK_LABELS: Record<CryptoNetwork, string> = {
  TRON:  'TRON (TRC-20)',
  BSC:   'BNB Smart Chain (BEP-20)',
  MATIC: 'Polygon (MATIC)',
}

export const NETWORK_FEES: Record<CryptoNetwork, string> = {
  TRON:  '~$0–$2',
  BSC:   '~$0.10',
  MATIC: '~$0.02',
}

export const NETWORK_COLORS: Record<CryptoNetwork, string> = {
  TRON:  '#FF060A',
  BSC:   '#F0B90B',
  MATIC: '#8247E5',
}

export interface NOWPaymentsPayment {
  payment_id: string
  payment_status: string
  pay_address: string
  price_amount: number
  price_currency: string
  pay_amount: number
  pay_currency: string
  order_id: string
  order_description: string
  created_at: string
  expiration_estimate_date: string
}

export async function createNOWPayment(params: {
  orderId: string
  orderDescription: string
  priceAmount: number
  payCurrency: string
  ipnCallbackUrl: string
}): Promise<NOWPaymentsPayment> {
  const apiKey = process.env.NOWPAYMENTS_API_KEY
  if (!apiKey) throw new Error('NOWPAYMENTS_API_KEY not configured')

  const res = await fetch(`${API_URL}/payment`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      price_amount:       params.priceAmount,
      price_currency:     'usd',
      pay_currency:       params.payCurrency,
      order_id:           params.orderId,
      order_description:  params.orderDescription,
      ipn_callback_url:   params.ipnCallbackUrl,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `NOWPayments API error ${res.status}`)
  }

  return res.json()
}

export async function getNOWPaymentStatus(paymentId: string): Promise<NOWPaymentsPayment> {
  const apiKey = process.env.NOWPAYMENTS_API_KEY
  if (!apiKey) throw new Error('NOWPAYMENTS_API_KEY not configured')

  const res = await fetch(`${API_URL}/payment/${paymentId}`, {
    headers: { 'x-api-key': apiKey },
  })

  if (!res.ok) throw new Error(`Failed to fetch payment status: ${res.status}`)
  return res.json()
}

// Verify IPN webhook signature — HMAC-SHA512 of body (keys sorted) with IPN secret
export async function verifyNOWPaymentsSignature(
  body: Record<string, unknown>,
  signature: string,
  secret: string
): Promise<boolean> {
  const sorted: Record<string, unknown> = {}
  for (const key of Object.keys(body).sort()) {
    sorted[key] = body[key]
  }

  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(JSON.stringify(sorted)))
  const hex = Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  return hex === signature
}

export const PAYMENT_FINISHED  = new Set(['finished', 'confirmed'])
export const PAYMENT_FAILED    = new Set(['failed', 'refunded', 'expired'])
export const PAYMENT_PENDING   = new Set(['waiting', 'confirming', 'sending', 'partially_paid'])