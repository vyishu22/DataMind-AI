import { useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { User, Shield, CreditCard, LogOut, Mail, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { authService } from '@/services/authService'
import { getInitials } from '@/lib/utils'

export default function SettingsPage() {
  const { user, logout, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [name,  setName]  = useState(user?.fullName || '')
  const [email, setEmail] = useState(user?.email    || '')
  const [resending, setResending] = useState(false)

  const handleSave  = () => toast.success('Settings saved (connect PATCH /api/auth/me)')
  const handleLogout = async () => { await logout(); navigate('/auth/login') }

  const resendVerify = async () => {
    setResending(true)
    try {
      await authService.resendVerification()
      toast.success('Verification email sent!')
    } catch { toast.error('Failed to send') }
    finally { setResending(false) }
  }

  const SECTIONS = [
    {
      icon: User, title: 'Profile',
      content: (
        <div className="space-y-4">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-purple-500 flex items-center justify-center text-2xl font-bold text-white">
              {user ? getInitials(user.fullName || user.email) : 'U'}
            </div>
            <div>
              <p className="font-semibold text-white">{user?.fullName}</p>
              <p className="text-sm text-slate-400">{user?.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="badge-purple">{user?.plan} plan</span>
                {user?.isVerified
                  ? <span className="badge-green flex items-center gap-1"><ShieldCheck size={10} /> Verified</span>
                  : <span className="badge-amber">Unverified</span>
                }
              </div>
            </div>
          </div>
          {!user?.isVerified && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
              <p className="text-sm text-amber-300">Your email is not verified</p>
              <button onClick={resendVerify} disabled={resending}
                className="text-xs text-amber-400 hover:text-amber-300 font-medium underline">
                {resending ? 'Sending…' : 'Resend email'}
              </button>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Display Name</label>
              <input value={name} onChange={e => setName(e.target.value)} className="input text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Email</label>
              <input value={email} onChange={e => setEmail(e.target.value)} className="input text-sm" type="email" />
            </div>
          </div>
          <button onClick={handleSave} className="btn-primary text-sm px-5">Save changes</button>
        </div>
      ),
    },
    {
      icon: CreditCard, title: 'Plan',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name:'Free',  price:'$0/mo',  features:['5 datasets','100 AI queries/mo','Basic charts','PDF reports'], current: user?.plan === 'free'  },
            { name:'Pro',   price:'$29/mo', features:['Unlimited datasets','Unlimited AI queries','All chart types','Priority support','LSTM forecasting'], current: user?.plan === 'pro' },
          ].map(plan => (
            <div key={plan.name} className={`rounded-xl p-4 border ${plan.current ? 'border-brand-500/50 bg-brand-500/10' : 'border-white/10'}`}>
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-white">{plan.name}</p>
                {plan.current && <span className="badge-purple text-xs">Current</span>}
              </div>
              <p className="text-2xl font-bold text-white mb-3">{plan.price}</p>
              <ul className="space-y-1">
                {plan.features.map(f => (
                  <li key={f} className="text-sm text-slate-300 flex gap-2">
                    <span className="text-brand-400">✓</span> {f}
                  </li>
                ))}
              </ul>
              {!plan.current && (
                <button onClick={() => toast.success('Upgrade — connect Stripe')}
                  className="btn-primary w-full mt-4 text-sm">Upgrade to {plan.name}</button>
              )}
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: Shield, title: 'Security',
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">New Password</label>
              <input type="password" className="input text-sm" placeholder="••••••••" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Confirm Password</label>
              <input type="password" className="input text-sm" placeholder="••••••••" />
            </div>
          </div>
          <button onClick={() => toast.success('Connect PATCH /api/auth/reset-password')}
            className="btn-primary text-sm px-5">Update password</button>
          <div className="pt-4 border-t border-white/5">
            <p className="text-sm font-medium text-red-400 mb-3">Danger Zone</p>
            <button onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors">
              <LogOut size={14} /> Sign out of all devices
            </button>
          </div>
        </div>
      ),
    },
  ]

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-white">Settings</h2>
        <p className="text-slate-400 text-sm mt-0.5">Manage your account and preferences</p>
      </div>
      {SECTIONS.map(({ icon: Icon, title, content }, i) => (
        <motion.div key={title}
          initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
          transition={{ delay: i * 0.07 }}
          className="card"
        >
          <div className="flex items-center gap-2 mb-5">
            <Icon size={16} className="text-brand-400" />
            <h3 className="font-semibold text-slate-200">{title}</h3>
          </div>
          {content}
        </motion.div>
      ))}
    </div>
  )
}
