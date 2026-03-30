import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const ALLOWED_DOMAIN = import.meta.env.VITE_ALLOWED_DOMAIN || 'dishariboston.org'
const SESSION_KEY = 'dishari_admin_auth'

const AuthContext = createContext(null)

/** Decode a JWT payload (no crypto verification — Google GIS validates on its end). */
function decodeJwtPayload(token) {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
  return JSON.parse(atob(base64))
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)      // { name, email, picture, hd }
  const [error, setError] = useState(null)
  const [gsiReady, setGsiReady] = useState(false)
  const gsiInitialised = useRef(false)

  // Restore session from sessionStorage
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY)
      if (stored) setUser(JSON.parse(stored))
    } catch { /* ignore corrupt data */ }
  }, [])

  // Persist user to sessionStorage
  useEffect(() => {
    if (user) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(user))
    } else {
      sessionStorage.removeItem(SESSION_KEY)
    }
  }, [user])

  const handleCredentialResponse = useCallback((response) => {
    try {
      const payload = decodeJwtPayload(response.credential)

      if (payload.hd !== ALLOWED_DOMAIN) {
        setError(`Access denied. Only @${ALLOWED_DOMAIN} accounts are allowed.`)
        setUser(null)
        return
      }

      setUser({
        name: payload.name,
        email: payload.email,
        picture: payload.picture,
        hd: payload.hd,
      })
      setError(null)
    } catch {
      setError('Failed to verify credentials.')
      setUser(null)
    }
  }, [])

  // Initialise Google Identity Services
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || gsiInitialised.current) return

    function init() {
      if (!window.google?.accounts?.id) return
      gsiInitialised.current = true

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
      })
      setGsiReady(true)
    }

    // GIS script may already be loaded or still loading
    if (window.google?.accounts?.id) {
      init()
    } else {
      // Wait for the script to load
      const check = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(check)
          init()
        }
      }, 200)
      return () => clearInterval(check)
    }
  }, [handleCredentialResponse])

  const signOut = useCallback(() => {
    setUser(null)
    setError(null)
    if (window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect()
    }
  }, [])

  const renderSignInButton = useCallback((element) => {
    if (!element || !window.google?.accounts?.id) return
    window.google.accounts.id.renderButton(element, {
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      shape: 'rectangular',
    })
  }, [])

  return (
    <AuthContext.Provider value={{ user, error, gsiReady, signOut, renderSignInButton }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
