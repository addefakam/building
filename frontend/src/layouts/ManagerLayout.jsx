import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useState, useEffect } from 'react'
import api from '../lib/api'
import toast from 'react-hot-toast'

export default function ManagerLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [showNotifs, setShowNotifs] = useState(false)

  const loadNotifs = () => api.get('/notifications').then(r => setNotifications(r.data)).catch(() => {})
  useEffect(() => { loadNotifs(); const int = setInterval(loadNotifs, 30000); return () => clearInterval(int) }, [])

  const unreadCount = notifications.filter(n => !n.isRead).length

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all')
      loadNotifs()
    } catch {}
  }

  const links = [
    { to: '/manager', icon: '📊', label: 'Overview / አጠቃላይ እይታ' },
    { to: '/manager/shops', icon: '🏪', label: 'Shops / ሱቆች' },
    { to: '/manager/tenants', icon: '👥', label: 'Tenants / ተከራዮች' },
    { to: '/manager/meters', icon: '⚡', label: 'Meter Entry / የሜትር ንባብ' },
    { to: '/manager/reconciliation', icon: '✅', label: 'Reconciliation / ማረጋገጫ' },
    { to: '/manager/expenses', icon: '💸', label: 'Expenses / ወጪዎች' },
    { to: '/manager/resources', icon: '📦', label: 'Resources / ንብረቶች' },
    { to: '/manager/reports', icon: '📄', label: 'Reports / ሪፖርቶች' },
    { to: '/manager/profile', icon: '👤', label: 'My Profile / ፕሮፋይሌ' },
  ]

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Sidebar - Hidden on mobile */}
      <aside className="hidden lg:flex w-72 border-r border-surface-border bg-surface-card flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-surface-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-brand-500 border border-brand-500/30">
               <img 
                 src={user?.profileImageUrl || '/manager_photo.png'} 
                 alt="Profile" 
                 className="w-full h-full object-cover"
               />
            </div>
            <div>
              <p className="font-bold text-white leading-none">{user?.fullName || 'Manager / ስራ አስኪያጅ'}</p>
              <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-black">Admin / አስተዳዳሪ</p>
            </div>
          </div>
          <div className="relative mt-6">
            <button 
              onClick={() => { setShowNotifs(!showNotifs); if(!showNotifs) markAllRead(); }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all border ${
                unreadCount > 0 ? 'bg-brand-500/10 border-brand-500/20 text-brand-400' : 'bg-surface border-surface-border text-slate-400'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">🔔</span>
                <span className="text-xs font-bold uppercase tracking-wider">Notifications</span>
              </div>
              {unreadCount > 0 && (
                <span className="bg-brand-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>
            
            {showNotifs && (
              <div className="absolute left-0 right-0 mt-2 bg-surface-card border border-surface-border rounded-2xl shadow-2xl z-50 max-h-80 overflow-y-auto animate-slide-up">
                <div className="p-3 border-b border-surface-border flex items-center justify-between bg-surface/50">
                  <span className="text-[10px] font-black uppercase text-slate-500">Recent Alerts / የቅርብ ጊዜ ማሳወቂያዎች</span>
                </div>
                {notifications.length === 0 ? (
                  <p className="p-6 text-center text-xs text-slate-500 italic">No notifications / ምንም ማሳወቂያ የለም</p>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className={`p-4 border-b border-surface-border last:border-none ${n.isRead ? 'opacity-50' : 'bg-brand-500/[0.03]'}`}>
                      <p className="text-xs font-bold text-white mb-1">{n.title}</p>
                      <p className="text-[10px] text-slate-400 leading-relaxed">{n.message}</p>
                      <p className="text-[8px] text-slate-600 mt-2 uppercase">{new Date(n.createdAt).toLocaleTimeString()}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {links.map(link => (
            <NavLink key={link.to} to={link.to} end
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                ${isActive 
                  ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20 shadow-sm' 
                  : 'text-slate-400 hover:text-white hover:bg-surface/50 border border-transparent'}
              `}>
              <span className="text-lg">{link.icon}</span>
              <span className="font-medium text-sm">{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-surface-border">
          <button onClick={() => { logout(); navigate('/login') }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all border border-red-500/20 font-medium text-sm">
            Logout / ውጣ
          </button>
        </div>
      </aside>

      {/* Mobile Top Header (only visible on small screens) */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-surface-card border-b border-surface-border z-40 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-500 overflow-hidden">
            <img src={user?.profileImageUrl || '/manager_photo.png'} alt="" className="w-full h-full object-cover" />
          </div>
          <span className="font-black text-white uppercase italic tracking-tighter text-sm">Manager / ስራ አስኪያጅ</span>
        </div>
        <button 
          onClick={() => { setShowNotifs(!showNotifs); if(!showNotifs) markAllRead(); }}
          className="relative text-xl p-2"
        >
          🔔
          {unreadCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-brand-500 rounded-full animate-ping"></span>}
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto pt-20 lg:pt-8 pb-24 lg:pb-8">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface-card border-t border-surface-border z-40 px-2 py-3 flex items-center justify-around">
        {links.slice(0, 5).map(link => (
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
