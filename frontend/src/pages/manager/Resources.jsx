import { useEffect, useState } from 'react'
import api from '../../lib/api'
import toast from 'react-hot-toast'

export default function Resources() {
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ name: '', quantity: '1', category: 'Furniture', condition: 'Good', location: '' })
  const [saving, setSaving] = useState(false)

  const load = () => api.get('/resources').then(r => setResources(r.data)).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/resources', form)
      toast.success('Resource added / ንብረት ተጨምሯል')
      setModal(false)
      setForm({ name: '', quantity: '1', category: 'Furniture', condition: 'Good', location: '' })
      load()
    } catch (err) {
      toast.error('Failed to save / ማስቀመጥ አልተሳካም')
    } finally { setSaving(false) }
  }

  const updateCondition = async (id, condition) => {
    try {
      await api.patch(`/resources/${id}`, { condition })
      toast.success('Condition updated / ሁኔታው ተቀይሯል')
      load()
    } catch { toast.error('Failed / አልተሳካም') }
  }

  if (loading) return <Spin />

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Resources / ንብረቶች</h1>
          <p className="text-slate-400 text-sm mt-1">Building assets and inventory / የህንፃ ሀብቶች እና ንብረቶች</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary">+ Add Resource / ንብረት ጨምር</button>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-border bg-surface/30">
              <th className="table-header text-left">Resource Name / የንብረት ስም</th>
              <th className="table-header text-left">Category / አይነት</th>
              <th className="table-header text-left">Qty / ብዛት</th>
              <th className="table-header text-left">Location / ቦታ</th>
              <th className="table-header text-left">Condition / ሁኔታ</th>
              <th className="table-header text-right">Actions / እርምጃዎች</th>
            </tr>
          </thead>
          <tbody>
            {resources.map(res => (
              <tr key={res.id} className="table-row">
                <td className="table-cell font-bold text-white">{res.name}</td>
                <td className="table-cell text-xs text-slate-400">{res.category}</td>
                <td className="table-cell">{res.quantity}</td>
                <td className="table-cell">{res.location}</td>
                <td className="table-cell">
                  <select 
                    value={res.condition} 
                    onChange={(e) => updateCondition(res.id, e.target.value)}
                    className={`text-[10px] px-2 py-1 rounded bg-surface border border-surface-border font-bold uppercase ${
                      res.condition === 'Good' ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    <option value="Good">Good / ጥሩ</option>
                    <option value="Fair">Fair / ደህና</option>
                    <option value="Needs Repair">Needs Repair / ጥገና ይፈልጋል</option>
                    <option value="Broken">Broken / የተሰበረ</option>
                  </select>
                </td>
                <td className="table-cell text-right">
                   <button className="text-[10px] text-slate-500 hover:text-white transition-colors">History / ታሪክ</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {resources.length === 0 && <p className="text-center py-12 text-slate-500 italic">No resources found / ምንም ንብረት አልተገኘም</p>}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-card border border-surface-border rounded-2xl w-full max-w-md animate-slide-up">
            <div className="p-6 border-b border-surface-border flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Add Resource / ንብረት ጨምር</h2>
              <button onClick={() => setModal(false)} className="text-slate-400 hover:text-white text-xl">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">Resource Name / የንብረት ስም</label>
                <input required className="input" placeholder="e.g. Office Chair"
                  value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Quantity / ብዛት</label>
                  <input type="number" required className="input" value={form.quantity}
                    onChange={e => setForm(f => ({...f, quantity: e.target.value}))} />
                </div>
                <div>
                  <label className="label">Category / አይነት</label>
                  <select className="input" value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}>
                    <option value="Furniture">Furniture / የቤት እቃ</option>
                    <option value="Equipment">Equipment / መሳሪያ</option>
                    <option value="Electronics">Electronics / ኤሌክትሮኒክስ</option>
                    <option value="Security">Security / ደህንነት</option>
                    <option value="Other">Other / ሌላ</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Location / ቦታ</label>
                <input required className="input" placeholder="e.g. Lobby"
                  value={form.location} onChange={e => setForm(f => ({...f, location: e.target.value}))} />
              </div>
              <div>
                <label className="label">Condition / ሁኔታ</label>
                <select className="input" value={form.condition} onChange={e => setForm(f => ({...f, condition: e.target.value}))}>
                  <option value="Good">Good / ጥሩ</option>
                  <option value="Fair">Fair / ደህና</option>
                  <option value="Needs Repair">Needs Repair / ጥገና ይፈልጋል</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1 justify-center">Cancel / ሰርዝ</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving ? '⏳' : 'Add Resource / ንብረት ጨምር'}
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
