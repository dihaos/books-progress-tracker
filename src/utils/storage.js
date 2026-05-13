const PREFIX = 'bpt:'

export function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (raw == null) return fallback
    return JSON.parse(raw)
  } catch (err) {
    console.warn('[storage] failed to read', key, err)
    return fallback
  }
}

export function saveJSON(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch (err) {
    console.warn('[storage] failed to save', key, err)
  }
}

export function removeKey(key) {
  try {
    localStorage.removeItem(PREFIX + key)
  } catch {
    /* ignore */
  }
}

/** Whether a value was ever persisted for this key (distinguishes missing key from explicit `[]`). */
export function storageHasKey(key) {
  try {
    return localStorage.getItem(PREFIX + key) != null
  } catch {
    return false
  }
}
