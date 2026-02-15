/**
 * Secure LocalStorage Utilities
 * 
 * Provides safe localStorage operations with error handling,
 * size limits, and validation.
 */

const MAX_STORAGE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_KEY_LENGTH = 100
const MAX_VALUE_LENGTH = 4 * 1024 * 1024 // 4MB

/**
 * Safely get item from localStorage
 * @param {string} key
 * @param {any} defaultValue
 * @returns {any}
 */
export function safeGetItem(key, defaultValue = null) {
  // Validate key
  if (!key || typeof key !== 'string' || key.length > MAX_KEY_LENGTH) {
    console.warn('Invalid storage key')
    return defaultValue
  }
  
  try {
    const item = localStorage.getItem(key)
    if (!item) return defaultValue
    
    // Validate size
    if (item.length > MAX_VALUE_LENGTH) {
      console.warn('Storage item too large')
      return defaultValue
    }
    
    return JSON.parse(item)
  } catch (error) {
    console.error('localStorage get error:', error)
    return defaultValue
  }
}

/**
 * Safely set item in localStorage
 * @param {string} key
 * @param {any} value
 * @returns {boolean}
 */
export function safeSetItem(key, value) {
  // Validate key
  if (!key || typeof key !== 'string' || key.length > MAX_KEY_LENGTH) {
    console.warn('Invalid storage key')
    return false
  }
  
  try {
    const serialized = JSON.stringify(value)
    
    // Check individual item size
    if (serialized.length > MAX_VALUE_LENGTH) {
      console.warn('Value too large for localStorage')
      return false
    }
    
    // Check total storage (approximate)
    let totalSize = 0
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k !== key) {
        totalSize += (localStorage.getItem(k) || '').length
      }
    }
    totalSize += serialized.length
    
    if (totalSize > MAX_STORAGE_SIZE) {
      console.warn('localStorage quota exceeded')
      return false
    }
    
    localStorage.setItem(key, serialized)
    return true
  } catch (error) {
    // Handle quota errors, private mode, etc.
    if (error.name === 'QuotaExceededError') {
      console.warn('localStorage quota exceeded')
    } else {
      console.error('localStorage set error:', error)
    }
    return false
  }
}

/**
 * Safely remove item from localStorage
 * @param {string} key
 * @returns {boolean}
 */
export function safeRemoveItem(key) {
  if (!key || typeof key !== 'string') {
    return false
  }
  
  try {
    localStorage.removeItem(key)
    return true
  } catch (error) {
    console.error('localStorage remove error:', error)
    return false
  }
}

/**
 * Clear all items with a specific prefix
 * @param {string} prefix
 * @returns {number} Number of items cleared
 */
export function clearWithPrefix(prefix) {
  if (!prefix || typeof prefix !== 'string') {
    return 0
  }
  
  let count = 0
  try {
    const keysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key)
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key)
      count++
    })
  } catch (error) {
    console.error('localStorage clear error:', error)
  }
  
  return count
}

/**
 * Check if localStorage is available
 * @returns {boolean}
 */
export function isStorageAvailable() {
  try {
    const test = '__storage_test__'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}
