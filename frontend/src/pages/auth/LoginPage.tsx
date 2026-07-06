import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/context/AuthContext'
import { AuthShell } from '@/components/auth/AuthShell'
import { FormField } from '@/components/auth/FormField'

const CARD = {
  hidden:  { opacity: 0, y: 24, scale: 0.98 },
  visible: { opacity: 1, y: 0,  scale: 1,
    transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } },
}
const STAGGER = {
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
}
const ITEM = {
  hidden:  { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
}

interface Errors { email?: string; password?: string }

export default function LoginPage() {
  const { login, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as any)?.from?.pathname || '/app'

  const [email,      setEmail]      = useState('')
  const [password,   setPassword]   = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [errors,     setErrors]     = useState<Errors>({})

  const validate = (): boolean => {
    const e: Errors = {}
    if (!email)                            e.email    = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(email)) e.email    = 'Enter a valid email'
    if (!password)                         e.password = 'Password is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (evt: React.FormEvent) => {
    evt.preventDefault()
    if (!validate()) return
    try {
      await login(email, password, rememberMe)
      toast.success('Welcome back! 👋')
      navigate(from, { replace: true })
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Invalid email or password'
      toast.error(msg)
      if (msg.toLowerCase().includes('email'))    setErrors({ email: msg })
      else if (msg.toLowerCase().includes('pass')) setErrors({ password: msg })
    }
  }

  return (
    <AuthShell>
      <motion.div variants={CARD} initial="hidden" animate="visible">
        {/* Header */}
        <motion.div variants={STAGGER} initial="hidden" animate="visible" className="mb-7">
          <motion.h1 variants={ITEM} className="text-2xl font-bold text-white">
            Welcome back
          </motion.h1>
          <motion.p variants={ITEM} className="text-slate-400 mt-1.5 text-sm">
            Sign in to your DataMind AI account
          </motion.p>
        </motion.div>

        {/* Form */}
        <motion.form
          onSubmit={handleSubmit}
          variants={STAGGER} initial="hidden" animate="visible"
          className="mt-5 space-y-4"
          noValidate
        >
          <motion.div variants={ITEM}>
            <FormField
              label="Email address"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: undefined })) }}
              error={errors.email}
              icon={<Mail size={15} />}
              autoComplete="email"
            />
          </motion.div>

          <motion.div variants={ITEM}>
            <FormField
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: undefined })) }}
              error={errors.password}
              icon={<Lock size={15} />}
              autoComplete="current-password"
            />
          </motion.div>

          {/* Remember + Forgot */}
          <motion.div variants={ITEM} className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div
                onClick={() => setRememberMe(v => !v)}
                className={`w-4 h-4 rounded border flex items-center justify-center transition-all duration-200 cursor-pointer ${
                  rememberMe
                    ? 'bg-brand-500 border-brand-500'
                    : 'bg-transparent border-white/20 group-hover:border-white/40'
                }`}
              >
                {rememberMe && (
                  <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} width="10" height="10" viewBox="0 0 10 10">
                    <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </motion.svg>
                )}
              </div>
              <span className="text-sm text-slate-400 select-none">Remember me</span>
            </label>
            <Link
              to="/auth/forgot-password"
              className="text-sm text-brand-400 hover:text-brand-300 transition-colors font-medium"
            >
              Forgot password?
            </Link>
          </motion.div>

          {/* Submit */}
          <motion.div variants={ITEM}>
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: isLoading ? 1 : 1.01 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-sm mt-2 relative overflow-hidden"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-white/10 to-brand-400/0"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              />
              {isLoading
                ? <><Loader2 size={16} className="animate-spin" /> Signing in…</>
                : <>Sign in <ArrowRight size={16} /></>
              }
            </motion.button>
          </motion.div>
        </motion.form>

        {/* Sign up link */}
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="text-center text-sm text-slate-500 mt-6"
        >
          Don't have an account?{' '}
          <Link to="/auth/signup" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
            Create one free
          </Link>
        </motion.p>
      </motion.div>
    </AuthShell>
  )
}
