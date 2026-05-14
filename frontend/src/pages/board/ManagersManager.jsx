import { useState, useEffect } from 'react'
import api from '../../lib/api'
import toast from 'react-hot-toast'

export default function ManagersManager() {
  const [managers, setManagers] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchManagers = async () => {
    try {
      const res = await api.get('/board/managers')
      setManagers(res.data)
    } catch (err) {
      toast.error('Failed to load managers / ስራ አስኪያጆችን መጫን አልተሳካም')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchManagers() }, [])

  const toggleStatus = async (id) => {
    try {
      await api.patch(`/board/managers/${id}/toggle`)
      toast.success('Manager status updated / የስራ አስኪያጅ ሁኔታ ተቀይሯል')
      fetchManagers()
    } catch (err) {
      toast.error('Action failed / ተግባሩ አልተሳካም')
    }
  }

  if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse">Loading Managers... / በመጫን ላይ...</div>

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase italic">Manager Oversight / የስራ አስኪያጅ ቁጥጥር</h1>
          <p className="text-slate-400 mt-2 font-medium">Board-level management of administrative personnel / የአስተዳደር ሰራተኞች ቁጥጥር</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {managers.map(m => (
          <div key={m.id} className={`card p-6 transition-all border-2 ${m.isActive ? 'border-brand-500/20' : 'border-red-500/20 bg-red-500/[0.02]'}`}>
            <div className="flex items-start gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-surface border border-surface-border">
                {m.profileImageUrl ? (
                  <img src={m.profileImageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl bg-brand-500/10 text-brand-400 font-bold">
                    {m.fullName?.charAt(0) || 'M'}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-black text-white uppercase tracking-tight">{m.fullName || 'Unnamed Manager'}</h3>
                <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mt-1">{m.email}</p>
                <div className="mt-3">
                  <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter ${
                    m.isActive ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {m.isActive ? 'Active / ንቁ' : 'Deactivated / የታገደ'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-surface-border mt-4">
              <button 
                onClick={() => toggleStatus(m.id)}
                className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  m.isActive 
                    ? 'bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/30' 
                    : 'bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-white border border-green-500/30'
                }`}
              >
                {m.isActive ? 'Deactivate Account / አካውንቱን አግድ' : 'Activate Account / አካውንቱን ክፈት'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {managers.length === 0 && (
        <div className="p-20 text-center card border-dashed border-2">
          <p className="text-slate-500 font-medium italic">No managers registered in the system / ምንም የተመዘገበ ስራ አስኪያጅ የለም</p>
        </div>
      )}
    </div>
  )
}
