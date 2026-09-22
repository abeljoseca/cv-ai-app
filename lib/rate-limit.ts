// Rate limiter backed by Upstash Redis when configured (real, shared across
// serverless instances — required for correctness in production), falling
// back to an in-memory limiter when UPSTASH_* env vars are absent (local dev
// without an Upstash account set up yet). The in-memory fallback only limits
// per warm instance, same caveat as before Upstash was wired in.

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

interface Window {
  count: number
  resetAt: number
}

const memoryStore = new Map<string, Window>()

setInterval(() => {
  const now = Date.now()
  for (const [key, win] of memoryStore) {
    if (now > win.resetAt) memoryStore.delete(key)
  }
}, 5 * 60 * 1000)

function memoryRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const win = memoryStore.get(key)

  if (!win || now > win.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (win.count >= limit) return false

  win.count++
  return true
}

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null

if (!redis) {
  console.warn(
    '[rate-limit] UPSTASH_REDIS_REST_URL/TOKEN not set — using in-memory rate limiting ' +
      '(per-instance only, not shared across serverless instances). Fine for local dev, ' +
      'not for production.'
  )
}

// One Ratelimit instance per distinct (limit, windowMs) pair — Upstash's SDK ties
// the window into the instance, and call sites in this app use a handful of fixed
// combinations, so this map stays small.
const limiters = new Map<string, Ratelimit>()

function getLimiter(limit: number, windowMs: number): Ratelimit {
  const cacheKey = `${limit}:${windowMs}`
  let limiter = limiters.get(cacheKey)
  if (!limiter) {
    limiter = new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
      analytics: false,
      prefix: 'momentum-ratelimit',
    })
    limiters.set(cacheKey, limiter)
  }
  return limiter
}

/**
 * Returns true if request is allowed, false if rate limit exceeded.
 * @param key      Unique identifier (e.g. userId or IP)
 * @param limit    Max requests per window
 * @param windowMs Window size in milliseconds
 */
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  if (!redis) return memoryRateLimit(key, limit, windowMs)

  try {
    const { success } = await getLimiter(limit, windowMs).limit(key)
    return success
  } catch (err) {
    // Upstash unreachable — fail open (don't block real users on an infra
    // hiccup) but fall back to the in-memory limiter for this request so
    // there's still *some* protection.
    console.error('[rate-limit] Upstash error, falling back to in-memory:', err)
    return memoryRateLimit(key, limit, windowMs)
  }
}
