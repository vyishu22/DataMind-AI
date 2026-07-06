import { api } from '@/lib/api'
import type { AuthResponse, LoginPayload, RegisterPayload } from '@/types/auth'

const BASE = '/api/auth'

export const authService = {
  register: (payload: RegisterPayload) =>
    api.post<AuthResponse>(`${BASE}/register`, payload),

  login: (payload: LoginPayload) =>
    api.post<AuthResponse>(`${BASE}/login`, payload),

  refresh: (refresh_token: string) =>
    api.post<{ access_token: string; refresh_token: string }>(`${BASE}/refresh`, { refresh_token }),

  logout: (refresh_token?: string) =>
    api.post(`${BASE}/logout`, { refresh_token }),

  forgotPassword: (email: string) =>
    api.post<{ message: string }>(`${BASE}/forgot-password`, { email }),

  resetPassword: (token: string, new_password: string, confirm_password: string) =>
    api.post<{ message: string }>(`${BASE}/reset-password`, { token, new_password, confirm_password }),

  verifyEmail: (token: string) =>
    api.post<{ message: string }>(`${BASE}/verify-email`, { token }),

  resendVerification: () =>
    api.post<{ message: string }>(`${BASE}/resend-verification`),

  me: () => api.get(`${BASE}/me`),
}
