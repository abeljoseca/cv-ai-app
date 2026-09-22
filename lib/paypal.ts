// PayPal REST API client — Subscriptions for Plan Pro.
// Docs: https://developer.paypal.com/docs/api/subscriptions/v1/

const API_BASE =
  process.env.PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com'

// ─────────────────────────────────────────────────────────────────────────
// OAuth2 — cached in-process until ~5 min before expiry
// ─────────────────────────────────────────────────────────────────────────

let cachedToken: { value: string; expiresAt: number } | null = null

export async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.value
  }

  const clientId = process.env.PAYPAL_CLIENT_ID
  const secret = process.env.PAYPAL_CLIENT_SECRET
  if (!clientId || !secret) throw new Error('PAYPAL_CLIENT_ID/PAYPAL_CLIENT_SECRET not configured')

  const res = await fetch(`${API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error_description || `PayPal OAuth error ${res.status}`)
  }

  const data = await res.json()
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 300) * 1000,
  }
  return cachedToken.value
}

async function paypalFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken()
  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
}

// ─────────────────────────────────────────────────────────────────────────
// Setup (one-time, run via scripts/setup-paypal-plans.js)
// ─────────────────────────────────────────────────────────────────────────

export async function createProduct(name: string, description: string): Promise<{ id: string }> {
  const res = await paypalFetch('/v1/catalogs/products', {
    method: 'POST',
    body: JSON.stringify({ name, description, type: 'SERVICE', category: 'SOFTWARE' }),
  })
  if (!res.ok) throw new Error(`createProduct failed: ${res.status} ${await res.text()}`)
  return res.json()
}

export async function createPlan(params: {
  productId: string
  name: string
  description: string
  priceUSD: number
  intervalUnit: 'MONTH' | 'YEAR'
}): Promise<{ id: string }> {
  const res = await paypalFetch('/v1/billing/plans', {
    method: 'POST',
    body: JSON.stringify({
      product_id: params.productId,
      name: params.name,
      description: params.description,
      status: 'ACTIVE',
      billing_cycles: [
        {
          frequency: { interval_unit: params.intervalUnit, interval_count: 1 },
          tenure_type: 'REGULAR',
          sequence: 1,
          total_cycles: 0, // 0 = infinite, renews until cancelled
          pricing_scheme: {
            fixed_price: { value: params.priceUSD.toFixed(2), currency_code: 'USD' },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        // Let PayPal retry failed charges automatically before suspending —
        // we deliberately don't build our own grace-period/dunning logic.
        payment_failure_threshold: 3,
        setup_fee_failure_action: 'CONTINUE',
      },
    }),
  })
  if (!res.ok) throw new Error(`createPlan failed: ${res.status} ${await res.text()}`)
  return res.json()
}

// ─────────────────────────────────────────────────────────────────────────
// Subscriptions — used by the app's API routes
// ─────────────────────────────────────────────────────────────────────────

export interface PayPalSubscription {
  id: string
  status: 'APPROVAL_PENDING' | 'APPROVED' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'EXPIRED'
  plan_id: string
  custom_id?: string
  subscriber?: { email_address?: string }
  billing_info?: { next_billing_time?: string; last_payment?: { amount: { value: string } } }
  links: { rel: string; href: string }[]
}

export async function createSubscription(params: {
  planId: string
  userId: string
  returnUrl: string
  cancelUrl: string
}): Promise<PayPalSubscription> {
  const res = await paypalFetch('/v1/billing/subscriptions', {
    method: 'POST',
    body: JSON.stringify({
      plan_id: params.planId,
      custom_id: params.userId, // lets the webhook identify the user without trusting the client
      application_context: {
        brand_name: 'Momentum',
        user_action: 'SUBSCRIBE_NOW',
        return_url: params.returnUrl,
        cancel_url: params.cancelUrl,
      },
    }),
  })
  if (!res.ok) throw new Error(`createSubscription failed: ${res.status} ${await res.text()}`)
  return res.json()
}

export async function getSubscription(id: string): Promise<PayPalSubscription> {
  const res = await paypalFetch(`/v1/billing/subscriptions/${id}`)
  if (!res.ok) throw new Error(`getSubscription failed: ${res.status} ${await res.text()}`)
  return res.json()
}

export async function cancelSubscription(id: string, reason: string): Promise<void> {
  const res = await paypalFetch(`/v1/billing/subscriptions/${id}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
  // 204 No Content on success
  if (!res.ok && res.status !== 204) {
    throw new Error(`cancelSubscription failed: ${res.status} ${await res.text()}`)
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Webhook signature verification
// ─────────────────────────────────────────────────────────────────────────

export async function verifyWebhookSignature(
  headers: Record<string, string>,
  body: unknown,
  webhookId: string
): Promise<boolean> {
  const res = await paypalFetch('/v1/notifications/verify-webhook-signature', {
    method: 'POST',
    body: JSON.stringify({
      auth_algo: headers['paypal-auth-algo'],
      cert_url: headers['paypal-cert-url'],
      transmission_id: headers['paypal-transmission-id'],
      transmission_sig: headers['paypal-transmission-sig'],
      transmission_time: headers['paypal-transmission-time'],
      webhook_id: webhookId,
      webhook_event: body,
    }),
  })
  if (!res.ok) return false
  const data = await res.json().catch(() => ({}))
  return data.verification_status === 'SUCCESS'
}

export const SUBSCRIPTION_ACTIVE_EVENTS = new Set(['BILLING.SUBSCRIPTION.ACTIVATED'])
export const SUBSCRIPTION_DOWNGRADE_EVENTS = new Set([
  'BILLING.SUBSCRIPTION.SUSPENDED',
  'BILLING.SUBSCRIPTION.CANCELLED',
  'BILLING.SUBSCRIPTION.EXPIRED',
])
export const SUBSCRIPTION_PAYMENT_EVENT = 'PAYMENT.SALE.COMPLETED'
