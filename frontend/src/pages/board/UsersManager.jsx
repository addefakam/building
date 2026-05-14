import { useState, useEffect } from 'react'
import api from '../../lib/api'
import toast from 'react-hot-toast'

export default function UsersManager() {
  const [users, setUsers] = useState([])
  const [filter, setFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)

  const fetchUsers = async () => {
    try {
      const res = await api.get('/board/users')
      setUsers(res.data)
    } catch (err) {
      toast.error('Failed to load users / ተጠቃሚዎችን መጫን አልተሳካም')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  const toggleStatus = async (id) => {
    try {
      await api.patch(`/board/users/${id}/toggle`)
      toast.success('Status updated / ሁኔታው ተቀይሯል')
      fetchUsers()
    } catch (err) {
      toast.error('Action failed / ተግባሩ አልተሳካም')
    }
  }

  const filteredUsers = users.filter(u => {
    if (filter === 'ALL') return true
    return u.role === filter
  })

  if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse">Loading Users... / በመጫን ላይ...</div>

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase italic">User Administration / የተጠቃሚዎች አስተዳደር</h1>
          <p className="text-slate-400 mt-2 font-medium">Board oversight for all Managers and Tenants / ለሁሉም ስራ አስኪያጆች እና ተከራዮች የቦርድ ቁጥጥር</p>
        </div>
        <div className="flex gap-2 bg-surface p-1 rounded-xl border border-surface-border">
          {['ALL', 'MANAGER', 'TENANT'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                filter === f ? 'bg-brand-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
              }`}>
              {f === 'ALL' ? 'All / ሁሉም' : f === 'MANAGER' ? 'Managers / ስራ አስኪያጆች' : 'Tenants / ተከራዮች'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map(u => (
          <div key={u.id} className={`card p-6 transition-all border-2 ${u.isActive ? 'border-brand-500/20' : 'border-red-500/20 bg-red-500/[0.02]'}`}>
            <div className="flex items-start gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-surface border border-surface-border shrink-0">
                {u.profileImageUrl ? (
                  <img src={u.profileImageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl bg-brand-500/10 text-brand-400 font-bold uppercase">
                    {u.fullName?.charAt(0) || u.email.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-white uppercase tracking-tight truncate">{u.fullName || 'Unnamed User'}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest ${
                    u.role === 'MANAGER' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {u.role}
                  </span>
                  <span className="text-[10px] text-slate-500 truncate font-mono">{u.email}</span>
                </div>
                <div className="mt-3">
                  <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter ${
                    u.isActive ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {u.isActive ? 'Active / ንቁ' : 'Deactivated / የታገደ'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-surface-border mt-4">
              <button 
                onClick={() => toggleStatus(u.id)}
                className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  u.isActive 
                    ? 'bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/30' 
                    : 'bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-white border border-green-500/30'
                }`}
              >
                {u.isActive ? 'Deactivate User / ተጠቃሚውን አግድ' : 'Activate User / ተጠቃሚውን ክፈት'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="p-20 text-center card border-dashed border-2">
          <p className="text-slate-500 font-medium italic">No users found / ምንም ተጠቃሚ አልተገኘም</p>
        </div>
      )}
    </div>
  )
}
