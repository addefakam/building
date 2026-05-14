import { useEffect, useState } from 'react'
import api from '../../lib/api'
import toast from 'react-hot-toast'

export default function ShopsManager() {
  const [shops, setShops]   = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]   = useState(false)
  const [form, setForm]     = useState({ shopNumber:'', floor:'0', rentAmount:'', status:'VACANT' })
  const [editingShop, setEditingShop] = useState(null)
  const [saving, setSaving] = useState(false)
  const [sortConfig, setSortConfig] = useState({ key: 'floor', direction: 'asc' })
  const [searchQuery, setSearchQuery] = useState('')

  const load = () => api.get('/shops').then(r => setShops(r.data)).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const handleAdd = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      if (editingShop) {
        await api.patch(`/shops/${editingShop.id}`, form)
        toast.success('Shop updated / ሱቅ ተሻሽሏል')
      } else {
        await api.post('/shops', form)
        toast.success('Shop created / ሱቅ ተፈጥሯል')
      }
      setModal(false); setEditingShop(null); setForm({ shopNumber:'', floor:'0', rentAmount:'', status:'VACANT' }); load()
    } catch (err) { toast.error(err.response?.data?.error || 'Failed / አልተሳካም') }
    finally { setSaving(false) }
  }

  const openEdit = (shop) => {
    setEditingShop(shop)
    setForm({ shopNumber: shop.shopNumber, floor: shop.floor, rentAmount: shop.rentAmount, status: shop.status })
    setModal(true)
  }

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  }

  // Filter and Sort logic
  const filteredShops = shops.filter(shop => {
    const query = searchQuery.toLowerCase();
    const shopNumMatch = shop.shopNumber.toLowerCase().includes(query);
    const tenantMatch = shop.tenant?.fullName.toLowerCase().includes(query);
    const statusMatch = shop.status.toLowerCase().includes(query);
    const floorMatch = shop.floor.toString().includes(query);
    return shopNumMatch || tenantMatch || statusMatch || floorMatch;
  });

  const sortedShops = [...filteredShops].sort((a, b) => {
    const { key, direction } = sortConfig;
    let valA = a[key];
    let valB = b[key];

    if (key === 'floor') { valA = Number(valA); valB = Number(valB); }
    
    if (valA < valB) return direction === 'asc' ? -1 : 1;
    if (valA > valB) return direction === 'asc' ? 1 : -1;

    if (a.shopNumber < b.shopNumber) return -1;
    if (a.shopNumber > b.shopNumber) return 1;
    return 0;
  });

  const statusBadge = (s) => ({
    OCCUPIED:    <span className="badge-occupied">Occupied / የተያዘ</span>,
    VACANT:      <span className="badge-vacant">Vacant / ክፍት</span>,
    MAINTENANCE: <span className="badge-maintenance">Maintenance / ጥገና</span>,
  }[s])

  const SortIcon = ({ k }) => {
    if (sortConfig.key !== k) return <span className="ml-1 opacity-20">↕</span>;
    return sortConfig.direction === 'asc' ? <span className="ml-1 text-brand-400">↑</span> : <span className="ml-1 text-brand-400">↓</span>;
  }

  if (loading) return <Spin />

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Shops / ሱቆች</h1>
          <p className="text-slate-400 text-sm mt-1">{shops.length} total units / ጠቅላላ ክፍሎች</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-400">🔍</span>
            <input 
              type="text" 
              placeholder="Search shops... / ሱቅ ፈልግ..." 
              className="input pl-10 w-64 md:w-80"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <button onClick={() => { setEditingShop(null); setForm({ shopNumber:'', floor:'0', rentAmount:'', status:'VACANT' }); setModal(true) }} 
                  className="btn-primary whitespace-nowrap">+ Add Shop / ሱቅ ጨምር</button>
        </div>
      </div>

      <div className="card p-0 overflow-hidden shadow-xl border-surface-border/50">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-border bg-surface/30">
                <th className="table-header text-left cursor-pointer hover:bg-surface/50" onClick={() => requestSort('shopNumber')}>
                  Shop No. / የሱቅ ቁጥር <SortIcon k="shopNumber" />
                </th>
                <th className="table-header text-left cursor-pointer hover:bg-surface/50" onClick={() => requestSort('floor')}>
                  Floor / ፎቅ <SortIcon k="floor" />
                </th>
                <th className="table-header text-left cursor-pointer hover:bg-surface/50" onClick={() => requestSort('rentAmount')}>
                  Monthly Rent / የወር ኪራይ <SortIcon k="rentAmount" />
                </th>
                <th className="table-header text-left">Tenant / ተከራይ</th>
                <th className="table-header text-left cursor-pointer hover:bg-surface/50" onClick={() => requestSort('status')}>
                  Status / ሁኔታ <SortIcon k="status" />
                </th>
                <th className="table-header text-right">Actions / እርምጃዎች</th>
              </tr>
            </thead>
            <tbody>
              {sortedShops.map(shop => (
                <tr key={shop.id} className={`table-row group transition-colors duration-200 ${
                  shop.status === 'OCCUPIED' ? 'bg-emerald-500/[0.03] hover:bg-emerald-500/[0.06]' :
                  shop.status === 'MAINTENANCE' ? 'bg-amber-500/[0.03] hover:bg-amber-500/[0.06]' :
                  'hover:bg-surface/50'
                }`}>
                  <td className="table-cell font-bold text-white">
                    <div className="flex items-center gap-3">
                      <div className={`w-1.5 h-8 rounded-full ${
                        shop.status === 'OCCUPIED' ? 'bg-emerald-500' :
                        shop.status === 'MAINTENANCE' ? 'bg-amber-500' :
                        'bg-slate-600'
                      }`}></div>
                      {shop.shopNumber}
                    </div>
                  </td>
                  <td className="table-cell">Floor {shop.floor}</td>
                  <td className="table-cell font-mono text-brand-400 font-bold">ETB {Number(shop.rentAmount).toLocaleString()}</td>
                  <td className="table-cell">
                    {shop.tenant ? (
                      <div>
                        <p className="text-sm text-white font-bold">{shop.tenant.fullName}</p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">{shop.tenant.phone}</p>
                      </div>
                    ) : (
                      <span className="text-slate-500 italic text-sm">No tenant / ተከራይ የለም</span>
                    )}
                  </td>
                  <td className="table-cell">{statusBadge(shop.status)}</td>
                  <td className="table-cell text-right">
                    <button onClick={() => openEdit(shop)} 
                      className="text-xs px-3 py-1.5 bg-surface/80 border border-surface-border rounded-lg text-slate-300 hover:text-brand-400 hover:border-brand-500/50 transition-all font-black uppercase tracking-tighter">
                      Update / ቀይር
                    </button>
                  </td>
                </tr>
              ))}
              {sortedShops.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500 text-sm italic">
                    {searchQuery ? 'No results matching your search / ከፍለጋው ጋር የሚዛመድ የለም' : 'No shops found / ምንም ሱቆች አልተገኙም'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-card border border-surface-border rounded-2xl w-full max-w-sm animate-slide-up shadow-2xl">
            <div className="p-6 border-b border-surface-border flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">{editingShop ? 'Update Shop / ሱቅ አሻሽል' : 'New Shop / አዲስ ሱቅ'}</h2>
              <button onClick={() => setModal(false)} className="text-slate-400 hover:text-white text-xl">✕</button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div>
                <label className="label">Shop Number / የሱቅ ቁጥር</label>
                <input required className="input" placeholder="e.g. G-03"
                  value={form.shopNumber} onChange={e => setForm(f => ({...f, shopNumber: e.target.value}))} />
              </div>
              <div>
                <label className="label">Floor / ፎቅ</label>
                <input type="number" required className="input"
                  value={form.floor} onChange={e => setForm(f => ({...f, floor: e.target.value}))} />
              </div>
              <div>
                <label className="label">Monthly Rent (ETB) / የወር ኪራይ</label>
                <input type="number" required className="input"
                  value={form.rentAmount} onChange={e => setForm(f => ({...f, rentAmount: e.target.value}))} />
              </div>
              <div>
                <label className="label">Status / ሁኔታ</label>
                <select className="input" value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))}>
                  <option value="VACANT">Vacant / ክፍት</option>
                  <option value="OCCUPIED">Occupied / የተያዘ</option>
                  <option value="MAINTENANCE">Maintenance / ጥገና</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1 justify-center">Cancel / ሰርዝ</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving ? '⏳' : editingShop ? 'Update / አሻሽል' : '+ Create / ፍጠር'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
function Spin() { return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div> }
