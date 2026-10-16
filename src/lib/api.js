// Lightweight fetch wrapper that attaches the auth token automatically
// and unwraps JSON / error payloads. Also handles silent refresh-token
// rotation when a 401 comes back mid-session.

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
const TOKEN_KEY = 'nzo-token'
const REFRESH_KEY = 'nzo-refresh'

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* storage unavailable */
  }
}

export function getRefreshToken() {
  try {
    return localStorage.getItem(REFRESH_KEY)
  } catch {
    return null
  }
}

export function setRefreshToken(token) {
  try {
    if (token) localStorage.setItem(REFRESH_KEY, token)
    else localStorage.removeItem(REFRESH_KEY)
  } catch {
    /* storage unavailable */
  }
}

export function setTokens({ accessToken, refreshToken } = {}) {
  setToken(accessToken || null)
  setRefreshToken(refreshToken || null)
}

export function clearTokens() {
  setToken(null)
  setRefreshToken(null)
}

let onSessionExpiredCallback = null
export function setOnSessionExpired(fn) {
  onSessionExpiredCallback = fn
}

let refreshInFlight = null
async function performRefresh() {
  if (refreshInFlight) return refreshInFlight
  refreshInFlight = (async () => {
    try {
      const refreshToken = getRefreshToken()
      if (!refreshToken) return null
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken, deviceLabel: 'web' }),
      })
      if (!res.ok) {
        clearTokens()
        onSessionExpiredCallback?.()
        return null
      }
      const data = await res.json()
      setTokens({
        accessToken: data.accessToken || data.token,
        refreshToken: data.refreshToken,
      })
      return data.accessToken || data.token
    } catch {
      return null
    } finally {
      refreshInFlight = null
    }
  })()
  return refreshInFlight
}

export class ApiError extends Error {
  constructor(message, status, details, data) {
    super(message)
    this.status = status
    this.details = details
    // Full response body — useful for reading flags the backend attaches to
    // error payloads (e.g. `requiresVerification`, `expired`, `email`).
    this.data = data
  }
}

export async function apiFetch(
  path,
  { method = 'GET', body, auth = false, signal, _retry } = {},
) {
  const headers = { 'Content-Type': 'application/json' }
  if (auth) {
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let res
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body != null ? JSON.stringify(body) : undefined,
      signal,
    })
  } catch (err) {
    throw new ApiError('Network error — is the backend running?', 0)
  }

  // 401 on an authed request → refresh once, then replay.
  if (auth && res.status === 401 && !_retry) {
    const fresh = await performRefresh()
    if (fresh) return apiFetch(path, { method, body, auth, signal, _retry: true })
  }

  const isJson = (res.headers.get('content-type') || '').includes('application/json')
  const data = isJson ? await res.json().catch(() => ({})) : {}

  if (!res.ok) {
    throw new ApiError(
      data.error || `Request failed (${res.status})`,
      res.status,
      data.details,
      data,
    )
  }
  return data
}

// Auth-specific helpers
export const authApi = {
  signup: (payload) => apiFetch('/auth/signup', { method: 'POST', body: payload }),
  login: (payload) => apiFetch('/auth/login', { method: 'POST', body: payload }),
  verifyEmail: (payload) => apiFetch('/auth/verify-email', { method: 'POST', body: payload }),
  resendCode: (payload) => apiFetch('/auth/resend-code', { method: 'POST', body: payload }),
  forgotPassword: (payload) =>
    apiFetch('/auth/forgot-password', { method: 'POST', body: payload }),
  verifyResetCode: (payload) =>
    apiFetch('/auth/verify-reset-code', { method: 'POST', body: payload }),
  resetPassword: (payload) => apiFetch('/auth/reset-password', { method: 'POST', body: payload }),
  refresh: (payload) => apiFetch('/auth/refresh', { method: 'POST', body: payload }),
  logout: (payload) => apiFetch('/auth/logout', { method: 'POST', body: payload }),
  me: () => apiFetch('/auth/me', { auth: true }),
}

// Authenticated /me/* helpers — all require a valid JWT.
export const meApi = {
  dashboard: () => apiFetch('/me/dashboard', { auth: true }),
  getProfile: () => apiFetch('/me/profile', { auth: true }),
  updateProfile: (payload) => apiFetch('/me/profile', { method: 'PATCH', body: payload, auth: true }),
  listDevis: () => apiFetch('/me/devis', { auth: true }),
  getDevis: (id) => apiFetch(`/me/devis/${id}`, { auth: true }),
  createDevis: (payload) => apiFetch('/me/devis', { method: 'POST', body: payload, auth: true }),
  acceptDevis: (id) => apiFetch(`/me/devis/${id}/accept`, { method: 'POST', auth: true }),
  replyDevis: (id, text) =>
    apiFetch(`/me/devis/${id}/reply`, { method: 'POST', body: { text }, auth: true }),
  listMissions: () => apiFetch('/me/missions', { auth: true }),
  getMission: (id) => apiFetch(`/me/missions/${id}`, { auth: true }),
  submitMissionFeedback: (id, payload) =>
    apiFetch(`/me/missions/${id}/feedback`, { method: 'POST', body: payload, auth: true }),
  listDemandes: () => apiFetch('/me/demandes', { auth: true }),
  createDemande: (payload) => apiFetch('/me/demandes', { method: 'POST', body: payload, auth: true }),
  listReclamations: () => apiFetch('/me/reclamations', { auth: true }),
  getReclamation: (id) => apiFetch(`/me/reclamations/${id}`, { auth: true }),
  createReclamation: (payload) =>
    apiFetch('/me/reclamations', { method: 'POST', body: payload, auth: true }),
  replyReclamation: (id, text) =>
    apiFetch(`/me/reclamations/${id}/reply`, { method: 'POST', body: { text }, auth: true }),
  listFactures: () => apiFetch('/me/factures', { auth: true }),
  getFacture: (id) => apiFetch(`/me/factures/${id}`, { auth: true }),

  // Photo upload — uses multipart/form-data instead of JSON. Returns { items: [{url, name, size}] }.
  uploadPhotos: async (files) => {
    if (!files || files.length === 0) return { items: [] }
    const formData = new FormData()
    for (const f of files) formData.append('photos', f)
    const token = getToken()
    const res = await fetch(`${API_URL}/me/uploads/photos`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new ApiError(data.error || `Upload failed (${res.status})`, res.status)
    return data
  },

  // Change the connected user's password — works for admin, agent and client.
  changePassword: (payload) =>
    apiFetch('/me/password', { method: 'POST', body: payload, auth: true }),
  // Read-only company info for invoice/contract rendering. Available to any
  // authenticated user (client / agent / admin).
  getPublicSettings: () => apiFetch('/me/settings/public', { auth: true }),

  listNotifications: (limit = 50) => apiFetch(`/me/notifications?limit=${limit}`, { auth: true }),
  unreadNotificationsCount: () => apiFetch('/me/notifications/unread-count', { auth: true }),
  markNotificationRead: (id) =>
    apiFetch(`/me/notifications/${id}/read`, { method: 'POST', auth: true }),
  markAllNotificationsRead: () =>
    apiFetch('/me/notifications/read-all', { method: 'POST', auth: true }),
  deleteNotification: (id) =>
    apiFetch(`/me/notifications/${id}`, { method: 'DELETE', auth: true }),
}

// Agent-side endpoints — only callable with role === 'agent' (backend enforces).
// Agents see only missions where they're listed in staffUserIds.
export const agentApi = {
  dashboard: () => apiFetch('/agent/dashboard', { auth: true }),
  listMissions: ({ status } = {}) => {
    const qs = status && status !== 'all' ? `?status=${status}` : ''
    return apiFetch(`/agent/missions${qs}`, { auth: true })
  },
  getMission: (id) => apiFetch(`/agent/missions/${id}`, { auth: true }),
  startMission: (id) => apiFetch(`/agent/missions/${id}/start`, { method: 'POST', auth: true }),
  completeMission: (id) =>
    apiFetch(`/agent/missions/${id}/complete`, { method: 'POST', auth: true }),
  addPhotos: (id, photos) =>
    apiFetch(`/agent/missions/${id}/photos`, { method: 'POST', body: { photos }, auth: true }),
  listDemandes: () => apiFetch('/agent/demandes', { auth: true }),
  getDemande: (id) => apiFetch(`/agent/demandes/${id}`, { auth: true }),
  createDemande: (payload) =>
    apiFetch('/agent/demandes', { method: 'POST', body: payload, auth: true }),
  replyDemande: (id, text) =>
    apiFetch(`/agent/demandes/${id}/reply`, { method: 'POST', body: { text }, auth: true }),

  // ---------- Geolocation & devices (used by the mobile app; kept here so a
  // future PWA/browser test harness can hit the same endpoints) ---------
  getLocationStatus: () => apiFetch('/agent/location-status', { auth: true }),
  setLocationConsent: (payload) =>
    apiFetch('/agent/location-consent', { method: 'POST', body: payload, auth: true }),
  pushLocation: (payload) =>
    apiFetch('/agent/location', { method: 'POST', body: payload, auth: true }),
  logMissionEvent: (id, payload) =>
    apiFetch(`/agent/missions/${id}/events`, { method: 'POST', body: payload, auth: true }),
  registerDevice: (payload) =>
    apiFetch('/agent/devices', { method: 'POST', body: payload, auth: true }),
  unregisterDevice: (id) =>
    apiFetch(`/agent/devices/${id}`, { method: 'DELETE', auth: true }),
  fireSos: (payload) =>
    apiFetch('/agent/sos', { method: 'POST', body: payload, auth: true }),
}

// Admin-side endpoints — only callable with role === 'admin' (backend enforces).
export const adminApi = {
  dashboard: () => apiFetch('/admin/dashboard', { auth: true }),
  // Lightweight counters for the sidebar badges. Returns pending items only.
  sidebarCounts: () => apiFetch('/admin/sidebar-counts', { auth: true }),

  listClients: () => apiFetch('/admin/clients', { auth: true }),
  getClient: (id) => apiFetch(`/admin/clients/${id}`, { auth: true }),
  createClient: (payload) =>
    apiFetch('/admin/clients', { method: 'POST', body: payload, auth: true }),
  updateClient: (id, payload) =>
    apiFetch(`/admin/clients/${id}`, { method: 'PATCH', body: payload, auth: true }),

  listDevis: ({ status, q } = {}) => {
    const params = new URLSearchParams()
    if (status && status !== 'all') params.set('status', status)
    if (q) params.set('q', q)
    const qs = params.toString()
    return apiFetch(`/admin/devis${qs ? `?${qs}` : ''}`, { auth: true })
  },
  getDevis: (id) => apiFetch(`/admin/devis/${id}`, { auth: true }),
  createDevis: (payload) =>
    apiFetch('/admin/devis', { method: 'POST', body: payload, auth: true }),
  updateDevis: (id, payload) =>
    apiFetch(`/admin/devis/${id}`, { method: 'PATCH', body: payload, auth: true }),
  replyDevis: (id, text) =>
    apiFetch(`/admin/devis/${id}/reply`, { method: 'POST', body: { text }, auth: true }),
  convertDevis: (id, payload) =>
    apiFetch(`/admin/devis/${id}/convert`, { method: 'POST', body: payload, auth: true }),
  listAgents: () => apiFetch('/admin/agents', { auth: true }),
  todaysBirthdays: () => apiFetch('/admin/agents/birthdays/today', { auth: true }),
  getAgent: (id) => apiFetch(`/admin/agents/${id}`, { auth: true }),
  createAgent: (payload) =>
    apiFetch('/admin/agents', { method: 'POST', body: payload, auth: true }),
  updateAgent: (id, payload) =>
    apiFetch(`/admin/agents/${id}`, { method: 'PATCH', body: payload, auth: true }),
  deleteAgent: (id) => apiFetch(`/admin/agents/${id}`, { method: 'DELETE', auth: true }),

  // Missions admin
  listMissions: ({ status, q } = {}) => {
    const p = new URLSearchParams()
    if (status && status !== 'all') p.set('status', status)
    if (q) p.set('q', q)
    const qs = p.toString()
    return apiFetch(`/admin/missions${qs ? `?${qs}` : ''}`, { auth: true })
  },
  getMission: (id) => apiFetch(`/admin/missions/${id}`, { auth: true }),
  createMission: (payload) =>
    apiFetch('/admin/missions', { method: 'POST', body: payload, auth: true }),
  updateMission: (id, payload) =>
    apiFetch(`/admin/missions/${id}`, { method: 'PATCH', body: payload, auth: true }),
  addMissionPhotos: (id, photos) =>
    apiFetch(`/admin/missions/${id}/photos`, { method: 'POST', body: { photos }, auth: true }),
  removeMissionPhoto: (id, photoId) =>
    apiFetch(`/admin/missions/${id}/photos/${photoId}`, { method: 'DELETE', auth: true }),

  // Demandes admin
  listDemandes: ({ status, from } = {}) => {
    const p = new URLSearchParams()
    if (status && status !== 'all') p.set('status', status)
    if (from === 'client' || from === 'agent') p.set('from', from)
    const qs = p.toString()
    return apiFetch(`/admin/demandes${qs ? `?${qs}` : ''}`, { auth: true })
  },
  getDemande: (id) => apiFetch(`/admin/demandes/${id}`, { auth: true }),
  replyDemande: (id, text) =>
    apiFetch(`/admin/demandes/${id}/reply`, { method: 'POST', body: { text }, auth: true }),
  updateDemande: (id, payload) =>
    apiFetch(`/admin/demandes/${id}`, { method: 'PATCH', body: payload, auth: true }),

  // Réclamations admin
  listReclamations: ({ status } = {}) => {
    const qs = status && status !== 'all' ? `?status=${status}` : ''
    return apiFetch(`/admin/reclamations${qs}`, { auth: true })
  },
  getReclamation: (id) => apiFetch(`/admin/reclamations/${id}`, { auth: true }),
  replyReclamation: (id, text) =>
    apiFetch(`/admin/reclamations/${id}/reply`, { method: 'POST', body: { text }, auth: true }),
  updateReclamation: (id, payload) =>
    apiFetch(`/admin/reclamations/${id}`, { method: 'PATCH', body: payload, auth: true }),

  // Factures admin
  listFactures: ({ status } = {}) => {
    const qs = status && status !== 'all' ? `?status=${status}` : ''
    return apiFetch(`/admin/factures${qs}`, { auth: true })
  },
  getFacture: (id) => apiFetch(`/admin/factures/${id}`, { auth: true }),
  createFacture: (payload) =>
    apiFetch('/admin/factures', { method: 'POST', body: payload, auth: true }),
  updateFacture: (id, payload) =>
    apiFetch(`/admin/factures/${id}`, { method: 'PATCH', body: payload, auth: true }),
  archiveFacture: (id) =>
    apiFetch(`/admin/factures/${id}/archive`, { method: 'POST', auth: true }),
  convertMissionToFacture: (missionId, payload = {}) =>
    apiFetch(`/admin/missions/${missionId}/convert-to-facture`, {
      method: 'POST',
      body: payload,
      auth: true,
    }),

  // ----- Unified archive endpoints --------------------------------------
  // Toggle isArchived on any resource: clients, devis, missions, demandes,
  // reclamations, agents, factures.
  archiveResource: (resource, id) =>
    apiFetch(`/admin/archive/${resource}/${id}`, { method: 'POST', auth: true }),
  unarchiveResource: (resource, id) =>
    apiFetch(`/admin/archive/${resource}/${id}/restore`, { method: 'POST', auth: true }),
  listArchived: ({ type } = {}) => {
    const qs = type ? `?type=${type}` : ''
    return apiFetch(`/admin/archive${qs}`, { auth: true })
  },

  // ----- Global settings (company + pricing + defaults) ----------------
  getSettings: () => apiFetch('/admin/settings', { auth: true }),
  updateSettings: (payload) =>
    apiFetch('/admin/settings', { method: 'PATCH', body: payload, auth: true }),

  // Reviews moderation — list every client feedback and approve/reject.
  listReviews: ({ status } = {}) => {
    const qs = status && status !== 'all' ? `?status=${status}` : ''
    return apiFetch(`/admin/reviews${qs}`, { auth: true })
  },
  moderateReview: (missionId, status) =>
    apiFetch(`/admin/reviews/${missionId}`, {
      method: 'PATCH',
      body: { status },
      auth: true,
    }),

  // ---------- Live map / geolocation ---------------------------------------
  listLiveAgents: () => apiFetch('/admin/agents/live', { auth: true }),
  agentTrail: (agentId, date) => {
    const qs = date ? `?date=${encodeURIComponent(date)}` : ''
    return apiFetch(`/admin/agents/${agentId}/trail${qs}`, { auth: true })
  },
  agentDevices: (agentId) => apiFetch(`/admin/agents/${agentId}/devices`, { auth: true }),
  revokeDevice: (deviceId) =>
    apiFetch(`/admin/agents/devices/${deviceId}`, { method: 'DELETE', auth: true }),
  missionTimeline: (missionId) => apiFetch(`/admin/missions/${missionId}/timeline`, { auth: true }),

  postMissionMessage: (missionId, text) =>
    apiFetch(`/admin/missions/${missionId}/messages`, {
      method: 'POST',
      body: { text },
      auth: true,
    }),
  markMissionMessagesRead: (missionId) =>
    apiFetch(`/admin/missions/${missionId}/messages/read-all`, {
      method: 'POST',
      auth: true,
    }),

  // SOS
  listSos: ({ status } = {}) => {
    const qs = status && status !== 'all' ? `?status=${status}` : ''
    return apiFetch(`/admin/sos${qs}`, { auth: true })
  },
  getSos: (id) => apiFetch(`/admin/sos/${id}`, { auth: true }),
  acknowledgeSos: (id) =>
    apiFetch(`/admin/sos/${id}/acknowledge`, { method: 'POST', auth: true }),
  resolveSos: (id, resolutionNote) =>
    apiFetch(`/admin/sos/${id}/resolve`, {
      method: 'POST',
      body: { resolutionNote },
      auth: true,
    }),
  sosCounts: () => apiFetch('/admin/sos/counts', { auth: true }),

  // Agent stats — monthly reporting
  listAgentStats: (month) => {
    const qs = month ? `?month=${encodeURIComponent(month)}` : ''
    return apiFetch(`/admin/stats/agents${qs}`, { auth: true })
  },
  getAgentStats: (agentId, month) => {
    const qs = month ? `?month=${encodeURIComponent(month)}` : ''
    return apiFetch(`/admin/stats/agents/${agentId}${qs}`, { auth: true })
  },
}

// Public (no auth) helpers — used by the public site.
export const publicApi = {
  listReviews: () => apiFetch('/public/reviews'),
}
