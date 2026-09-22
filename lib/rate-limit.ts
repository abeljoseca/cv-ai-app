// Simple in-memory rate limiter.
// Works per warm serverless instance — sufficient for a startup app.
// For multi-instance production scale, replace with Upstash Redis.

interface Window {
  count: number
  resetAt: number
}

const store = new Map<string, Window>()

// Clean up expired entries every 5 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now()
  for (const [key, win] of store) {
    if (now > win.resetAt) store.delete(key)
  }
}, 5 * 60 * 1000)

/**
 * Returns true if request is allowed, false if rate limit exceeded.
 * @param key      Unique identifier (e.g. userId or IP)
 * @param limit    Max requests per window
 * @param windowMs Window size in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const win = store.get(key)

  if (!win || now > win.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (win.count >= limit) return false

  win.count++
  return true
}