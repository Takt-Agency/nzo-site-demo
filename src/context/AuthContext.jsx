import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import {
  authApi,
  setToken,
  setTokens,
  clearTokens,
  getToken,
  getRefreshToken,
  setOnSessionExpired,
  ApiError,
} from '../lib/api.js'
import { closeNotificationsSocket } from '../lib/realtime.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  // On mount, if a token is stored, hydrate the user from /me.
  useEffect(() => {
    let cancelled = false
    const token = getToken()
    if (!token) {
      setReady(true)
      return
    }
    authApi
      .me()
      .then((data) => {
        if (!cancelled) setUser(data.user)
      })
      .catch(() => {
        // Token is invalid/expired — clear it silently
        clearTokens()
      })
      .finally(() => {
        if (!cancelled) setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Wire the api layer's "session dead" callback → clear React state so the
  // ProtectedRoute redirects immediately when a refresh fails mid-session.
  useEffect(() => {
    setOnSessionExpired(() => setUser(null))
    return () => setOnSessionExpired(null)
  }, [])

  // Cross-tab sync: when another tab clears or changes the token, mirror it
  // here so the user can't be "logged in" in one tab and "logged out" in
  // another. Without this, a stale React user can linger and redirect the
  // user back to /admin or /espace-client after they explicitly logged out
  // in another tab.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== 'nzo-token') return
      if (!e.newValue) {
        setUser(null)
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const login = useCallback(async (credentials) => {
    const data = await authApi.login({ ...credentials, deviceLabel: 'web' })
    setTokens({
      accessToken: data.accessToken || data.token,
      refreshToken: data.refreshToken,
    })
    setUser(data.user)
    return data.user
  }, [])

  // Signup can return two shapes:
  //   { requiresVerification: true, email }  — user must enter a 6-digit code
  //   { token, user }                        — legacy path, immediate session
  // The caller inspects `requiresVerification` to decide where to navigate.
  const signup = useCallback(async (payload) => {
    const data = await authApi.signup(payload)
    if ((data.accessToken || data.token) && data.user) {
      setTokens({
        accessToken: data.accessToken || data.token,
        refreshToken: data.refreshToken,
      })
      setUser(data.user)
    }
    return data
  }, [])

  const verifyEmail = useCallback(async ({ email, code }) => {
    const data = await authApi.verifyEmail({ email, code, deviceLabel: 'web' })
    setTokens({
      accessToken: data.accessToken || data.token,
      refreshToken: data.refreshToken,
    })
    setUser(data.user)
    return data.user
  }, [])

  const resendVerificationCode = useCallback(
    async ({ email }) => authApi.resendCode({ email }),
    [],
  )

  const forgotPassword = useCallback(async ({ email }) => authApi.forgotPassword({ email }), [])

  const verifyResetCode = useCallback(
    async ({ email, code }) => authApi.verifyResetCode({ email, code }),
    [],
  )

  const resetPassword = useCallback(async ({ email, code, newPassword }) => {
    const data = await authApi.resetPassword({ email, code, newPassword, deviceLabel: 'web' })
    setTokens({
      accessToken: data.accessToken || data.token,
      refreshToken: data.refreshToken,
    })
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(async () => {
    // Best-effort server-side revocation so a stolen refresh token can't be
    // replayed. Doesn't block the UX if the network hiccups.
    try {
      const refreshToken = getRefreshToken()
      if (refreshToken) await authApi.logout({ refreshToken })
    } catch {
      /* offline logout — refresh token expires naturally in 30 days */
    }
    clearTokens()
    try {
      window.localStorage.removeItem('nzo-token')
      window.sessionStorage.removeItem('nzo-token')
    } catch {
      /* storage unavailable */
    }
    // Drop the notifications socket so a fresh login opens a new one under
    // the new user's JWT rather than reusing the stale connection.
    try {
      closeNotificationsSocket()
    } catch {
      /* not connected — ignore */
    }
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        ready,
        login,
        signup,
        logout,
        verifyEmail,
        resendVerificationCode,
        forgotPassword,
        verifyResetCode,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}

export { ApiError }
