import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

// Reverse of ProtectedRoute: only lets unauthenticated visitors through.
// If the user is already logged in, redirects to their natural landing page
// (admin dashboard or client space) so the login/signup pages can't be re-opened.
export default function GuestRoute({ children }) {
  const { user, ready } = useAuth()

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <span className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-secondary/30 border-t-secondary" />
      </div>
    )
  }

  if (user) {
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
