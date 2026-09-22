import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== 'production'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseHost = supabaseUrl ? new URL(supabaseUrl).origin : ''

const ContentSecurityPolicy = [
  "default-src 'self'",
  // Next.js requires 'unsafe-inline' for hydration; React dev mode requires 'unsafe-eval' for call-stack reconstruction
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://challenges.cloudflare.com`,
  // Inline styles required by Next.js + Tailwind; Google Fonts stylesheet
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
  // Google Fonts files
  `font-src 'self' https://fonts.gstatic.com`,
  // Images: local, base64, blob (canvas exports), Supabase storage
  `img-src 'self' data: blob: ${supabaseHost}`,
  // API calls: Supabase REST + Realtime WebSocket, Turnstile verification
  `connect-src 'self' ${supabaseHost} ${supabaseHost.replace('https://', 'wss://')} https://challenges.cloudflare.com`,
  // Turnstile renders inside an iframe
  `frame-src https://challenges.cloudflare.com`,
  // Prevent this app from being embedded in iframes (replaces X-Frame-Options)
  `frame-ancestors 'none'`,
  // Prevent base tag injection (redirects all relative links to attacker domain)
  `base-uri 'self'`,
  // Prevent forms from submitting to external domains
  `form-action 'self'`,
  // Block Flash and other legacy plugins
  `object-src 'none'`,
].join('; ')

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: ContentSecurityPolicy },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
};

export default nextConfig;