import { Menu, Bell, Search, Sparkles } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useDatasetStore } from '@/store/datasetStore'
import { useAuth } from '@/context/AuthContext'
import { getInitials } from '@/lib/utils'

const PAGE_TITLES: Record<string, string> = {
  '/app':          'Dashboard',
  '/app/chat':     'AI Chat',
  '/app/forecast': 'Forecasting',
  '/app/reports':  'Reports',
  '/app/settings': 'Settings',
}

const PAGE_ICONS: Record<string, string> = {
  '/':         '⚡',
  '/chat':     '✦',
  '/forecast': '📈',
  '/reports':  '📄',
  '/settings': '⚙',
}

export default function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { activeDataset } = useDatasetStore()
  const { user } = useAuth()

  const matchedEntry = Object.entries(PAGE_TITLES)
    .find(([path]) => location.pathname === path || location.pathname.startsWith(path + '/'))
  const title = matchedEntry?.[1] ?? 'DataMind AI'
  const icon  = PAGE_ICONS[matchedEntry?.[0] ?? '/'] ?? '⚡'

  return (
    <header
      className="h-[60px] flex items-center gap-3 px-4 md:px-6 shrink-0"
      style={{
        background: 'rgba(10,0,18,0.75)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(168,0,255,0.12)',
      }}
    >
      {/* ── Hamburger ─────────────────────────────────────────────── */}
      <button
        onClick={onMenuClick}
        className="transition-all p-2 rounded-xl group"
        style={{ color: '#7060A0' }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.color = 'white'
          ;(e.currentTarget as HTMLElement).style.background = 'rgba(168,0,255,0.12)'
          ;(e.currentTarget as HTMLElement).style.boxShadow = '0 0 12px rgba(168,0,255,0.2)'
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.color = '#7060A0'
          ;(e.currentTarget as HTMLElement).style.background = 'transparent'
          ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
        }}
      >
        <Menu size={20} />
      </button>

      {/* ── Page title ────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center gap-2.5">
        <span className="text-lg leading-none" aria-hidden>{icon}</span>
        <div>
          <h1 className="text-[15px] font-bold text-white leading-tight tracking-tight">{title}</h1>
          {activeDataset && (
            <p className="text-[11px] hidden md:block leading-none mt-0.5" style={{ color: '#7060A0' }}>
              {activeDataset.name} · {activeDataset.rows?.toLocaleString()} rows · {activeDataset.columns} cols
            </p>
          )}
        </div>
      </div>

      {/* ── Search bar ────────────────────────────────────────────── */}
      <div
        className="hidden md:flex items-center gap-2 px-3 py-2 rounded-2xl w-56 transition-all group"
        style={{
          background: 'rgba(168,0,255,0.06)',
          border: '1px solid rgba(168,0,255,0.14)',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(168,0,255,0.3)'
          ;(e.currentTarget as HTMLElement).style.background = 'rgba(168,0,255,0.1)'
        }}
        onMouseLeave={e => {
          ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(168,0,255,0.14)'
          ;(e.currentTarget as HTMLElement).style.background = 'rgba(168,0,255,0.06)'
        }}
      >
        <Search size={13} style={{ color: '#7060A0', flexShrink: 0 }} />
        <input
          placeholder="Search datasets…"
          className="bg-transparent text-sm outline-none w-full"
          style={{ color: '#C7B6FF' }}
          onFocus={e => {
            const parent = e.currentTarget.parentElement!
            parent.style.borderColor = 'rgba(168,0,255,0.5)'
            parent.style.boxShadow   = '0 0 0 3px rgba(168,0,255,0.12)'
          }}
          onBlur={e => {
            const parent = e.currentTarget.parentElement!
            parent.style.borderColor = 'rgba(168,0,255,0.14)'
            parent.style.boxShadow   = 'none'
          }}
        />
        <kbd
          className="hidden lg:inline-block text-[10px] px-1.5 py-0.5 rounded-lg font-mono shrink-0"
          style={{ background: 'rgba(168,0,255,0.12)', color: '#7060A0', border: '1px solid rgba(168,0,255,0.2)' }}>
          ⌘K
        </kbd>
      </div>

      {/* ── Notification bell ─────────────────────────────────────── */}
      <button
        className="relative p-2 rounded-xl transition-all"
        style={{ color: '#7060A0' }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.color = 'white'
          ;(e.currentTarget as HTMLElement).style.background = 'rgba(168,0,255,0.12)'
          ;(e.currentTarget as HTMLElement).style.boxShadow = '0 0 12px rgba(168,0,255,0.2)'
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.color = '#7060A0'
          ;(e.currentTarget as HTMLElement).style.background = 'transparent'
          ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
        }}
      >
        <Bell size={18} />
        {/* Live indicator */}
        <span
          className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
          style={{ background: '#FF2D7A', boxShadow: '0 0 8px #FF2D7A, 0 0 3px #FF2D7A' }}
        />
      </button>

      {/* ── Avatar / Profile ──────────────────────────────────────── */}
      <button
        onClick={() => navigate('/app/settings')}
        title="Profile & Settings"
        className="relative flex items-center justify-center shrink-0 transition-all"
        style={{ width: 36, height: 36, borderRadius: '50%' }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.boxShadow = '0 0 20px rgba(168,0,255,0.7), 0 0 40px rgba(255,45,122,0.25)'
          ;(e.currentTarget as HTMLElement).style.transform = 'scale(1.08)'
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.boxShadow = '0 0 12px rgba(168,0,255,0.45)'
          ;(e.currentTarget as HTMLElement).style.transform = 'scale(1)'
        }}
      >
        {/* Outer glow ring */}
        <span
          className="absolute inset-0 rounded-full animate-pulse"
          style={{ background: 'linear-gradient(135deg,#7B2FF7,#F107A3)', opacity: 0.35, filter: 'blur(4px)' }}
        />
        <span
          className="relative w-full h-full rounded-full flex items-center justify-center text-[11px] font-bold text-white"
          style={{
            background: 'linear-gradient(135deg,#7B2FF7,#F107A3)',
            boxShadow: '0 0 12px rgba(168,0,255,0.45)',
            border: '1.5px solid rgba(255,255,255,0.18)',
          }}>
          {user ? getInitials(user.fullName || user.email) : <Sparkles size={14} />}
        </span>
      </button>
    </header>
  )
}
