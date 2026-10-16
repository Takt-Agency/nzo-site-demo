import { io } from 'socket.io-client'
import { getToken } from './api.js'

// Socket.IO base URL — the backend attaches the /admin namespace on the
// same host/port that serves the REST API. Default matches the dev API.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
// Strip the trailing "/api" — Socket.IO connects to the root, not a path.
const SOCKET_URL = API_URL.replace(/\/api\/?$/, '')

let socket = null

// Lazily initialise the admin socket. Callers get a shared instance so
// multiple screens can subscribe to the same event stream without opening
// N connections.
export function getAdminSocket() {
  if (socket && socket.connected) return socket
  if (socket) {
    socket.connect()
    return socket
  }
  socket = io(`${SOCKET_URL}/admin`, {
    auth: { token: getToken() },
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 8000,
    transports: ['websocket'],
  })
  return socket
}

export function closeAdminSocket() {
  if (socket) {
    socket.removeAllListeners()
    socket.disconnect()
    socket = null
  }
}

// -------------------- Notifications socket ----------------------------
// A per-user namespace that any authenticated role (client/agent/admin)
// can join. The server puts the socket in its user room on connect and
// pushes `notification:new` events for that user only.
let notifSocket = null

export function getNotificationsSocket() {
  if (notifSocket && notifSocket.connected) return notifSocket
  if (notifSocket) {
    notifSocket.connect()
    return notifSocket
  }
  notifSocket = io(`${SOCKET_URL}/notifications`, {
    auth: { token: getToken() },
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 8000,
    transports: ['websocket'],
  })
  return notifSocket
}

export function closeNotificationsSocket() {
  if (notifSocket) {
    notifSocket.removeAllListeners()
    notifSocket.disconnect()
    notifSocket = null
  }
}
