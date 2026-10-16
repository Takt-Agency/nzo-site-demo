import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

// Wraps a route so unauthenticated visitors are redirected to /login (with a redirect param).
// While the auth state is still loading (hydration from token), shows a small splash.
export default function ProtectedRoute({ children, role }) {
  const { user, ready } = useAuth()
  const location = useLocation()

  if (!ready) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-secondary/30 border-t-secondary" />
      </div>
    )
  }

  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?next=${next}`} replace />
  }

  if (role && user.role !== role) {
    const home =
      user.role === 'admin'
        ? '/admin'
        : user.role === 'agent'
        ? '/espace-agent'
        : '/espace-client'
    return <Navigate to={home} replace />
  }

  return children
}
