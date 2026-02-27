/**
 * CSRF Token Management
 *
 * Handles fetching and caching CSRF tokens for API requests.
 *
 * The server uses a Signed Double Submit Cookie pattern:
 *   - `csrf_token`        (httpOnly) – raw token, never readable by JS
 *   - `csrf_token_signed` (readable) – HMAC-SHA256 signature of the raw token
 *
 * The client reads the signed value from the readable cookie and sends it in
 * the `x-csrf-token` header.  The server verifies the signature against the
 * httpOnly cookie value.
 */

const CSRF_HEADER = 'x-csrf-token'
const CSRF_SIGNED_COOKIE = 'csrf_token_signed'

let csrfToken = null

/**
 * Get the signed CSRF token from the readable cookie set by the server.
 * @returns {string|null}
 */
function getCsrfTokenFromCookie() {
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${CSRF_SIGNED_COOKIE}=([^;]+)`),
  )
  return match ? decodeURIComponent(match[1]) : null
}

/**
 * Fetch a fresh signed CSRF token from the server.
 * The server will also refresh both cookies.
 * @returns {Promise<string>}
 */
async function fetchCsrfToken() {
  const apiBaseUrl = (
    import.meta.env.VITE_API_BASE_URL || `${window.location.origin}/api`
  ).replace(/\/$/, '')

  const response = await fetch(`${apiBaseUrl}/csrf-token`, {
    method: 'GET',
    credentials: 'include', // Important: include cookies
  })

  if (!response.ok) {
    throw new Error('Failed to fetch CSRF token')
  }

  const data = await response.json()
  // The server returns the signed token (not the raw token)
  csrfToken = data.csrfToken
  return csrfToken
}

/**
 * Get a valid signed CSRF token for use in the `x-csrf-token` header.
 * Priority: in-memory cache → readable cookie → server fetch.
 * @returns {Promise<string>}
 */
export async function getCsrfToken() {
  // 1. In-memory cache
  if (csrfToken) {
    return csrfToken
  }

  // 2. Readable cookie (set by server on first page load)
  const fromCookie = getCsrfTokenFromCookie()
  if (fromCookie) {
    csrfToken = fromCookie
    return csrfToken
  }

  // 3. Fetch from server (also refreshes cookies)
  return fetchCsrfToken()
}

/**
 * Clear cached CSRF token.
 * Call this after logout or when a request fails with CSRF_MISSING / CSRF_INVALID.
 */
export function clearCsrfToken() {
  csrfToken = null
}

export { CSRF_HEADER }
