/**
 * CSRF Token Management
 * 
 * Handles fetching and caching CSRF tokens for API requests.
 */

const CSRF_HEADER = 'x-csrf-token'
let csrfToken = null

/**
 * Get CSRF token from cookie (set by server)
 * @returns {string|null}
 */
function getCsrfTokenFromCookie() {
  const match = document.cookie.match(/csrf_token_public=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

/**
 * Fetch new CSRF token from server
 * @returns {Promise<string>}
 */
async function fetchCsrfToken() {
  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || `${window.location.origin}/api`).replace(/\/$/, '')
  
  const response = await fetch(`${apiBaseUrl}/csrf-token`, {
    method: 'GET',
    credentials: 'include', // Important: include cookies
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch CSRF token')
  }
  
  const data = await response.json()
  csrfToken = data.csrfToken
  return csrfToken
}

/**
 * Get valid CSRF token for requests
 * Fetches from server if not available
 * @returns {Promise<string>}
 */
export async function getCsrfToken() {
  // First try from memory
  if (csrfToken) {
    return csrfToken
  }
  
  // Then try from cookie
  const fromCookie = getCsrfTokenFromCookie()
  if (fromCookie) {
    csrfToken = fromCookie
    return csrfToken
  }
  
  // Finally fetch from server
  return fetchCsrfToken()
}

/**
 * Clear cached CSRF token
 * Call this after logout or when token may be invalid
 */
export function clearCsrfToken() {
  csrfToken = null
}

export { CSRF_HEADER }
