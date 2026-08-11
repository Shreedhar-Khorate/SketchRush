/**
 * profileCookie.js
 *
 * Thin helpers for persisting the player's name + avatar emoji in a cookie.
 * Cookies are used instead of localStorage so the data survives hard refreshes
 * and can be shared across sub-paths without any backend involvement.
 *
 * Cookie name : "sketchrush_profile"
 * Cookie value: URL-encoded JSON  { name: string, avatarEmoji: string }
 * Expiry      : 30 days (rolling — refreshed every time the user plays)
 */

const COOKIE_NAME = 'sketchrush_profile'
const EXPIRY_DAYS = 30

// ── helpers ──────────────────────────────────────────────────────────────────

function setCookie(name, value, days) {
  const expires = new Date()
  expires.setDate(expires.getDate() + days)
  document.cookie = [
    `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
    `expires=${expires.toUTCString()}`,
    'path=/',
    'SameSite=Lax',
  ].join('; ')
}

function getCookie(name) {
  const key = `${encodeURIComponent(name)}=`
  const cookies = document.cookie.split(';')
  for (let raw of cookies) {
    const c = raw.trim()
    if (c.startsWith(key)) {
      try {
        return decodeURIComponent(c.slice(key.length))
      } catch {
        return null
      }
    }
  }
  return null
}

// ── public API ───────────────────────────────────────────────────────────────

/**
 * Save the player's profile to the cookie.
 * @param {{ name: string, avatarEmoji: string }} profile
 */
export function saveProfile({ name, avatarEmoji }) {
  try {
    const payload = JSON.stringify({ name: name.trim(), avatarEmoji })
    setCookie(COOKIE_NAME, payload, EXPIRY_DAYS)
  } catch (e) {
    console.warn('[profileCookie] Failed to save profile:', e)
  }
}

/**
 * Load the player's profile from the cookie.
 * @returns {{ name: string, avatarEmoji: string } | null}
 */
export function loadProfile() {
  try {
    const raw = getCookie(COOKIE_NAME)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (typeof parsed.name === 'string' && typeof parsed.avatarEmoji === 'string') {
      return { name: parsed.name, avatarEmoji: parsed.avatarEmoji }
    }
    return null
  } catch {
    return null
  }
}

/**
 * Clear the saved profile cookie.
 */
export function clearProfile() {
  document.cookie = `${encodeURIComponent(COOKIE_NAME)}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
}
