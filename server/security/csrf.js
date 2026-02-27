/**
 * CSRF Protection Module
 *
 * Implements the Signed Double Submit Cookie pattern for CSRF protection.
 * - A cryptographically random token is stored in a httpOnly cookie (server-side only).
 * - A HMAC-signed version of that token is stored in a readable cookie for the SPA.
 * - On state-changing requests the SPA sends the signed token in a custom header.
 * - The server verifies the header value is a valid HMAC of the httpOnly cookie value.
 *
 * This prevents CSRF because:
 *   1. An attacker cannot read the httpOnly cookie.
 *   2. An attacker cannot forge a valid HMAC without the server-side secret.
 */

/* global process */
import crypto from 'node:crypto'

const CSRF_TOKEN_LENGTH = 32
const CSRF_HEADER = 'x-csrf-token'
const CSRF_COOKIE_NAME = 'csrf_token'
const CSRF_PUBLIC_COOKIE_NAME = 'csrf_token_signed'

/**
 * Derive the HMAC secret from the environment.
 * Falls back to a random per-process secret so the server still works without
 * explicit configuration (tokens will be invalidated on restart).
 */
let _hmacSecret = null
function getHmacSecret() {
  if (_hmacSecret) return _hmacSecret
  const envSecret = process.env.CSRF_SECRET
  if (envSecret && envSecret.length >= 32) {
    _hmacSecret = Buffer.from(envSecret, 'utf8')
  } else {
    // Warn once and use a random per-process secret
    console.warn(
      '[CSRF] CSRF_SECRET env var is not set or too short (<32 chars). ' +
      'Using a random per-process secret – CSRF tokens will be invalidated on server restart.',
    )
    _hmacSecret = crypto.randomBytes(32)
  }
  return _hmacSecret
}

/**
 * Generate a cryptographically secure CSRF token
 * @returns {string}
 */
export function generateCsrfToken() {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('base64url')
}

/**
 * Sign a CSRF token with HMAC-SHA256.
 * @param {string} token
 * @returns {string}
 */
function signToken(token) {
  return crypto
    .createHmac('sha256', getHmacSecret())
    .update(token)
    .digest('base64url')
}

/**
 * Verify that `signature` is the valid HMAC-SHA256 of `token`.
 * Uses timing-safe comparison.
 * @param {string} token
 * @param {string} signature
 * @returns {boolean}
 */
function verifyTokenSignature(token, signature) {
  try {
    const expected = signToken(token)
    const expectedBuf = Buffer.from(expected, 'base64url')
    const actualBuf = Buffer.from(signature, 'base64url')
    if (expectedBuf.length !== actualBuf.length) return false
    return crypto.timingSafeEqual(expectedBuf, actualBuf)
  } catch {
    return false
  }
}

/**
 * Build cookie options shared by both cookies.
 * @returns {import('express').CookieOptions}
 */
function cookieOptions() {
  return {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: '/',
  }
}

/**
 * Set both CSRF cookies on the response.
 * @param {import('express').Response} res
 * @param {string} token
 */
function setCsrfCookies(res, token) {
  // httpOnly cookie – cannot be read by JavaScript (server-side reference value)
  res.cookie(CSRF_COOKIE_NAME, token, {
    ...cookieOptions(),
    httpOnly: true,
  })

  // Readable cookie – contains the HMAC signature of the token so the SPA can
  // send it in the custom header without ever seeing the raw token.
  res.cookie(CSRF_PUBLIC_COOKIE_NAME, signToken(token), {
    ...cookieOptions(),
    httpOnly: false,
  })
}

/**
 * Middleware to set CSRF token cookies.
 * Should be applied to all routes.
 */
export function csrfCookieMiddleware(req, res, next) {
  // Use the already-parsed cookies provided by cookie-parser
  const existingToken = req.cookies && req.cookies[CSRF_COOKIE_NAME]
  if (!existingToken) {
    const token = generateCsrfToken()
    setCsrfCookies(res, token)
  }
  next()
}

/**
 * Middleware to validate CSRF token.
 * Apply to state-changing routes (POST, PUT, DELETE, PATCH).
 */
export function csrfProtectionMiddleware(req, res, next) {
  // Skip for safe methods
  const safeMethods = ['GET', 'HEAD', 'OPTIONS']
  if (safeMethods.includes(req.method)) {
    return next()
  }

  const signatureFromHeader = req.headers[CSRF_HEADER]
  const tokenFromCookie = req.cookies && req.cookies[CSRF_COOKIE_NAME]

  // Validate presence
  if (!signatureFromHeader || !tokenFromCookie) {
    return res.status(403).json({
      error: 'CSRF token missing',
      code: 'CSRF_MISSING',
    })
  }

  // Verify the header value is a valid HMAC of the httpOnly cookie token
  if (!verifyTokenSignature(tokenFromCookie, signatureFromHeader)) {
    return res.status(403).json({
      error: 'CSRF token invalid',
      code: 'CSRF_INVALID',
    })
  }

  next()
}

/**
 * Endpoint handler: issue a fresh CSRF token pair.
 * The SPA should call this once on startup and after token expiry.
 */
export function getCsrfToken(req, res) {
  const token = generateCsrfToken()
  setCsrfCookies(res, token)
  // Return only the signed value (not the raw token) so the client can use it
  // as the header value.  The raw token never leaves the httpOnly cookie.
  res.json({ csrfToken: signToken(token) })
}

export { CSRF_HEADER, CSRF_COOKIE_NAME, CSRF_PUBLIC_COOKIE_NAME }
