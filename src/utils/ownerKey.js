const STORAGE_KEY = 'cookwire-owner-key'

const randomToken = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${crypto.randomUUID()}-${crypto.randomUUID()}`
  }
  return `${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`
}

export const getOwnerKey = () => {
  if (typeof window === 'undefined') return ''
  let key = localStorage.getItem(STORAGE_KEY)
  if (!key) {
    key = randomToken()
    localStorage.setItem(STORAGE_KEY, key)
  }
  return key
}
