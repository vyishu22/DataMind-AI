import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { useState } from 'react'

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{
        backgroundImage: `
          radial-gradient(circle at top left,  rgba(255,45,122,0.30),  transparent 30%),
          radial-gradient(circle at top center,rgba(168,0,255,0.40),   transparent 40%),
          radial-gradient(circle at bottom right,rgba(91,15,168,0.30), transparent 40%),
          linear-gradient(135deg,#08040F,#14001F,#210029)
        `,
        backgroundColor: '#08040F',
      }}
    >
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen(o => !o)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
