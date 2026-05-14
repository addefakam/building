import { useEffect, useState } from 'react'
import api from '../../lib/api'
import toast from 'react-hot-toast'

export default function TenantsManager() {
  const [tenants, setTenants] = useState([])
  const [shops, setShops]     = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(false)
  const [form, setForm]       = useState({ fullName:'', phone:'', email:'', shopId:'', leaseStart:'', password:'' })
  const [agreementFile, setAgreementFile] = useState(null)
  const [saving, setSaving]   = useState(false)

  const load = () => {
    Promise.all([api.get('/tenants'), api.get('/shops')])
      .then(([tr, sr]) => {
        setTenants(tr.data)
        setShops(sr.data.filter(s => s.status === 'VACANT'))
      }).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const handleAdd = async (e) => {
    e.preventDefault(); setSaving(true)
    const data = new FormData()
    Object.keys(form).forEach(key => data.append(key, form[key]))
    if (agreementFile) data.append('agreement', agreementFile)

    try {
      await api.post('/tenants', data, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success('Tenant created / ተከራይ ተመዝግቧል')
      setModal(false)
      setForm({ fullName:'', phone:'', email:'', shopId:'', leaseStart:'', password:'' })
      setAgreementFile(null)
      load()
    } catch (err) { toast.error(err.response?.data?.error || 'Failed / አልተሳካም') }
    finally { setSaving(false) }
  }

  const toggleTenantStatus = async (tenant) => {
    try {
      await api.patch(`/tenants/${tenant.id}`, { isActive: !tenant.isActive })
      toast.success('Status updated / ሁኔታ ተሻሽሏል')
      load()
    } catch (err) { toast.error('Failed to update / ማሻሻል አልተሳካም') }
  }

  const handleResetPassword = async (tenant) => {
    const newPassword = prompt(`Enter new password for ${tenant.fullName}:`, 'Tenant@123')
    if (!newPassword) return
    try {
      await api.patch('/auth/admin/reset-password', { userId: tenant.userId, newPassword })
      toast.success('Password updated / የይለፍ ቃል ተቀይሯል')
    } catch { toast.error('Failed / አልተሳካም') }
  }

  if (loading) return <Spin />

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tenants / ተከራዮች</h1>
          <p className="text-slate-400 text-sm mt-1">{tenants.length} active tenants / ንቁ ተከራዮች</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary">+ Add Tenant / ተከራይ ጨምር</button>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full">
          <thead className="border-b border-surface-border">
            <tr>
              {['Name / ስም','Email / ኢሜይል','Phone / ስልክ','Shop / ሱቅ','Lease / ውል','Agreement / ስምምነት','Status / ሁኔታ'].map(h => (
                <th key={h} className="table-header">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tenants.map(t => (
              <tr key={t.id} className="table-row">
                <td className="table-cell font-medium text-white">{t.fullName}</td>
                <td className="table-cell">{t.email}</td>
                <td className="table-cell">{t.phone}</td>
                <td className="table-cell">Shop {t.shop?.shopNumber}</td>
                <td className="table-cell text-xs">{t.leaseStart ? new Date(t.leaseStart).toLocaleDateString() : '—'}</td>
                <td className="table-cell">
                  {t.agreementUrl ? (
                    <a href={t.agreementUrl} target="_blank" rel="noreferrer" className="text-brand-400 hover:underline text-xs">
                      View / እይ
                    </a>
                  ) : <span className="text-slate-500 text-xs">—</span>}
                </td>
                <td className="table-cell">
                  <div className="flex items-center gap-2">
                    {t.isActive ? <span className="badge-paid">Active / ንቁ</span> : <span className="badge-rejected">Inactive / ንቁ ያልሆነ</span>}
                    <button 
                      onClick={() => toggleTenantStatus(t)}
                      className="text-[10px] px-2 py-0.5 border border-surface-border rounded hover:bg-surface transition-all text-slate-400">
                      Toggle / ቀይር
                    </button>
                    <button 
                      onClick={() => handleResetPassword(t)}
                      className="text-[10px] px-2 py-0.5 border border-brand-500/20 rounded hover:bg-brand-500/10 transition-all text-brand-400">
                      Reset PW / ይለፍ ቃል ቀይር
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {tenants.length === 0 && <p className="text-center text-slate-500 py-8 text-sm">No tenants yet / እስካሁን ምንም ተከራይ የለም</p>}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-card border border-surface-border rounded-2xl w-full max-w-md animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-surface-border flex items-center justify-between sticky top-0 bg-surface-card z-10">
              <h2 className="text-lg font-semibold text-white">New Tenant / አዲስ ተከራይ</h2>
              <button onClick={() => setModal(false)} className="text-slate-400 hover:text-white text-xl">✕</button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              {[
                { key: 'fullName', label: 'Full Name / ሙሉ ስም', type: 'text', placeholder: 'John Doe' },
                { key: 'email', label: 'Email / ኢሜይል', type: 'email', placeholder: 'john@example.com' },
                { key: 'phone', label: 'Phone / ስልክ', type: 'text', placeholder: '0911000000' },
                { key: 'leaseStart', label: 'Lease Start Date / የውል መጀመሪያ ቀን', type: 'date' },
                { key: 'password', label: 'Initial Password / መጀመሪያ የይለፍ ቃል', type: 'password', placeholder: 'Tenant@123' },
              ].map(({ key, label, type, placeholder }) => (
                <div key={key}>
                  <label className="label">{label}</label>
                  <input type={type} required className="input" placeholder={placeholder}
                    value={form[key]} onChange={e => setForm(f => ({...f, [key]: e.target.value}))} />
                </div>
              ))}
              <div>
                <label className="label">Assign Shop / ሱቅ መድብ</label>
                <select required className="input" value={form.shopId}
                  onChange={e => setForm(f => ({...f, shopId: e.target.value}))}>
                  <option value="">Select a vacant shop / ክፍት ሱቅ ይምረጡ...</option>
                  {shops.map(s => <option key={s.id} value={s.id}>Shop {s.shopNumber} — Floor {s.floor}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Signed Agreement / የተፈረመ ስምምነት (PDF/IMG)</label>
                <input type="file" className="input" accept="application/pdf,image/*"
                  onChange={e => setAgreementFile(e.target.files[0])} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1 justify-center">Cancel / ሰርዝ</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving ? '⏳' : '+ Create Tenant / ተከራይ ፍጠር'}
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
