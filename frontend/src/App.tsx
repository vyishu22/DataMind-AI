import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { ProtectedRoute, GuestRoute } from '@/routes/ProtectedRoute'

// Layout
import AppLayout from '@/components/layout/AppLayout'

// Landing page
import LandingPage from '@/pages/LandingPage'

// Auth pages (new premium module)
import LoginPage          from '@/pages/auth/LoginPage'
import SignupPage         from '@/pages/auth/SignupPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'
import ResetPasswordPage  from '@/pages/auth/ResetPasswordPage'
import VerifyEmailPage    from '@/pages/auth/VerifyEmailPage'

// App pages
import DashboardPage from '@/pages/DashboardPage'
import DatasetPage   from '@/pages/DatasetPage'
import ChatPage      from '@/pages/ChatPage'
import ForecastPage  from '@/pages/ForecastPage'
import ReportsPage   from '@/pages/ReportsPage'
import SettingsPage  from '@/pages/SettingsPage'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* ── Public landing page ───────────────────────────────────── */}
        <Route path="/home" element={<LandingPage />} />

        {/* ── Auth routes (guest only) ──────────────────────────────── */}
        <Route path="/auth/login" element={
          <GuestRoute><LoginPage /></GuestRoute>
        } />
        <Route path="/auth/signup" element={
          <GuestRoute><SignupPage /></GuestRoute>
        } />
        <Route path="/auth/forgot-password" element={
          <GuestRoute><ForgotPasswordPage /></GuestRoute>
        } />
        <Route path="/auth/reset-password" element={
          <GuestRoute><ResetPasswordPage /></GuestRoute>
        } />
        {/* Verify-email accessible while authenticated too */}
        <Route path="/auth/verify-email" element={<VerifyEmailPage />} />

        {/* Legacy redirects */}
        <Route path="/login"    element={<Navigate to="/auth/login"  replace />} />
        <Route path="/register" element={<Navigate to="/auth/signup" replace />} />

        {/* ── Protected app routes ──────────────────────────────────── */}
        <Route path="/" element={
          <ProtectedRoute><AppLayout /></ProtectedRoute>
        }>
          <Route index            element={<DashboardPage />} />
          <Route path="dataset/:id" element={<DatasetPage />} />
          <Route path="chat/:id?"   element={<ChatPage />} />
          <Route path="forecast/:id?" element={<ForecastPage />} />
          <Route path="reports"   element={<ReportsPage />} />
          <Route path="settings"  element={<SettingsPage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
