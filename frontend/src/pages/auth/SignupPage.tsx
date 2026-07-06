import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { User, Mail, Lock, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/context/AuthContext'
import { AuthShell } from '@/components/auth/AuthShell'
import { FormField } from '@/components/auth/FormField'
import { PasswordStrengthBar } from '@/components/auth/PasswordStrengthBar'

const CARD   = { hidden: { opacity:0, y:24, scale:0.98 }, visible: { opacity:1, y:0, scale:1, transition:{ duration:0.45, ease:[0.25,0.46,0.45,0.94] } } }
const STAGGER = { visible: { transition: { staggerChildren:0.07, delayChildren:0.1 } } }
const ITEM    = { hidden: { opacity:0, y:10 }, visible: { opacity:1, y:0, transition:{ duration:0.35 } } }

interface Fields { fullName:string; email:string; password:string; confirm:string }
interface Errors  { fullName?:string; email?:string; password?:string; confirm?:string }

export default function SignupPage() {
  const { register, isLoading } = useAuth()
  const navigate = useNavigate()
  const [fields,  setFields]  = useState<Fields>({ fullName:'', email:'', password:'', confirm:'' })
  const [errors,  setErrors]  = useState<Errors>({})
  const [success, setSuccess] = useState(false)

  const set = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFields(prev => ({ ...prev, [k]: e.target.value }))
    setErrors(prev => ({ ...prev, [k]: undefined }))
  }

  const validate = (): boolean => {
    const e: Errors = {}
    if (!fields.fullName.trim())                                e.fullName = 'Full name is required'
    else if (fields.fullName.trim().length < 2)                 e.fullName = 'Name must be at least 2 characters'
    if (!fields.email)                                          e.email    = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(fields.email))               e.email    = 'Enter a valid email'
    if (!fields.password)                                       e.password = 'Password is required'
    else if (fields.password.length < 8)                        e.password = 'At least 8 characters required'
    if (!fields.confirm)                                        e.confirm  = 'Please confirm your password'
    else if (fields.confirm !== fields.password)                e.confirm  = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (evt: React.FormEvent) => {
    evt.preventDefault()
    if (!validate()) return
    try {
      await register(fields.fullName.trim(), fields.email, fields.password)
      setSuccess(true)
      setTimeout(() => { navigate('/') }, 1800)
      toast.success('Account created! Check your email to verify 🎉')
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Registration failed'
      toast.error(msg)
      if (msg.toLowerCase().includes('email')) setErrors({ email: msg })
    }
  }

  if (success) {
    return (
      <AuthShell>
        <motion.div
          initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }}
          className="text-center py-12"
        >
          <motion.div
            initial={{ scale:0 }} animate={{ scale:1 }}
            transition={{ type:'spring', stiffness:200, delay:0.1 }}
            className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle2 size={40} className="text-emerald-400" />
          </motion.div>
          <motion.h2 initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.25 }}
            className="text-2xl font-bold text-white mb-2">
            You're in!
          </motion.h2>
          <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.35 }}
            className="text-slate-400 text-sm">
            Account created. Redirecting to your dashboard…
          </motion.p>
          <motion.div initial={{ scaleX:0 }} animate={{ scaleX:1 }} transition={{ delay:0.4, duration:1.5 }}
            className="h-0.5 bg-gradient-to-r from-brand-500 to-emerald-500 rounded-full mt-8 origin-left" />
        </motion.div>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <motion.div variants={CARD} initial="hidden" animate="visible">
        <motion.div variants={STAGGER} initial="hidden" animate="visible" className="mb-6">
          <motion.h1 variants={ITEM} className="text-2xl font-bold text-white">Create account</motion.h1>
          <motion.p variants={ITEM} className="text-slate-400 mt-1.5 text-sm">
            Start analyzing data with AI — free forever
          </motion.p>
        </motion.div>

        <motion.form onSubmit={handleSubmit} variants={STAGGER} initial="hidden" animate="visible"
          className="mt-5 space-y-4" noValidate>

          <motion.div variants={ITEM}>
            <FormField label="Full Name" type="text" placeholder="Jane Smith"
              value={fields.fullName} onChange={set('fullName')} error={errors.fullName}
              icon={<User size={15} />} autoComplete="name" />
          </motion.div>

          <motion.div variants={ITEM}>
            <FormField label="Email address" type="email" placeholder="you@company.com"
              value={fields.email} onChange={set('email')} error={errors.email}
              icon={<Mail size={15} />} autoComplete="email" />
          </motion.div>

          <motion.div variants={ITEM}>
            <FormField label="Password" type="password" placeholder="8+ characters"
              value={fields.password} onChange={set('password')} error={errors.password}
              icon={<Lock size={15} />} autoComplete="new-password" />
            <PasswordStrengthBar password={fields.password} />
          </motion.div>

          <motion.div variants={ITEM}>
            <FormField label="Confirm Password" type="password" placeholder="Re-enter password"
              value={fields.confirm} onChange={set('confirm')} error={errors.confirm}
              icon={<Lock size={15} />} autoComplete="new-password" />
          </motion.div>

          <motion.div variants={ITEM}>
            <motion.button type="submit" disabled={isLoading}
              whileHover={{ scale: isLoading ? 1 : 1.01 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-sm mt-1 relative overflow-hidden"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-white/10 to-brand-400/0"
                animate={{ x:['-100%','100%'] }}
                transition={{ duration:2, repeat:Infinity, repeatDelay:1 }}
              />
              {isLoading
                ? <><Loader2 size={16} className="animate-spin" /> Creating account…</>
                : <>Create account <ArrowRight size={16} /></>
              }
            </motion.button>
          </motion.div>
        </motion.form>

        <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.55 }}
          className="text-center text-sm text-slate-500 mt-5">
          Already have an account?{' '}
          <Link to="/auth/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">Sign in</Link>
        </motion.p>
      </motion.div>
    </AuthShell>
  )
}
