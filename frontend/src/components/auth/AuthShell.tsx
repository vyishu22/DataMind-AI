import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, BarChart3, MessageSquare, TrendingUp, ShieldCheck, Zap } from 'lucide-react'

const FEATURES = [
  { icon: BarChart3,     text: 'Automatic EDA & statistics'      },
  { icon: MessageSquare, text: 'Natural language data chat'       },
  { icon: TrendingUp,    text: 'AI forecasting (ARIMA / Prophet)' },
  { icon: ShieldCheck,   text: 'Enterprise-grade security'        },
  { icon: Zap,           text: 'Instant insights & PDF reports'   },
]

const FLOAT_VARIANTS = {
  animate: { y: [0, -8, 0], transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' as const } },
}

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex overflow-hidden" style={{ background: '#08040F' }}>

      {/* ── Left branding panel ─────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-[52%] relative overflow-hidden p-12 xl:p-16">

        {/* Gradient orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full blur-[120px]"
            style={{ background: 'rgba(168,0,255,0.2)' }} />
          <div className="absolute -bottom-32 -right-16 w-[400px] h-[400px] rounded-full blur-[100px]"
            style={{ background: 'rgba(255,45,122,0.15)' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full blur-[80px]"
            style={{ background: 'rgba(123,47,247,0.12)' }} />
          <div className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage: 'linear-gradient(rgba(168,0,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(168,0,255,0.5) 1px,transparent 1px)',
              backgroundSize: '40px 40px',
            }} />
        </div>

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="relative flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#7B2FF7,#F107A3)', boxShadow: '0 0 20px rgba(168,0,255,0.5)' }}>
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <span className="text-xl font-bold text-white tracking-tight">DataMind</span>
            <span className="ml-1.5 badge-purple text-[10px] align-middle">AI</span>
          </div>
        </motion.div>

        {/* Central illustration */}
        <motion.div
          className="relative flex flex-col items-center gap-8 my-auto"
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
        >
          {/* Floating analytics card */}
          <motion.div variants={FLOAT_VARIANTS} animate="animate" className="w-full max-w-sm">
            <div className="rounded-2xl p-5 glow-border"
              style={{ background: 'rgba(20,10,35,0.75)', backdropFilter: 'blur(24px)' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs" style={{ color: '#8E84A8' }}>Dataset Health Score</p>
                  <p className="text-3xl font-bold text-white mt-0.5">
                    87<span className="text-base" style={{ color: '#8E84A8' }}>/100</span>
                  </p>
                </div>
                <div className="w-14 h-14 relative">
                  <svg viewBox="0 0 56 56" className="-rotate-90">
                    <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                    <circle cx="28" cy="28" r="22" fill="none" stroke="#A800FF" strokeWidth="6"
                      strokeLinecap="round" strokeDasharray="138.2" strokeDashoffset="18"
                      style={{ filter: 'drop-shadow(0 0 8px #A800FF)' }} />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold"
                    style={{ color: '#D88AFF' }}>A</div>
                </div>
              </div>
              <div className="flex items-end gap-1.5 h-10">
                {[55, 70, 45, 85, 60, 90, 75, 87].map((h, i) => (
                  <motion.div key={i} className="flex-1 rounded-sm"
                    style={{
                      background: i === 7 ? '#A800FF' : 'rgba(168,0,255,0.25)',
                      height: `${h}%`,
                      boxShadow: i === 7 ? '0 0 8px rgba(168,0,255,0.6)' : 'none',
                    }}
                    initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                    transition={{ delay: 0.4 + i * 0.06, duration: 0.4 }}
                  />
                ))}
              </div>
              <p className="text-xs mt-2" style={{ color: '#8E84A8' }}>8 analyses this week</p>
            </div>
          </motion.div>

          {/* Floating stats pill */}
          <motion.div
            animate={{ y: [0, -5, 0], transition: { duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 } }}
            className="self-end mr-4"
          >
            <div className="rounded-xl px-4 py-2.5 flex items-center gap-3"
              style={{ background: 'rgba(255,45,122,0.1)', border: '1px solid rgba(255,45,122,0.2)', backdropFilter: 'blur(12px)' }}>
              <TrendingUp size={16} style={{ color: '#FF2D7A' }} />
              <div>
                <p className="text-xs" style={{ color: '#8E84A8' }}>Forecast accuracy</p>
                <p className="text-sm font-semibold text-white">94.2% MAPE</p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Features list */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="relative space-y-2.5"
        >
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-4"
            style={{ color: '#4A0070' }}>Everything you need</p>
          {FEATURES.map(({ icon: Icon, text }, i) => (
            <motion.div key={text}
              initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.08 }}
              className="flex items-center gap-3"
            >
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(168,0,255,0.12)', border: '1px solid rgba(168,0,255,0.2)' }}>
                <Icon size={14} style={{ color: '#C95EFF' }} />
              </div>
              <span className="text-sm" style={{ color: '#8E84A8' }}>{text}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* ── Right auth panel ────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 right-0 w-[300px] h-[300px] rounded-full blur-[80px]"
            style={{ background: 'rgba(255,45,122,0.08)' }} />
        </div>

        {/* Mobile logo */}
        <div className="absolute top-6 left-6 lg:hidden flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#7B2FF7,#F107A3)' }}>
            <Sparkles size={16} className="text-white" />
          </div>
          <span className="text-base font-bold text-white">DataMind AI</span>
        </div>

        <div className="w-full max-w-md relative z-10 rounded-[24px] p-8"
          style={{
            background: 'rgba(20,10,35,0.7)',
            backdropFilter: 'blur(32px)',
            WebkitBackdropFilter: 'blur(32px)',
            border: '1px solid rgba(168,0,255,0.12)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}>
          {children}
        </div>
      </div>

    </div>
  )
}
