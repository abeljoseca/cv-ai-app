// One-time setup: creates the "Momentum Pro" Product and its 2 Billing Plans
// (mensual/anual) in PayPal. Run with: node scripts/setup-paypal-plans.js
// Prints the resulting plan IDs — save them to .env.local as
// PAYPAL_PLAN_ID_MENSUAL / PAYPAL_PLAN_ID_ANUAL (and to Vercel env vars
// for production, using the Live equivalents once ready).

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envRaw = fs.readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envRaw.split('\n')) {
  const m = line.match(/^([A-Z_0-9]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}

const API_BASE = env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

async function getAccessToken() {
  const res = await fetch(`${API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error(`OAuth failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.access_token;
}

async function paypalFetch(token, path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

(async () => {
  const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: configRows, error } = await admin.from('configuracion').select('clave, valor').in('clave', ['precio_mensual', 'precio_anual']);
  if (error) throw error;
  const precios = Object.fromEntries(configRows.map(r => [r.clave, parseFloat(r.valor)]));
  console.log('Precios reales leídos de configuracion:', precios);

  const token = await getAccessToken();
  console.log('Token OK, modo:', env.PAYPAL_MODE || 'sandbox');

  const product = await paypalFetch(token, '/v1/catalogs/products', {
    name: 'Momentum Pro',
    description: 'Suscripción Pro de Momentum CV — CVs y descargas ilimitadas',
    type: 'SERVICE',
    category: 'SOFTWARE',
  });
  console.log('Producto creado:', product.id);

  const planBody = (name, priceUSD, intervalUnit) => ({
    product_id: product.id,
    name,
    description: name,
    status: 'ACTIVE',
    billing_cycles: [{
      frequency: { interval_unit: intervalUnit, interval_count: 1 },
      tenure_type: 'REGULAR',
      sequence: 1,
      total_cycles: 0,
      pricing_scheme: { fixed_price: { value: priceUSD.toFixed(2), currency_code: 'USD' } },
    }],
    payment_preferences: {
      auto_bill_outstanding: true,
      payment_failure_threshold: 3,
      setup_fee_failure_action: 'CONTINUE',
    },
  });

  const planMensual = await paypalFetch(token, '/v1/billing/plans', planBody('Momentum Pro — Mensual', precios.precio_mensual, 'MONTH'));
  console.log('Plan mensual creado:', planMensual.id, `($${precios.precio_mensual}/mes)`);

  const planAnual = await paypalFetch(token, '/v1/billing/plans', planBody('Momentum Pro — Anual', precios.precio_anual, 'YEAR'));
  console.log('Plan anual creado:', planAnual.id, `($${precios.precio_anual}/año)`);

  console.log('\n--- Guarda esto en .env.local ---');
  console.log(`PAYPAL_PLAN_ID_MENSUAL=${planMensual.id}`);
  console.log(`PAYPAL_PLAN_ID_ANUAL=${planAnual.id}`);
})().catch(e => { console.error('SETUP ERROR:', e.message); process.exit(1); });
