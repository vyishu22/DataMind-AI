// Redirect shim — login has moved to /auth/login
import { Navigate } from 'react-router-dom'
export default function LoginPage() {
  return <Navigate to="/auth/login" replace />
}
