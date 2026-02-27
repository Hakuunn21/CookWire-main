/* global process */
import crypto from 'node:crypto'

export const OWNER_KEY_HEADER = 'x-cookwire-owner-key'

/**
 * Derive the HMAC secret used to hash owner keys.
 * Using a server-side secret prevents rainbow-table / pre-computation attacks
 * against the stored hashes.
 *
 * Falls back to a random per-process secret when OWNER_KEY_SECRET is not set
 * (hashes will change on restart – existing records become inaccessible).
 */
let _ownerKeySecret = null
function getOwnerKeySecret() {
  if (_ownerKeySecret) return _ownerKeySecret
  const envSecret = process.env.OWNER_KEY_SECRET
  if (envSecret && envSecret.length >= 32) {
    _ownerKeySecret = Buffer.from(envSecret, 'utf8')
  } else {
    console.warn(
      '[OwnerKey] OWNER_KEY_SECRET env var is not set or too short (<32 chars). ' +
      'Using a random per-process secret – stored owner key hashes will be ' +
      'invalidated on server restart.',
    )
    _ownerKeySecret = crypto.randomBytes(32)
  }
  return _ownerKeySecret
}

/**
 * リクエストからOwner Keyを取得し、バリデーションを行う
 * @param {import('express').Request} req
 * @returns {{ok: true, value: string} | {ok: false, error: string}}
 */
export const getOwnerKeyFromRequest = (req) => {
  const key = req.headers[OWNER_KEY_HEADER]
  if (typeof key !== 'string') {
    return { ok: false, error: 'Missing X-CookWire-Owner-Key header' }
  }
  const trimmed = key.trim()

  // 最小長チェック（24文字以上）
  if (trimmed.length < 24) {
    return { ok: false, error: 'Invalid owner key length' }
  }

  // 最大長チェック（512文字以下）- DoS対策
  if (trimmed.length > 512) {
    return { ok: false, error: 'Invalid owner key length' }
  }

  // 制御文字のチェック
  if (/[\x00-\x1F\x7F]/.test(trimmed)) {
    return { ok: false, error: 'Invalid characters in owner key' }
  }

  return { ok: true, value: trimmed }
}

/**
 * Owner KeyをHMAC-SHA256でハッシュ化する。
 * サーバーサイドの秘密鍵を使用することで、レインボーテーブル攻撃を防ぐ。
 * @param {string} value
 * @returns {string}
 */
export const hashOwnerKey = (value) => {
  return crypto
    .createHmac('sha256', getOwnerKeySecret())
    .update(value)
    .digest('hex')
}

/**
 * 安全なOwner Keyを生成
 * @returns {string}
 */
export const generateOwnerKey = () => {
  return crypto.randomBytes(32).toString('base64url')
}

/**
 * 定数時間比較（タイミング攻撃対策）
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
export function timingSafeEqual(a, b) {
  if (a.length !== b.length) {
    return false
  }
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))
}
