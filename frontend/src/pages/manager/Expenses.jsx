import { useEffect, useState } from 'react'
import api from '../../lib/api'
import toast from 'react-hot-toast'

export default function Expenses() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ description: '', amount: '', category: 'Maintenance', date: new Date().toISOString().split('T')[0] })
  const [saving, setSaving] = useState(false)

  const load = () => api.get('/expenses').then(r => setExpenses(r.data)).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/expenses', form)
      toast.success('Expense recorded / ወጪ ተመዝግቧል')
      setModal(false)
      setForm({ description: '', amount: '', category: 'Maintenance', date: new Date().toISOString().split('T')[0] })
      load()
    } catch (err) {
      toast.error('Failed to save / ማስቀመጥ አልተሳካም')
    } finally { setSaving(false) }
  }

  if (loading) return <Spin />

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Expenses / ወጪዎች</h1>
          <p className="text-slate-400 text-sm mt-1">Management and building costs / የአስተዳደር እና የህንፃ ወጪዎች</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary">+ Record Expense / ወጪ መዝግብ</button>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-border bg-surface/30">
              <th className="table-header text-left">Date / ቀን</th>
              <th className="table-header text-left">Category / አይነት</th>
              <th className="table-header text-left">Description / ዝርዝር</th>
              <th className="table-header text-left">Amount / መጠን</th>
              <th className="table-header text-left">Recorded By / የመዘገበው</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map(ex => (
              <tr key={ex.id} className="table-row">
                <td className="table-cell">{new Date(ex.date).toLocaleDateString()}</td>
                <td className="table-cell">
                  <span className="px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 text-[10px] font-bold uppercase">
                    {ex.category}
                  </span>
                </td>
                <td className="table-cell text-white">{ex.description}</td>
                <td className="table-cell font-mono text-brand-400 font-bold">ETB {Number(ex.amount).toLocaleString()}</td>
                <td className="table-cell text-slate-500 text-xs">{ex.user?.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {expenses.length === 0 && <p className="text-center py-12 text-slate-500 italic">No expenses recorded / ምንም ወጪ አልተመዘገበም</p>}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-card border border-surface-border rounded-2xl w-full max-w-md animate-slide-up">
            <div className="p-6 border-b border-surface-border flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">New Expense / አዲስ ወጪ</h2>
              <button onClick={() => setModal(false)} className="text-slate-400 hover:text-white text-xl">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">Date / ቀን</label>
                <input type="date" required className="input" value={form.date}
                  onChange={e => setForm(f => ({...f, date: e.target.value}))} />
              </div>
              <div>
                <label className="label">Category / አይነት</label>
                <select className="input" value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}>
                  <option value="Maintenance">Maintenance / ጥገና</option>
                  <option value="Salary">Salary / ደመወዝ</option>
                  <option value="Utilities">Utilities / አገልግሎቶች</option>
                  <option value="Administrative">Administrative / አስተዳደራዊ</option>
                  <option value="Other">Other / ሌላ</option>
                </select>
              </div>
              <div>
                <label className="label">Description / ዝርዝር</label>
                <input required className="input" placeholder="e.g. Elevator repair"
                  value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} />
              </div>
              <div>
                <label className="label">Amount (ETB) / መጠን</label>
                <input type="number" required className="input" placeholder="0.00"
                  value={form.amount} onChange={e => setForm(f => ({...f, amount: e.target.value}))} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1 justify-center">Cancel / ሰርዝ</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving ? '⏳' : 'Save Expense / ወጪ መዝግብ'}
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
