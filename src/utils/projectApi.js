import { getCsrfToken, CSRF_HEADER } from './csrf.js'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || `${window.location.origin}/api`).replace(/\/$/, '')

const parseResponse = async (response) => {
  let payload
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    const error = new Error(payload?.error || `Request failed (${response.status})`)
    error.status = response.status
    // Include CSRF error code if present
    if (payload?.code) {
      error.code = payload.code
    }
    throw error
  }

  return payload
}

const jsonRequest = async (path, { method = 'GET', ownerKey, body } = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    'X-CookWire-Owner-Key': ownerKey,
  }
  
  // Include CSRF token for state-changing methods
  const stateChangingMethods = ['POST', 'PUT', 'DELETE', 'PATCH']
  if (stateChangingMethods.includes(method)) {
    try {
      const csrfToken = await getCsrfToken()
      headers[CSRF_HEADER] = csrfToken
    } catch (error) {
      console.error('Failed to get CSRF token:', error)
    }
  }
  
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    credentials: 'include', // Important: include cookies for CSRF
    body: body ? JSON.stringify(body) : undefined,
  })

  return parseResponse(response)
}

export const listProjects = async (ownerKey) => {
  const payload = await jsonRequest('/projects', { ownerKey })
  return payload?.data || []
}

export const getProject = async (ownerKey, id) => {
  const payload = await jsonRequest(`/projects/${id}`, { ownerKey })
  return payload?.data
}

export const createProject = async (ownerKey, project) => {
  const payload = await jsonRequest('/projects', {
    method: 'POST',
    ownerKey,
    body: project,
  })
  return payload?.data
}

export const updateProject = async (ownerKey, id, project) => {
  const payload = await jsonRequest(`/projects/${id}`, {
    method: 'PUT',
    ownerKey,
    body: project,
  })
  return payload?.data
}
