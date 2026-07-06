import { NavLink, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  LayoutDashboard, MessageSquare, TrendingUp, FileText,
  Settings, LogOut, Database, ChevronRight, Sparkles, X, ShieldAlert,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useDatasetStore } from '@/store/datasetStore'
import { cn, getInitials, truncate } from '@/lib/utils'
import toast from 'react-hot-toast'

const NAV = [
  { to: '/',         icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/chat',     icon: MessageSquare,   label: 'AI Chat'   },
  { to: '/forecast', icon: TrendingUp,      label: 'Forecast'  },
  { to: '/reports',  icon: FileText,        label: 'Reports'   },
  { to: '/settings', icon: Settings,        label: 'Settings'  },
]

interface Props { open: boolean; onClose: () => void }

export default function Sidebar({ open, onClose }: Props) {
  const { user, logout }   = useAuth()
  const { datasets, activeDataset, setActiveDataset } = useDatasetStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    toast.success('Signed out')
    navigate('/auth/login')
  }

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 bg-black/60 z-20 lg:hidden"
            style={{ backdropFilter: 'blur(4px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar panel */}
      <aside
        className={cn(
          'shrink-0 h-full flex flex-col z-30 transition-all duration-300',
          'lg:relative lg:translate-x-0',
          open ? 'w-64' : 'w-0 lg:w-64 overflow-hidden',
        )}
        style={{
          background: 'rgba(12,0,20,0.90)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          borderRight: '1px solid rgba(168,0,255,0.15)',
        }}
      >
        <div style={{ width: 256, height: '100%', display: 'flex', flexDirection: 'column' }}>

          {/* ── Logo ───────────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: '1px solid rgba(168,0,255,0.1)' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg,#7B2FF7,#F107A3)',
                  boxShadow: '0 0 18px rgba(168,0,255,0.55)',
                }}>
                <Sparkles size={17} className="text-white" />
              </div>
              <span className="text-[15px] font-bold text-white tracking-tight">DataMind</span>
              <span className="badge-purple text-[10px]">AI</span>
            </div>
            <button onClick={onClose} className="lg:hidden p-1 rounded-lg transition-colors"
              style={{ color: '#8E84A8' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'white')}
              onMouseLeave={e => (e.currentTarget.style.color = '#8E84A8')}>
              <X size={16} />
            </button>
          </div>

          {/* ── Nav ────────────────────────────────────────────────── */}
          <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
            {NAV.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to} end={to === '/'}
                className="block rounded-2xl transition-all duration-200 group"
              >
                {({ isActive }) => (
                  <div
                    className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium"
                    style={isActive ? {
                      background: 'linear-gradient(135deg,rgba(123,47,247,0.3),rgba(241,7,163,0.18))',
                      border: '1px solid rgba(168,0,255,0.35)',
                      boxShadow: '0 0 18px rgba(168,0,255,0.2), inset 0 1px 0 rgba(255,255,255,0.05)',
                      color: 'white',
                    } : { color: '#9080AA' }}
                  >
                    <Icon
                      size={17}
                      style={isActive
                        ? { color: '#D88AFF', filter: 'drop-shadow(0 0 6px rgba(168,0,255,0.9))' }
                        : { color: '#5A3A7A' }}
                    />
                    <span>{label}</span>
                    {isActive && (
                      <ChevronRight size={13} className="ml-auto" style={{ color: '#FF4DA6' }} />
                    )}
                  </div>
                )}
              </NavLink>
            ))}

            {/* Datasets section */}
            {datasets.length > 0 && (
              <div className="pt-5">
                <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest"
                  style={{ color: '#3D1A5A' }}>Recent Datasets</p>
                {datasets.slice(0, 6).map(ds => (
                  <button key={ds.id}
                    onClick={() => { setActiveDataset(ds); navigate(`/dataset/${ds.id}`) }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all duration-150"
                    style={activeDataset?.id === ds.id ? {
                      background: 'rgba(168,0,255,0.12)',
                      color: '#D88AFF',
                      border: '1px solid rgba(168,0,255,0.2)',
                    } : { color: '#7060A0' }}
                    onMouseEnter={e => { if (activeDataset?.id !== ds.id) (e.currentTarget as HTMLElement).style.color = '#C7B6FF' }}
                    onMouseLeave={e => { if (activeDataset?.id !== ds.id) (e.currentTarget as HTMLElement).style.color = '#7060A0' }}
                  >
                    <Database size={11} style={{ color: activeDataset?.id === ds.id ? '#A800FF' : '#3D1A5A', flexShrink: 0 }} />
                    <span className="truncate flex-1 text-left">{truncate(ds.name, 20)}</span>
                    <span className="text-[10px] opacity-60">{(ds.rows / 1000).toFixed(1)}K</span>
                  </button>
                ))}
              </div>
            )}
          </nav>

          {/* ── User ───────────────────────────────────────────────── */}
          <div className="px-3 py-3 space-y-1" style={{ borderTop: '1px solid rgba(168,0,255,0.1)' }}>
            {user && !user.isVerified && (
              <button onClick={() => navigate('/auth/verify-email')}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-colors"
                style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#FBbf24' }}>
                <ShieldAlert size={12} /><span>Verify your email</span>
              </button>
            )}
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl cursor-pointer group transition-all"
              style={{ borderRadius: 16 }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(168,0,255,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ background: 'linear-gradient(135deg,#7B2FF7,#F107A3)', boxShadow: '0 0 10px rgba(168,0,255,0.4)' }}>
                {user ? getInitials(user.fullName || user.email) : 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-white truncate">{user?.fullName || 'User'}</p>
                <p className="text-[11px] truncate capitalize" style={{ color: '#7060A0' }}>{user?.plan} plan</p>
              </div>
              <button onClick={handleLogout} title="Sign out"
                className="opacity-0 group-hover:opacity-100 transition-all p-1 rounded-lg"
                style={{ color: '#5A3A7A' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#FF2D7A')}
                onMouseLeave={e => (e.currentTarget.style.color = '#5A3A7A')}>
                <LogOut size={14} />
              </button>
            </div>
          </div>

        </div>
      </aside>
    </>
  )
}
