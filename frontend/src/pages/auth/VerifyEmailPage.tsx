import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, Loader2, Mail, RefreshCw } from 'lucide-react'
import { authService } from '@/services/authService'
import { AuthShell } from '@/components/auth/AuthShell'
import { useAuth } from '@/context/AuthContext'

type State = 'loading' | 'success' | 'error' | 'pending'

export default function VerifyEmailPage() {
  const [params]   = useSearchParams()
  const token      = params.get('token')
  const { user, refreshUser } = useAuth()

  const [state,   setState]   = useState<State>(token ? 'loading' : 'pending')
  const [message, setMessage] = useState('')
  const [resent,  setResent]  = useState(false)
  const [resending, setResending] = useState(false)

  useEffect(() => {
    if (!token) return
    authService.verifyEmail(token)
      .then(({ data }) => {
        setState('success')
        setMessage(data.message)
        refreshUser().catch(() => {})
      })
      .catch(err => {
        setState('error')
        setMessage(err?.response?.data?.detail || 'Verification failed. The link may have expired.')
      })
  }, [token])

  const resend = async () => {
    setResending(true)
    try {
      await authService.resendVerification()
      setResent(true)
    } catch { /* ignore */ }
    finally { setResending(false) }
  }

  const CONFIG = {
    loading: {
      icon: <Loader2 size={40} className="text-brand-400 animate-spin" />,
      bg: 'bg-brand-500/15 border-brand-500/25',
      title: 'Verifying your email…',
      subtitle: 'Just a moment',
    },
    success: {
      icon: <CheckCircle2 size={40} className="text-emerald-400" />,
      bg: 'bg-emerald-500/15 border-emerald-500/25',
      title: 'Email verified!',
      subtitle: message || 'Your account is now fully activated.',
    },
    error: {
      icon: <XCircle size={40} className="text-red-400" />,
      bg: 'bg-red-500/15 border-red-500/25',
      title: 'Verification failed',
      subtitle: message || 'The link may have expired.',
    },
    pending: {
      icon: <Mail size={40} className="text-brand-400" />,
      bg: 'bg-brand-500/15 border-brand-500/25',
      title: 'Verify your email',
      subtitle: `We sent a verification link to ${user?.email || 'your email address'}.`,
    },
  }

  const cfg = CONFIG[state]

  return (
    <AuthShell>
      <motion.div
        initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
        className="text-center py-8"
      >
        <motion.div
          initial={{ scale:0 }} animate={{ scale:1 }}
          transition={{ type:'spring', stiffness:200, delay:0.1 }}
          className={`w-[76px] h-[76px] rounded-full border flex items-center justify-center mx-auto mb-6 ${cfg.bg}`}
        >
          {cfg.icon}
        </motion.div>

        <motion.h2
          initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
          className="text-xl font-bold text-white mb-2"
        >
          {cfg.title}
        </motion.h2>

        <motion.p
          initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.3 }}
          className="text-slate-400 text-sm leading-relaxed mb-8 max-w-sm mx-auto"
        >
          {cfg.subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }}
          className="space-y-3"
        >
          {state === 'success' && (
            <Link to="/" className="btn-primary inline-flex items-center gap-2 px-6 py-2.5 text-sm">
              Go to Dashboard
            </Link>
          )}

          {(state === 'error' || state === 'pending') && !resent && (
            <button
              onClick={resend} disabled={resending}
              className="btn-primary inline-flex items-center gap-2 px-6 py-2.5 text-sm"
            >
              {resending
                ? <><Loader2 size={14} className="animate-spin" /> Sending…</>
                : <><RefreshCw size={14} /> Resend verification email</>
              }
            </button>
          )}

          {resent && (
            <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }}
              className="text-sm text-emerald-400 flex items-center justify-center gap-2">
              <CheckCircle2 size={14} /> Verification email sent!
            </motion.p>
          )}

          <Link to="/auth/login"
            className="block text-sm text-slate-500 hover:text-slate-300 transition-colors pt-2">
            ← Back to sign in
          </Link>
        </motion.div>
      </motion.div>
    </AuthShell>
  )
}
