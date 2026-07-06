export interface User {
  id: string
  fullName: string
  email: string
  avatar?: string
  role: 'user' | 'admin'
  isVerified: boolean
  plan: string
  datasets_count: number
  createdAt: string
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface AuthResponse extends AuthTokens {
  user: User
}

export interface LoginPayload {
  email: string
  password: string
  remember_me?: boolean
}

export interface RegisterPayload {
  fullName: string
  email: string
  password: string
}

export type PasswordStrength = 0 | 1 | 2 | 3 | 4
