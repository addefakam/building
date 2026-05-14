import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function TenantLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const links = [
    { to: '/tenant', icon: '🏠', label: 'My Dashboard / የኔ ዳሽቦርድ' },
    { to: '/tenant/bills', icon: '🧾', label: 'My Bills / የኔ ቢሎች' },
    { to: '/tenant/profile', icon: '👤', label: 'Profile / ፕሮፋይል' },
  ]

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Sidebar - Hidden on mobile */}
      <aside className="hidden lg:flex w-64 border-r border-surface-border bg-surface-card flex-col h-screen sticky top-0">
        <div className="p-6 border-b border-surface-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-xl">🏠</div>
            <p className="font-bold text-white">Tenant Hub / ተከራይ ማዕከል</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {links.map(link => (
            <NavLink key={link.to} to={link.to} end
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                ${isActive ? 'bg-brand-500/10 text-brand-400' : 'text-slate-400 hover:text-white hover:bg-surface/50'}
              `}>
              <span>{link.icon}</span>
              <span className="font-medium text-sm">{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-surface-border">
          <button onClick={() => { logout(); navigate('/login') }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all text-sm font-medium">
            Logout / ውጣ
          </button>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-surface-card border-b border-surface-border z-40 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white text-sm">🏠</div>
          <span className="font-black text-white uppercase italic tracking-tighter text-sm">Tenant Hub / ተከራይ</span>
        </div>
      </div>

      <main className="flex-1 p-4 lg:p-8 pt-20 lg:pt-8 pb-24 lg:pb-8">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface-card border-t border-surface-border z-40 px-2 py-3 flex items-center justify-around">
        {links.map(link => (
          <NavLink key={link.to} to={link.to} end
            className={({ isActive }) => `
              flex flex-col items-center gap-1 transition-all
              ${isActive ? 'text-brand-400 scale-110' : 'text-slate-500'}
            `}>
            <span className="text-xl">{link.icon}</span>
            <span className="text-[8px] font-black uppercase tracking-tighter">{link.label.split('/')[0]}</span>
          </NavLink>
        ))}
        <button onClick={() => { logout(); navigate('/login') }} className="flex flex-col items-center gap-1 text-red-400 opacity-70">
          <span className="text-xl">🚪</span>
          <span className="text-[8px] font-black uppercase tracking-tighter">Exit</span>
        </button>
      </nav>
    </div>
  )
}
