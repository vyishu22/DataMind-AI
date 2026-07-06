import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

interface Props {
  children: React.ReactNode
  requireVerified?: boolean
}

export function ProtectedRoute({ children, requireVerified = false }: Props) {
  const { isAuthenticated, isInitializing, user } = useAuth()
  const location = useLocation()

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background:'#08040F' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center animate-pulse"
            style={{ background:'linear-gradient(135deg,#7C3AED,#EC4899)' }}>
            <span className="text-white text-lg">✦</span>
          </div>
          <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor:'rgba(168,85,247,0.4)', borderTopColor:'#A855F7' }} />
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />
  }

  if (requireVerified && user && !user.isVerified) {
    return <Navigate to="/auth/verify-email" replace />
  }

  return <>{children}</>
}

export function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitializing } = useAuth()

  if (isInitializing) return null
  if (isAuthenticated) return <Navigate to="/app" replace />
  return <>{children}</>
}
