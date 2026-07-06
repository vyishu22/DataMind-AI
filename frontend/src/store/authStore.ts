/**
 * DEPRECATED — Auth state is now managed by AuthContext.
 * This file is kept only for backward compatibility with
 * any components that imported it before the auth module upgrade.
 * New code should import { useAuth } from '@/context/AuthContext'.
 */
export { useAuth as useAuthStore } from '@/context/AuthContext'
