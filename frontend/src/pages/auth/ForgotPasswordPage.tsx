import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, ArrowLeft, Loader2, Send, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { authService } from '@/services/authService'
import { AuthShell } from '@/components/auth/AuthShell'
import { FormField } from '@/components/auth/FormField'

const CARD  = { hidden:{ opacity:0, y:24 }, visible:{ opacity:1, y:0, transition:{ duration:0.45, ease:[0.25,0.46,0.45,0.94] } } }
const ITEM  = { hidden:{ opacity:0, y:10 }, visible:{ opacity:1, y:0, transition:{ duration:0.32 } } }

export default function ForgotPasswordPage() {
  const [email,     setEmail]     = useState('')
  const [error,     setError]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (evt: React.FormEvent) => {
    evt.preventDefault()
    if (!email) { setError('Email is required'); return }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Enter a valid email'); return }

    setLoading(true)
    try {
      await authService.forgotPassword(email)
      setSubmitted(true)
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell>
      <AnimatePresence mode="wait">
        {submitted ? (
          <motion.div key="success"
            initial={{ opacity:0, scale:0.92 }} animate={{ opacity:1, scale:1 }}
            className="text-center py-8"
          >
            <motion.div
              initial={{ scale:0 }} animate={{ scale:1 }}
              transition={{ type:'spring', stiffness:200, delay:0.1 }}
              className="w-18 h-18 w-[72px] h-[72px] rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center mx-auto mb-5"
            >
              <CheckCircle2 size={36} className="text-brand-400" />
            </motion.div>
            <motion.h2 initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
              className="text-xl font-bold text-white mb-2">
              Check your inbox
            </motion.h2>
            <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.3 }}
              className="text-slate-400 text-sm leading-relaxed mb-6">
              We've sent a password reset link to <strong className="text-slate-200">{email}</strong>.
              The link expires in 1 hour.
            </motion.p>
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.4 }}
              className="space-y-3">
              <button
                onClick={() => { setSubmitted(false); setEmail('') }}
                className="btn-ghost w-full text-sm py-2.5"
              >
                Try a different email
              </button>
              <Link to="/auth/login" className="block text-sm text-slate-500 hover:text-slate-300 transition-colors">
                ← Back to sign in
              </Link>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div key="form" variants={CARD} initial="hidden" animate="visible">
            <motion.div variants={{ visible:{ transition:{ staggerChildren:0.07 } } }} initial="hidden" animate="visible"
              className="mb-7">
              <motion.div variants={ITEM}>
                <div className="w-12 h-12 rounded-2xl bg-brand-500/15 border border-brand-500/20 flex items-center justify-center mb-5">
                  <Send size={22} className="text-brand-400" />
                </div>
              </motion.div>
              <motion.h1 variants={ITEM} className="text-2xl font-bold text-white">Forgot password?</motion.h1>
              <motion.p variants={ITEM} className="text-slate-400 mt-1.5 text-sm leading-relaxed">
                No worries! Enter your email and we'll send you a reset link.
              </motion.p>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <FormField
                label="Email address" type="email" placeholder="you@company.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                error={error}
                icon={<Mail size={15} />}
                autoComplete="email"
              />
              <motion.button type="submit" disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.01 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-sm"
              >
                {loading
                  ? <><Loader2 size={16} className="animate-spin" /> Sending…</>
                  : <><Send size={15} /> Send reset link</>
                }
              </motion.button>
            </form>

            <Link to="/auth/login"
              className="flex items-center justify-center gap-2 mt-5 text-sm text-slate-500 hover:text-slate-300 transition-colors">
              <ArrowLeft size={14} /> Back to sign in
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthShell>
  )
}
