import crypto from 'node:crypto'

export const OWNER_KEY_HEADER = 'x-cookwire-owner-key'

// 定数時間比較（タイミング攻撃対策）
function timingSafeEqual(a, b) {
  if (a.length !== b.length) {
    return false
  }
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))
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
 * Owner KeyをSHA-256でハッシュ化
 * 一貫性のためのハッシュ関数（認証には使用しない）
 * @param {string} value
 * @returns {string}
 */
export const hashOwnerKey = (value) => {
  return crypto.createHash('sha256').update(value).digest('hex')
}

/**
 * 安全なOwner Keyを生成
 * @returns {string}
 */
export const generateOwnerKey = () => {
  return crypto.randomBytes(32).toString('base64url')
}

export { timingSafeEqual }
