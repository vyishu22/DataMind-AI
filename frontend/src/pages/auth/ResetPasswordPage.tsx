import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, ArrowRight, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { authService } from '@/services/authService'
import { AuthShell } from '@/components/auth/AuthShell'
import { FormField } from '@/components/auth/FormField'
import { PasswordStrengthBar } from '@/components/auth/PasswordStrengthBar'

const CARD = { hidden:{ opacity:0, y:24 }, visible:{ opacity:1, y:0, transition:{ duration:0.45 } } }

interface Errs { password?:string; confirm?:string }

export default function ResetPasswordPage() {
  const [params]    = useSearchParams()
  const navigate    = useNavigate()
  const token       = params.get('token') || ''

  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [errors,    setErrors]    = useState<Errs>({})
  const [loading,   setLoading]   = useState(false)
  const [success,   setSuccess]   = useState(false)

  const validate = () => {
    const e: Errs = {}
    if (!password)              e.password = 'Password is required'
    else if (password.length < 8) e.password = 'At least 8 characters'
    if (!confirm)               e.confirm  = 'Please confirm your password'
    else if (confirm !== password) e.confirm = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (evt: React.FormEvent) => {
    evt.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await authService.resetPassword(token, password, confirm)
      setSuccess(true)
      toast.success('Password reset! Please sign in.')
      setTimeout(() => navigate('/auth/login'), 2000)
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Reset failed. The link may have expired.'
      toast.error(msg)
      if (msg.toLowerCase().includes('expired')) {
        /* show token-expired ui */
      }
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <AuthShell>
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
          className="text-center py-10">
          <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Invalid link</h2>
          <p className="text-slate-400 text-sm mb-6">
            This reset link is missing or invalid. Please request a new one.
          </p>
          <Link to="/auth/forgot-password" className="btn-primary inline-flex items-center gap-2 text-sm px-5 py-2.5">
            Request new link
          </Link>
        </motion.div>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <AnimatePresence mode="wait">
        {success ? (
          <motion.div key="ok"
            initial={{ opacity:0, scale:0.92 }} animate={{ opacity:1, scale:1 }}
            className="text-center py-10">
            <motion.div
              initial={{ scale:0 }} animate={{ scale:1 }}
              transition={{ type:'spring', stiffness:200 }}
              className="w-[72px] h-[72px] rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5"
            >
              <CheckCircle2 size={36} className="text-emerald-400" />
            </motion.div>
            <h2 className="text-xl font-bold text-white mb-2">Password updated!</h2>
            <p className="text-slate-400 text-sm">Redirecting you to sign in…</p>
            <motion.div
              initial={{ scaleX:0 }} animate={{ scaleX:1 }}
              transition={{ delay:0.3, duration:2 }}
              className="h-0.5 bg-gradient-to-r from-emerald-500 to-brand-500 rounded-full mt-6 origin-left"
            />
          </motion.div>
        ) : (
          <motion.div key="form" variants={CARD} initial="hidden" animate="visible">
            <div className="mb-7">
              <div className="w-12 h-12 rounded-2xl bg-brand-500/15 border border-brand-500/20 flex items-center justify-center mb-5">
                <Lock size={22} className="text-brand-400" />
              </div>
              <h1 className="text-2xl font-bold text-white">Set new password</h1>
              <p className="text-slate-400 mt-1.5 text-sm">
                Must be at least 8 characters with a mix of letters, numbers, and symbols.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <FormField
                  label="New password" type="password" placeholder="At least 8 characters"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password:undefined })) }}
                  error={errors.password}
                  icon={<Lock size={15} />}
                  autoComplete="new-password"
                />
                <PasswordStrengthBar password={password} />
              </div>

              <FormField
                label="Confirm new password" type="password" placeholder="Re-enter password"
                value={confirm}
                onChange={e => { setConfirm(e.target.value); setErrors(p => ({ ...p, confirm:undefined })) }}
                error={errors.confirm}
                icon={<Lock size={15} />}
                autoComplete="new-password"
              />

              <motion.button type="submit" disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.01 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-sm mt-2"
              >
                {loading
                  ? <><Loader2 size={16} className="animate-spin" /> Resetting…</>
                  : <>Reset password <ArrowRight size={16} /></>
                }
              </motion.button>
            </form>

            <Link to="/auth/login"
              className="block text-center text-sm text-slate-500 hover:text-slate-300 transition-colors mt-5">
              ← Back to sign in
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthShell>
  )
}
