// Application-level encryption for identity data (birth date, address, nationality —
// Europass spec change 26). AES-256-GCM with a key that only the server has
// (IDENTITY_ENCRYPTION_KEY, 32 bytes in base64). A leaked database or backup shows only
// ciphertext. The user id is bound as additional authenticated data, so a ciphertext
// copied to another user's row does not decrypt.
//
// Server-only: never import this from a client component.

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

const VERSION = 'v1'
const IV_BYTES = 12
const TAG_BYTES = 16

export class IdentityKeyError extends Error {}

function key(): Buffer {
  const raw = process.env.IDENTITY_ENCRYPTION_KEY
  const buf = raw ? Buffer.from(raw, 'base64') : null
  if (!buf || buf.length !== 32) throw new IdentityKeyError('IDENTITY_ENCRYPTION_KEY missing or not 32 bytes (base64)')
  return buf
}

export function encryptForUser(userId: string, plaintext: string): string {
  const iv = randomBytes(IV_BYTES)
  const cipher = createCipheriv('aes-256-gcm', key(), iv)
  cipher.setAAD(Buffer.from(userId, 'utf8'))
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  return `${VERSION}.${Buffer.concat([iv, cipher.getAuthTag(), ct]).toString('base64url')}`
}

// Throws on a wrong key, a tampered value or a value that belongs to another user.
export function decryptForUser(userId: string, payload: string): string {
  const [version, body] = payload.split('.')
  if (version !== VERSION || !body) throw new Error('Unknown identity payload format')
  const buf = Buffer.from(body, 'base64url')
  const decipher = createDecipheriv('aes-256-gcm', key(), buf.subarray(0, IV_BYTES))
  decipher.setAAD(Buffer.from(userId, 'utf8'))
  decipher.setAuthTag(buf.subarray(IV_BYTES, IV_BYTES + TAG_BYTES))
  return Buffer.concat([decipher.update(buf.subarray(IV_BYTES + TAG_BYTES)), decipher.final()]).toString('utf8')
}
