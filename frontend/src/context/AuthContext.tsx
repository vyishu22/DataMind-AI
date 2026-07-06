import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { authService } from '@/services/authService'
import type { User } from '@/types/auth'

interface AuthCtx {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  isInitializing: boolean
  login:    (email: string, password: string, rememberMe?: boolean) => Promise<void>
  register: (fullName: string, email: string, password: string) => Promise<void>
  logout:   () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthCtx | null>(null)

const TOKEN_KEY   = 'dm_access_token'
const REFRESH_KEY = 'dm_refresh_token'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,           setUser]           = useState<User | null>(null)
  const [isLoading,      setIsLoading]      = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)

  // On mount — rehydrate session
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) {
      authService.me()
        .then(({ data }) => setUser(data))
        .catch(() => {
          localStorage.removeItem(TOKEN_KEY)
          localStorage.removeItem(REFRESH_KEY)
        })
        .finally(() => setIsInitializing(false))
    } else {
      setIsInitializing(false)
    }
  }, [])

  const _saveTokens = (access: string, refresh: string) => {
    localStorage.setItem(TOKEN_KEY,   access)
    localStorage.setItem(REFRESH_KEY, refresh)
    // Keep backward compat keys the existing api.ts uses
    localStorage.setItem('access_token',  access)
    localStorage.setItem('refresh_token', refresh)
  }

  const login = useCallback(async (email: string, password: string, rememberMe = false) => {
    setIsLoading(true)
    try {
      const { data } = await authService.login({ email, password, remember_me: rememberMe })
      _saveTokens(data.access_token, data.refresh_token)
      setUser(data.user)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const register = useCallback(async (fullName: string, email: string, password: string) => {
    setIsLoading(true)
    try {
      const { data } = await authService.register({ fullName, email, password })
      _saveTokens(data.access_token, data.refresh_token)
      setUser(data.user)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem(REFRESH_KEY) || undefined
    try { await authService.logout(refreshToken) } catch { /* ignore */ }
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_KEY)
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    const { data } = await authService.me()
    setUser(data)
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      isInitializing,
      login, register, logout, refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthCtx {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
