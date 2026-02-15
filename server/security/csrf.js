/**
 * CSRF Protection Module
 * 
 * Implements Double Submit Cookie pattern for CSRF protection.
 * This is suitable for SPAs that use custom headers for authentication.
 */

import crypto from 'node:crypto'

const CSRF_TOKEN_LENGTH = 32
const CSRF_HEADER = 'x-csrf-token'
const CSRF_COOKIE_NAME = 'csrf_token'

/**
 * Generate a cryptographically secure CSRF token
 * @returns {string}
 */
export function generateCsrfToken() {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('base64url')
}

/**
 * Middleware to set CSRF token cookie
 * Should be applied to all routes
 */
export function csrfCookieMiddleware(req, res, next) {
  // Only set if not already present
  if (!req.headers.cookie || !req.headers.cookie.includes(CSRF_COOKIE_NAME)) {
    const token = generateCsrfToken()
    // Set httpOnly cookie (cannot be read by JavaScript)
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/',
    })
    // Also set a non-httpOnly cookie for the SPA to read
    res.cookie('csrf_token_public', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
    })
  }
  next()
}

/**
 * Middleware to validate CSRF token
 * Apply to state-changing routes (POST, PUT, DELETE, PATCH)
 */
export function csrfProtectionMiddleware(req, res, next) {
  // Skip for safe methods
  const safeMethods = ['GET', 'HEAD', 'OPTIONS']
  if (safeMethods.includes(req.method)) {
    return next()
  }

  // Skip for health check
  if (req.path === '/health') {
    return next()
  }

  const tokenFromHeader = req.headers[CSRF_HEADER]
  const cookies = parseCookies(req.headers.cookie)
  const tokenFromCookie = cookies[CSRF_COOKIE_NAME]

  // Validate presence
  if (!tokenFromHeader || !tokenFromCookie) {
    return res.status(403).json({ 
      error: 'CSRF token missing',
      code: 'CSRF_MISSING'
    })
  }

  // Use timing-safe comparison to prevent timing attacks
  try {
    const headerBuf = Buffer.from(tokenFromHeader, 'base64url')
    const cookieBuf = Buffer.from(tokenFromCookie, 'base64url')
    
    if (headerBuf.length !== cookieBuf.length) {
      return res.status(403).json({ 
        error: 'CSRF token invalid',
        code: 'CSRF_INVALID'
      })
    }

    if (!crypto.timingSafeEqual(headerBuf, cookieBuf)) {
      return res.status(403).json({ 
        error: 'CSRF token mismatch',
        code: 'CSRF_MISMATCH'
      })
    }
  } catch {
    return res.status(403).json({ 
      error: 'CSRF token invalid',
      code: 'CSRF_INVALID'
    })
  }

  next()
}

/**
 * Parse cookie header
 * @param {string} cookieHeader
 * @returns {Object}
 */
function parseCookies(cookieHeader) {
  if (!cookieHeader) return {}
  
  return cookieHeader.split(';').reduce((cookies, cookie) => {
    const [name, value] = cookie.trim().split('=')
    if (name && value) {
      cookies[name] = decodeURIComponent(value)
    }
    return cookies
  }, {})
}

/**
 * Get CSRF token for client-side usage
 * Endpoint handler to provide token to authenticated clients
 */
export function getCsrfToken(req, res) {
  const token = generateCsrfToken()
  
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000,
    path: '/',
  })
  
  res.cookie('csrf_token_public', token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000,
    path: '/',
  })

  res.json({ csrfToken: token })
}

export { CSRF_HEADER, CSRF_COOKIE_NAME }
