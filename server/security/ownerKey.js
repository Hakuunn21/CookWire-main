import crypto from 'node:crypto'

export const OWNER_KEY_HEADER = 'x-cookwire-owner-key'

export const getOwnerKeyFromRequest = (req) => {
  const key = req.headers[OWNER_KEY_HEADER]
  if (typeof key !== 'string') {
    return { ok: false, error: 'Missing X-CookWire-Owner-Key header' }
  }
  const trimmed = key.trim()
  if (trimmed.length < 24 || trimmed.length > 512) {
    return { ok: false, error: 'Invalid owner key length' }
  }
  return { ok: true, value: trimmed }
}

export const hashOwnerKey = (value) => crypto.createHash('sha256').update(value).digest('hex')
