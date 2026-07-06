import { useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import {
  BarChart3, MessageSquare, TrendingUp, Brain, FileText, ShieldCheck,
  ArrowRight, Sparkles, Upload, ChevronRight, Zap, Database,
  CheckCircle, Menu, X
} from 'lucide-react'
import { useState } from 'react'

/* ── Fade-in animation variant ────────────────────────────────────────────── */
const fadeUp = (delay = 0) => ({
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1], delay } },
})

/* ── Galaxy canvas background ─────────────────────────────────────────────── */
function GalaxyBg() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current!
    const ctx = canvas.getContext('2d')!
    let raf: number
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)

    // Stars
    const stars = Array.from({ length: 220 }, () => ({
      x: Math.random(), y: Math.random(),
      r: Math.random() * 1.4 + 0.2,
      a: Math.random(),
      speed: Math.random() * 0.004 + 0.001,
    }))
    // Particles
    const particles = Array.from({ length: 55 }, () => ({
      x: Math.random(), y: Math.random(),
      vx: (Math.random() - 0.5) * 0.0003,
      vy: (Math.random() - 0.5) * 0.0003,
      r: Math.random() * 2.5 + 0.8,
      hue: Math.random() > 0.5 ? 275 : 320,
    }))

    let t = 0
    const draw = () => {
      t += 0.008
      const W = canvas.width, H = canvas.height
      ctx.clearRect(0, 0, W, H)

      // Deep space gradient
      const bg = ctx.createRadialGradient(W*0.5, H*0.3, 0, W*0.5, H*0.3, W*0.9)
      bg.addColorStop(0, '#1a0830')
      bg.addColorStop(0.45, '#0d0520')
      bg.addColorStop(1, '#060311')
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)

      // Nebula blobs
      const blobs: [number,number,number,number,number,number][] = [
        [0.22,0.25,0.28, 120,40,200],
        [0.78,0.18,0.22, 180,0,255],
        [0.55,0.65,0.18, 280,80,180],
      ]
      blobs.forEach(([cx,cy,rad,h,s,l]) => {
        const g = ctx.createRadialGradient(cx*W,cy*H,0,cx*W,cy*H,rad*W)
        g.addColorStop(0, `hsla(${h},${s}%,${l}%,0.13)`)
        g.addColorStop(1, 'transparent')
        ctx.fillStyle = g; ctx.beginPath()
        ctx.arc(cx*W, cy*H, rad*W, 0, Math.PI*2); ctx.fill()
      })

      // Stars twinkle
      stars.forEach(s => {
        s.a = 0.3 + 0.7 * Math.abs(Math.sin(t * s.speed * 80))
        ctx.beginPath()
        ctx.arc(s.x*W, s.y*H, s.r, 0, Math.PI*2)
        ctx.fillStyle = `rgba(255,255,255,${s.a})`
        ctx.fill()
      })

      // Floating particles
      particles.forEach(p => {
        p.x = (p.x + p.vx + 1) % 1
        p.y = (p.y + p.vy + 1) % 1
        const gp = ctx.createRadialGradient(p.x*W,p.y*H,0,p.x*W,p.y*H,p.r*3)
        gp.addColorStop(0, `hsla(${p.hue},90%,70%,0.7)`)
        gp.addColorStop(1, 'transparent')
        ctx.fillStyle = gp; ctx.beginPath()
        ctx.arc(p.x*W, p.y*H, p.r*3, 0, Math.PI*2); ctx.fill()
      })

      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={ref} className="fixed inset-0 z-0 pointer-events-none" />
}

/* ── Navbar ────────────────────────────────────────────────────────────────── */
function Navbar() {
  const [open, setOpen] = useState(false)
  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        background: 'rgba(8,4,20,0.75)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(168,0,255,0.12)',
      }}
    >
      <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#7C3AED,#EC4899)', boxShadow: '0 0 14px rgba(124,58,237,0.5)' }}>
            <Sparkles size={16} className="text-white" />
          </div>
          <span className="text-[15px] font-bold text-white tracking-tight">DataMind <span style={{ color: '#A855F7' }}>AI</span></span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {['Features','How It Works','About'].map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(/ /g,'-')}`}
              className="text-sm font-medium transition-colors"
              style={{ color: '#9CA3AF' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'white')}
              onMouseLeave={e => (e.currentTarget.style.color = '#9CA3AF')}>
              {l}
            </a>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <Link to="/auth/login"
            className="text-sm font-semibold px-4 py-2 rounded-xl border transition-all"
            style={{ color: '#C4B5FD', borderColor: 'rgba(124,58,237,0.4)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,0.1)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
            Login
          </Link>
          <Link to="/auth/signup"
            className="text-sm font-semibold px-4 py-2 rounded-xl text-white transition-all"
            style={{ background: 'linear-gradient(135deg,#7C3AED,#EC4899)', boxShadow: '0 0 16px rgba(124,58,237,0.35)' }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
            Sign Up
          </Link>
        </div>

        {/* Mobile menu button */}
        <button className="md:hidden text-white p-1" onClick={() => setOpen(!open)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
            className="md:hidden px-5 pb-5 space-y-3"
            style={{ background: 'rgba(8,4,20,0.97)', borderTop: '1px solid rgba(124,58,237,0.15)' }}>
            {['Features','How It Works','About'].map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(/ /g,'-')}`}
                className="block py-2 text-sm font-medium" style={{ color: '#C4B5FD' }}
                onClick={() => setOpen(false)}>{l}</a>
            ))}
            <div className="flex gap-3 pt-2">
              <Link to="/auth/login" onClick={() => setOpen(false)}
                className="flex-1 text-center text-sm font-semibold py-2.5 rounded-xl border"
                style={{ color:'#C4B5FD', borderColor:'rgba(124,58,237,0.4)' }}>Login</Link>
              <Link to="/auth/signup" onClick={() => setOpen(false)}
                className="flex-1 text-center text-sm font-semibold py-2.5 rounded-xl text-white"
                style={{ background:'linear-gradient(135deg,#7C3AED,#EC4899)' }}>Sign Up</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}

/* ── Dashboard Mockup ─────────────────────────────────────────────────────── */
function DashboardMockup() {
  return (
    <div className="relative w-full max-w-[580px] mx-auto select-none"
      style={{ filter: 'drop-shadow(0 30px 80px rgba(124,58,237,0.35))' }}>
      {/* Outer glow */}
      <div className="absolute inset-0 rounded-2xl opacity-40 blur-3xl"
        style={{ background: 'linear-gradient(135deg,#7C3AED,#EC4899)' }} />

      <div className="relative rounded-2xl overflow-hidden border"
        style={{ background:'rgba(15,8,32,0.92)', backdropFilter:'blur(20px)', borderColor:'rgba(124,58,237,0.3)' }}>

        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor:'rgba(124,58,237,0.15)', background:'rgba(124,58,237,0.06)' }}>
          <div className="flex gap-1.5">
            {['#EF4444','#F59E0B','#10B981'].map(c => (
              <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ background:c }} />
            ))}
          </div>
          <span className="ml-2 text-xs font-semibold" style={{ color:'#A78BFA' }}>DataMind AI — Analytics Dashboard</span>
        </div>

        <div className="p-4 space-y-3">
          {/* KPI row */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label:'Total Revenue', val:'$2.45M', change:'+18%', up:true },
              { label:'Total Orders',  val:'18,342', change:'+12%', up:true },
              { label:'Total Profit',  val:'$482K',  change:'+9%',  up:true },
              { label:'Growth Rate',   val:'23.6%',  change:'+4.2%',up:true },
            ].map(k => (
              <div key={k.label} className="rounded-xl p-2.5"
                style={{ background:'rgba(124,58,237,0.1)', border:'1px solid rgba(124,58,237,0.2)' }}>
                <p className="text-[9px] mb-1" style={{ color:'#9CA3AF' }}>{k.label}</p>
                <p className="text-xs font-bold text-white">{k.val}</p>
                <p className="text-[9px] mt-0.5" style={{ color: k.up ? '#34D399':'#F87171' }}>{k.change}</p>
              </div>
            ))}
          </div>

          {/* Chart + Pie row */}
          <div className="grid grid-cols-3 gap-2">
            {/* Line chart */}
            <div className="col-span-2 rounded-xl p-3"
              style={{ background:'rgba(124,58,237,0.08)', border:'1px solid rgba(124,58,237,0.15)' }}>
              <p className="text-[9px] font-semibold mb-2" style={{ color:'#C4B5FD' }}>Revenue Over Time</p>
              <svg viewBox="0 0 200 60" className="w-full h-14">
                <defs>
                  <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.4"/>
                    <stop offset="100%" stopColor="#7C3AED" stopOpacity="0"/>
                  </linearGradient>
                </defs>
                <path d="M0,50 C20,45 35,40 50,30 C65,20 75,35 90,25 C105,15 115,28 130,18 C145,8 160,22 175,12 C185,6 195,8 200,5"
                  fill="none" stroke="#A855F7" strokeWidth="1.8" />
                <path d="M0,50 C20,45 35,40 50,30 C65,20 75,35 90,25 C105,15 115,28 130,18 C145,8 160,22 175,12 C185,6 195,8 200,5 L200,60 L0,60 Z"
                  fill="url(#lg)" />
              </svg>
            </div>
            {/* Pie chart */}
            <div className="rounded-xl p-3"
              style={{ background:'rgba(236,72,153,0.08)', border:'1px solid rgba(236,72,153,0.15)' }}>
              <p className="text-[9px] font-semibold mb-2" style={{ color:'#F9A8D4' }}>Top Products</p>
              <svg viewBox="0 0 60 60" className="w-full h-14 mx-auto block">
                <circle cx="30" cy="30" r="22" fill="none" stroke="#7C3AED" strokeWidth="12" strokeDasharray="69 69" strokeDashoffset="0"/>
                <circle cx="30" cy="30" r="22" fill="none" stroke="#EC4899" strokeWidth="12" strokeDasharray="35 103" strokeDashoffset="-69"/>
                <circle cx="30" cy="30" r="22" fill="none" stroke="#06B6D4" strokeWidth="12" strokeDasharray="20 118" strokeDashoffset="-104"/>
                <circle cx="30" cy="30" r="14" fill="rgba(15,8,32,0.92)"/>
              </svg>
            </div>
          </div>

          {/* Bottom widgets */}
          <div className="grid grid-cols-3 gap-2">
            {/* AI Insight */}
            <div className="rounded-xl p-3"
              style={{ background:'rgba(124,58,237,0.1)', border:'1px solid rgba(124,58,237,0.25)' }}>
              <div className="flex items-center gap-1.5 mb-2">
                <Brain size={11} style={{ color:'#A855F7' }} />
                <p className="text-[9px] font-semibold" style={{ color:'#C4B5FD' }}>AI Insight</p>
              </div>
              <p className="text-[8px] leading-relaxed" style={{ color:'#9CA3AF' }}>
                North region drove $2.1M revenue — 18% higher than last quarter.
              </p>
              <div className="mt-2 text-[8px] font-semibold" style={{ color:'#A855F7' }}>View Full Insight →</div>
            </div>
            {/* Forecast */}
            <div className="rounded-xl p-3"
              style={{ background:'rgba(236,72,153,0.08)', border:'1px solid rgba(236,72,153,0.2)' }}>
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp size={11} style={{ color:'#EC4899' }} />
                <p className="text-[9px] font-semibold" style={{ color:'#F9A8D4' }}>Sales Forecast</p>
              </div>
              <p className="text-lg font-bold text-white leading-none mt-1">$3.24M</p>
              <p className="text-[8px] mt-1" style={{ color:'#9CA3AF' }}>Predicted Revenue (Next Quarter)</p>
              <svg viewBox="0 0 80 24" className="w-full mt-2">
                <path d="M0,20 C15,18 25,15 35,10 C45,5 55,12 70,4 L70,4" fill="none" stroke="#EC4899" strokeWidth="1.5" strokeDasharray="4 2"/>
              </svg>
            </div>
            {/* AI Chat */}
            <div className="rounded-xl p-3"
              style={{ background:'rgba(6,182,212,0.08)', border:'1px solid rgba(6,182,212,0.2)' }}>
              <div className="flex items-center gap-1.5 mb-2">
                <MessageSquare size={11} style={{ color:'#06B6D4' }} />
                <p className="text-[9px] font-semibold" style={{ color:'#67E8F9' }}>AI Chat</p>
              </div>
              <div className="space-y-1.5">
                <div className="text-[8px] px-2 py-1 rounded-lg" style={{ background:'rgba(124,58,237,0.2)', color:'#C4B5FD' }}>
                  What was Q3 revenue?
                </div>
                <div className="text-[8px] px-2 py-1 rounded-lg" style={{ background:'rgba(6,182,212,0.15)', color:'#A5F3FC' }}>
                  Q3 revenue was $845K, up 14% YoY.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Features data ────────────────────────────────────────────────────────── */
const FEATURES = [
  { icon: BarChart3,    title: 'Automated EDA',        color: '#A855F7', bg: 'rgba(168,85,247,0.12)',
    desc: 'Automatically analyze datasets with charts, statistics, missing values, and correlations.' },
  { icon: MessageSquare,title: 'AI Data Chat',          color: '#EC4899', bg: 'rgba(236,72,153,0.12)',
    desc: 'Ask natural language questions and receive intelligent answers from your uploaded data.' },
  { icon: TrendingUp,   title: 'Sales Forecasting',     color: '#06B6D4', bg: 'rgba(6,182,212,0.12)',
    desc: 'Predict future sales using ARIMA, Prophet, and machine learning forecasting models.' },
  { icon: Brain,        title: 'AI Insights',           color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',
    desc: 'Generate actionable business recommendations and discover hidden trends in your data.' },
  { icon: FileText,     title: 'Export Reports',        color: '#34D399', bg: 'rgba(52,211,153,0.12)',
    desc: 'Create professional PDF reports with charts, statistics, and AI-generated summaries.' },
  { icon: ShieldCheck,  title: 'Secure Authentication', color: '#818CF8', bg: 'rgba(129,140,248,0.12)',
    desc: 'JWT authentication, encrypted passwords, email verification, and enterprise-grade security.' },
]

/* ── Steps data ───────────────────────────────────────────────────────────── */
const STEPS = [
  { icon: Upload,      label: 'Upload Dataset',           desc: 'Upload your CSV sales dataset in seconds.' },
  { icon: Zap,         label: 'AI Processes Data',        desc: 'AI cleans, analyzes, and understands your data.' },
  { icon: BarChart3,   label: 'Explore Dashboard',        desc: 'Explore interactive charts, metrics, and AI insights.' },
  { icon: TrendingUp,  label: 'Forecast Future Sales',    desc: 'Predict future sales using advanced forecasting models.' },
  { icon: FileText,    label: 'Export Reports',           desc: 'Download professional reports and share insights.' },
]

/* ── Main Landing Page ────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden" style={{ background: '#0B0618', fontFamily: "'Inter', sans-serif" }}>
      <GalaxyBg />
      <div className="relative z-10">
        <Navbar />

        {/* ══ HERO ══════════════════════════════════════════════════════════ */}
        <section className="min-h-screen flex items-center pt-20 pb-16">
          <div className="max-w-7xl mx-auto px-5 w-full">
            <div className="grid lg:grid-cols-2 gap-12 items-center">

              {/* Left */}
              <div className="space-y-7">
                {/* Badge */}
                <motion.div variants={fadeUp(0.1)} initial="hidden" animate="visible">
                  <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold"
                    style={{ background:'rgba(124,58,237,0.15)', border:'1px solid rgba(168,85,247,0.35)', color:'#C4B5FD' }}>
                    <span style={{ color:'#F9A8D4' }}>🚀</span> AI-Powered Sales Analytics
                  </span>
                </motion.div>

                {/* Heading */}
                <motion.div variants={fadeUp(0.2)} initial="hidden" animate="visible">
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight">
                    <span className="text-white">Turn Your Sales Data</span>
                    <br />
                    <span className="text-white">Into </span>
                    <span style={{ background:'linear-gradient(135deg,#A855F7,#EC4899)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                      Powerful AI
                    </span>
                    <br />
                    <span className="text-white">Insights</span>
                  </h1>
                </motion.div>

                {/* Description */}
                <motion.p variants={fadeUp(0.3)} initial="hidden" animate="visible"
                  className="text-lg leading-relaxed max-w-lg" style={{ color:'#9CA3AF' }}>
                  Upload your sales datasets, chat with your data using AI, generate automated insights,
                  forecast future sales, and create professional reports in seconds.
                </motion.p>

                {/* Buttons */}
                <motion.div variants={fadeUp(0.4)} initial="hidden" animate="visible" className="flex flex-wrap gap-3">
                  <Link to="/auth/signup"
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl text-white font-semibold text-sm transition-all"
                    style={{ background:'linear-gradient(135deg,#7C3AED,#EC4899)', boxShadow:'0 0 28px rgba(124,58,237,0.45)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform='scale(1.04)'; (e.currentTarget as HTMLElement).style.boxShadow='0 0 40px rgba(124,58,237,0.65)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform='scale(1)'; (e.currentTarget as HTMLElement).style.boxShadow='0 0 28px rgba(124,58,237,0.45)' }}>
                    Get Started Free <ArrowRight size={16} />
                  </Link>
                  <Link to="/auth/login"
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-semibold text-sm transition-all"
                    style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', color:'white', backdropFilter:'blur(10px)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.1)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.06)' }}>
                    Login
                  </Link>
                </motion.div>

                {/* Trust badges */}
                <motion.div variants={fadeUp(0.5)} initial="hidden" animate="visible" className="flex flex-wrap gap-5">
                  {['Secure Authentication','AI Powered','Fast Analysis'].map(b => (
                    <span key={b} className="flex items-center gap-1.5 text-xs font-medium" style={{ color:'#9CA3AF' }}>
                      <CheckCircle size={13} style={{ color:'#34D399' }} /> {b}
                    </span>
                  ))}
                </motion.div>
              </div>

              {/* Right — Dashboard */}
              <motion.div initial={{ opacity:0, x:40, scale:0.96 }} animate={{ opacity:1, x:0, scale:1 }}
                transition={{ duration:0.8, ease:[0.22,1,0.36,1], delay:0.3 }}
                style={{ animation:'float 5s ease-in-out infinite' }}>
                <DashboardMockup />
              </motion.div>
            </div>
          </div>
        </section>

        {/* ══ FEATURES ══════════════════════════════════════════════════════ */}
        <section id="features" className="py-28">
          <div className="max-w-7xl mx-auto px-5">
            <motion.div variants={fadeUp(0)} initial="hidden" whileInView="visible" viewport={{ once:true }}
              className="text-center mb-16 space-y-4">
              <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold"
                style={{ background:'rgba(124,58,237,0.12)', border:'1px solid rgba(168,85,247,0.25)', color:'#C4B5FD' }}>
                POWERFUL FEATURES
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white">Everything You Need to Analyze and Grow</h2>
              <p className="text-lg max-w-xl mx-auto" style={{ color:'#9CA3AF' }}>
                AI-powered tools to help you understand your data, make better decisions,
                and predict future growth with confidence.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {FEATURES.map(({ icon: Icon, title, color, bg, desc }, i) => (
                <motion.div key={title}
                  variants={fadeUp(i * 0.08)} initial="hidden" whileInView="visible" viewport={{ once:true }}
                  whileHover={{ y:-6, scale:1.02 }}
                  transition={{ type:'spring', stiffness:300, damping:20 }}
                  className="group relative rounded-2xl p-6 cursor-default"
                  style={{
                    background:'rgba(255,255,255,0.04)',
                    border:'1px solid rgba(255,255,255,0.08)',
                    backdropFilter:'blur(12px)',
                    transition:'box-shadow 0.3s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 0 30px ${color}25, 0 0 60px ${color}10`)}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: bg, border:`1px solid ${color}30` }}>
                    <Icon size={22} style={{ color }} />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color:'#9CA3AF' }}>{desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ HOW IT WORKS ══════════════════════════════════════════════════ */}
        <section id="how-it-works" className="py-28">
          <div className="max-w-7xl mx-auto px-5">
            <motion.div variants={fadeUp(0)} initial="hidden" whileInView="visible" viewport={{ once:true }}
              className="text-center mb-16 space-y-4">
              <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold"
                style={{ background:'rgba(236,72,153,0.1)', border:'1px solid rgba(236,72,153,0.25)', color:'#F9A8D4' }}>
                HOW IT WORKS
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white">Simple Steps, Powerful Results</h2>
            </motion.div>

            <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative">
              {STEPS.map(({ icon: Icon, label, desc }, i) => (
                <div key={label} className="flex lg:flex-col items-center lg:items-center gap-4 lg:gap-0 lg:text-center flex-1">
                  <motion.div
                    variants={fadeUp(i * 0.1)} initial="hidden" whileInView="visible" viewport={{ once:true }}
                    className="relative flex-shrink-0">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center relative z-10"
                      style={{
                        background: 'linear-gradient(135deg,rgba(124,58,237,0.3),rgba(236,72,153,0.2))',
                        border: '1px solid rgba(168,85,247,0.35)',
                        boxShadow: '0 0 20px rgba(124,58,237,0.25)',
                      }}>
                      <Icon size={24} style={{ color:'#C4B5FD' }} />
                      <span className="absolute -top-2 -left-2 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
                        style={{ background:'linear-gradient(135deg,#7C3AED,#EC4899)' }}>{i+1}</span>
                    </div>
                  </motion.div>

                  {/* Arrow between steps */}
                  {i < STEPS.length - 1 && (
                    <div className="hidden lg:flex items-center flex-1 justify-center">
                      <motion.div animate={{ x:[0,6,0] }} transition={{ duration:1.5, repeat:Infinity }}
                        style={{ color:'rgba(168,85,247,0.5)', fontSize:20 }}>›</motion.div>
                      <div className="flex-1 mx-1 border-t border-dashed" style={{ borderColor:'rgba(168,85,247,0.25)' }} />
                      <motion.div animate={{ x:[0,6,0] }} transition={{ duration:1.5, repeat:Infinity, delay:0.3 }}
                        style={{ color:'rgba(168,85,247,0.5)', fontSize:20 }}>›</motion.div>
                    </div>
                  )}

                  <motion.div variants={fadeUp(i*0.1 + 0.1)} initial="hidden" whileInView="visible" viewport={{ once:true }}
                    className="lg:mt-4 space-y-1">
                    <p className="text-sm font-bold text-white">{label}</p>
                    <p className="text-xs leading-relaxed max-w-[140px] mx-auto" style={{ color:'#9CA3AF' }}>{desc}</p>
                  </motion.div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ CTA ═══════════════════════════════════════════════════════════ */}
        <section className="py-28">
          <div className="max-w-4xl mx-auto px-5">
            <motion.div variants={fadeUp(0)} initial="hidden" whileInView="visible" viewport={{ once:true }}
              className="relative rounded-3xl overflow-hidden p-12 text-center"
              style={{
                background:'rgba(255,255,255,0.04)',
                border:'1px solid rgba(168,85,247,0.25)',
                backdropFilter:'blur(20px)',
              }}>
              {/* Glow */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] opacity-20 blur-3xl rounded-full"
                  style={{ background:'linear-gradient(135deg,#7C3AED,#EC4899)' }} />
              </div>

              <div className="relative space-y-6">
                <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
                  style={{ background:'linear-gradient(135deg,#7C3AED,#EC4899)', boxShadow:'0 0 30px rgba(124,58,237,0.5)' }}>
                  <Sparkles size={28} className="text-white" />
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-white">Ready to Unlock the Power of AI?</h2>
                <p className="text-lg max-w-lg mx-auto" style={{ color:'#9CA3AF' }}>
                  Start transforming your sales data into intelligent business decisions today.
                </p>
                <div className="flex flex-wrap justify-center gap-3 pt-2">
                  <Link to="/auth/signup"
                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl text-white font-semibold text-sm transition-all"
                    style={{ background:'linear-gradient(135deg,#7C3AED,#EC4899)', boxShadow:'0 0 28px rgba(124,58,237,0.45)' }}
                    onMouseEnter={e => (e.currentTarget.style.transform='scale(1.04)')}
                    onMouseLeave={e => (e.currentTarget.style.transform='scale(1)')}>
                    Get Started Free <ArrowRight size={16} />
                  </Link>
                  <Link to="/auth/login"
                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl font-semibold text-sm transition-all"
                    style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', color:'white' }}
                    onMouseEnter={e => (e.currentTarget.style.background='rgba(255,255,255,0.1)')}
                    onMouseLeave={e => (e.currentTarget.style.background='rgba(255,255,255,0.06)')}>
                    Login
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ══ FOOTER ════════════════════════════════════════════════════════ */}
        <footer id="about" className="border-t py-12" style={{ borderColor:'rgba(124,58,237,0.15)' }}>
          <div className="max-w-7xl mx-auto px-5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              {/* Brand */}
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background:'linear-gradient(135deg,#7C3AED,#EC4899)' }}>
                  <Sparkles size={16} className="text-white" />
                </div>
                <span className="text-[15px] font-bold text-white">DataMind <span style={{ color:'#A855F7' }}>AI</span></span>
              </div>

              {/* Nav links */}
              <div className="flex items-center gap-6">
                {['Features','How It Works','About'].map(l => (
                  <a key={l} href={`#${l.toLowerCase().replace(/ /g,'-')}`}
                    className="text-sm transition-colors" style={{ color:'#6B7280' }}
                    onMouseEnter={e => (e.currentTarget.style.color='white')}
                    onMouseLeave={e => (e.currentTarget.style.color='#6B7280')}>
                    {l}
                  </a>
                ))}
              </div>

              {/* CTA */}
              <div className="flex items-center gap-3">
                <Link to="/auth/login"
                  className="text-sm font-medium transition-colors" style={{ color:'#9CA3AF' }}
                  onMouseEnter={e => (e.currentTarget.style.color='white')}
                  onMouseLeave={e => (e.currentTarget.style.color='#9CA3AF')}>
                  Login
                </Link>
                <Link to="/auth/signup"
                  className="text-sm font-semibold px-4 py-2 rounded-xl text-white transition-all"
                  style={{ background:'linear-gradient(135deg,#7C3AED,#EC4899)' }}
                  onMouseEnter={e => (e.currentTarget.style.transform='scale(1.04)')}
                  onMouseLeave={e => (e.currentTarget.style.transform='scale(1)')}>
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Float animation */}
      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
      `}</style>
    </div>
  )
}
