// Redirect shim — register has moved to /auth/signup
import { Navigate } from 'react-router-dom'
export default function RegisterPage() {
  return <Navigate to="/auth/signup" replace />
}
