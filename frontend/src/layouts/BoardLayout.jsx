import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function BoardLayout() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const links = [
    { to: '/board', icon: '📈', label: 'Executive Summary / የሥራ አመራር መግለጫ' },
    { to: '/board/invoices', icon: '📋', label: 'Invoice Records / የቢል መዛግብት' },
    { to: '/board/reports', icon: '📄', label: 'Reports / ሪፖርቶች' },
    { to: '/board/users', icon: '👥', label: 'Manage Users / ተጠቃሚዎችን ያስተዳድሩ' },
  ]

  return (
    <div className="flex min-h-screen bg-surface text-slate-200">
      <aside className="w-72 border-r border-surface-border bg-surface-card flex flex-col h-screen sticky top-0">
        <div className="p-6 border-b border-surface-border">
          <p className="text-[10px] text-brand-500 font-bold uppercase tracking-[0.2em] mb-1">PLC Board Portal / የቦርድ መግቢያ</p>
          <p className="text-xl font-bold text-white tracking-tight">Executive Control / የሥራ አመራር</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {links.map(link => (
            <NavLink key={link.to} to={link.to} end
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                ${isActive ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20' : 'text-slate-400 hover:text-white hover:bg-surface/50'}
              `}>
              <span>{link.icon}</span>
              <span className="font-medium text-sm">{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-surface-border">
          <button onClick={() => { logout(); navigate('/login') }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-all text-sm font-medium">
            Logout / ውጣ
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  )
}
