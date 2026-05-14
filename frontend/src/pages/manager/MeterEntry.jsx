import { useEffect, useState } from 'react'
import api from '../../lib/api'
import toast from 'react-hot-toast'

export default function MeterEntry() {
  const [shops, setShops] = useState([])
  const [readings, setReadings] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)
  
  const [billingMonth, setBillingMonth] = useState(new Date().getMonth() + 1)
  const [billingYear, setBillingYear] = useState(new Date().getFullYear())

  const loadData = async () => {
    setLoading(true)
    try {
      const [shopsRes, readingsRes] = await Promise.all([
        api.get('/shops'),
        api.get(`/utilities/readings?month=${billingMonth}&year=${billingYear}`)
      ])
      setShops(shopsRes.data.filter(s => s.status === 'OCCUPIED'))
      setReadings(readingsRes.data)
    } catch (err) {
      toast.error('Failed to load data / ዳታ መጫን አልተሳካም')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [billingMonth, billingYear])

  const handleSave = async (shop, currentEntry) => {
    setSavingId(shop.id)
    try {
      const existing = readings.find(r => r.shopId === shop.id)
      const payload = {
        shopId: shop.id,
        billingMonth,
        billingYear,
        electricPrev: existing?.electricPrev || shop.utilityReadings?.[0]?.electricCurr || 0,
        electricCurr: currentEntry.electricCurr,
        electricRate: currentEntry.electricRate || 1.5,
        waterPrev: existing?.waterPrev || shop.utilityReadings?.[0]?.waterCurr || 0,
        waterCurr: currentEntry.waterCurr,
        waterRate: currentEntry.waterRate || 10.0
      }

      if (existing) {
        await api.patch(`/utilities/readings/${existing.id}`, payload)
        toast.success(`Updated Shop ${shop.shopNumber} / ተሻሽሏል`)
      } else {
        await api.post('/utilities/readings', payload)
        toast.success(`Saved Shop ${shop.shopNumber} / ተቀምጧል`)
      }
      loadData()
    } catch (err) {
      toast.error('Save failed / ማስቀመጥ አልተሳካም')
    } finally {
      setSavingId(null)
    }
  }

  if (loading && shops.length === 0) return <div className="p-20 text-center animate-pulse text-slate-500 font-bold uppercase italic tracking-widest">Initial Loading... / በመጫን ላይ...</div>

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase italic">Utility Meter Entry / የሜትር ንባብ ማስገቢያ</h1>
          <p className="text-slate-400 mt-2 font-medium">Manage all utility readings in one table / ሁሉንም ንባቦች በአንድ ሰንጠረዥ ያስተዳድሩ</p>
        </div>
        <div className="flex gap-3 bg-surface p-1.5 rounded-2xl border border-surface-border shrink-0">
          <select className="bg-transparent text-white font-black uppercase text-xs px-4 py-2 focus:outline-none" 
            value={billingMonth} onChange={e => setBillingMonth(parseInt(e.target.value))}>
            {[...Array(12)].map((_, i) => <option key={i+1} value={i+1} className="bg-surface text-white">Month {i+1}</option>)}
          </select>
          <div className="w-px h-8 bg-surface-border mx-1"></div>
          <select className="bg-transparent text-white font-black uppercase text-xs px-4 py-2 focus:outline-none"
            value={billingYear} onChange={e => setBillingYear(parseInt(e.target.value))}>
            {[2024, 2025, 2026].map(y => <option key={y} value={y} className="bg-surface text-white">{y}</option>)}
          </select>
        </div>
      </div>

      <div className="card p-0 overflow-hidden border-brand-500/10 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-surface/40">
                <th className="px-4 py-3 text-left font-bold text-slate-200 uppercase tracking-wider text-xs">Shop</th>
                <th className="px-4 py-3 text-left font-bold text-slate-200 uppercase tracking-wider text-xs">Tenant</th>
                <th className="px-4 py-3 text-left font-bold text-indigo-200 uppercase tracking-wider text-xs bg-indigo-500/20">Elec Prev</th>
                <th className="px-4 py-3 text-left font-bold text-indigo-200 uppercase tracking-wider text-xs bg-indigo-500/20">Elec Curr</th>
                <th className="px-4 py-3 text-left font-bold text-indigo-200 uppercase tracking-wider text-xs bg-indigo-500/20">Rate</th>
                <th className="px-4 py-3 text-left font-bold text-blue-200 uppercase tracking-wider text-xs bg-blue-500/20 border-l border-surface-border/50">Water Prev</th>
                <th className="px-4 py-3 text-left font-bold text-blue-200 uppercase tracking-wider text-xs bg-blue-500/20">Water Curr</th>
                <th className="px-4 py-3 text-left font-bold text-blue-200 uppercase tracking-wider text-xs bg-blue-500/20">Rate</th>
                <th className="px-4 py-3 text-center font-bold text-slate-200 uppercase tracking-wider text-xs border-l border-surface-border/50">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/50">
              {shops.map(shop => (
                <MeterRow 
                  key={shop.id} 
                  shop={shop} 
                  existingReading={readings.find(r => r.shopId === shop.id)}
                  onSave={handleSave}
                  isSaving={savingId === shop.id}
                />
              ))}
            </tbody>
          </table>
          {shops.length === 0 && (
            <div className="p-20 text-center text-slate-500 font-medium italic">No occupied shops found / የተያዙ ሱቆች አልተገኙም</div>
          )}
        </div>
      </div>
    </div>
  )
}

function MeterRow({ shop, existingReading, onSave, isSaving }) {
  const [form, setForm] = useState({
    electricCurr: '',
    waterCurr: '',
    electricRate: '1.5',
    waterRate: '10.0'
  })

  // Sync with existing data if loaded
  useEffect(() => {
    if (existingReading) {
      setForm({
        electricCurr: existingReading.electricCurr,
        waterCurr: existingReading.waterCurr,
        electricRate: existingReading.electricRate,
        waterRate: existingReading.waterRate
      })
    } else {
      setForm({
        electricCurr: '',
        waterCurr: '',
        electricRate: '1.5',
        waterRate: '10.0'
      })
    }
  }, [existingReading])

  const hasChanges = existingReading 
    ? (form.electricCurr != existingReading.electricCurr || form.waterCurr != existingReading.waterCurr || form.electricRate != existingReading.electricRate || form.waterRate != existingReading.waterRate)
    : (form.electricCurr !== '' && form.waterCurr !== '')

  const ePrev = existingReading?.electricPrev || shop.utilityReadings?.[0]?.electricCurr || '0.00'
  const wPrev = existingReading?.waterPrev || shop.utilityReadings?.[0]?.waterCurr || '0.00'

  return (
    <tr className={`transition-all hover:bg-surface/30 ${existingReading ? 'bg-brand-500/[0.02]' : ''}`}>
      <td className="px-4 py-3 font-bold text-white whitespace-nowrap">
        Shop {shop.shopNumber}
      </td>
      <td className="px-4 py-3 text-slate-300 truncate max-w-[150px]">
        {shop.tenant?.fullName}
      </td>
      
      {/* Electricity */}
      <td className="px-4 py-3 font-mono text-slate-300">
        {ePrev}
      </td>
      <td className="px-4 py-3">
        <input 
          type="number" step="0.01" placeholder="0.00"
          className="w-24 bg-surface/50 border border-surface-border focus:border-brand-500 rounded px-2 py-1 text-white font-mono text-sm outline-none"
          value={form.electricCurr} onChange={e => setForm({...form, electricCurr: e.target.value})}
        />
      </td>
      <td className="px-4 py-3">
        <input 
          type="number" step="0.01" 
          className="w-16 bg-surface/50 border border-surface-border focus:border-brand-500 rounded px-2 py-1 text-white font-mono text-sm outline-none"
          value={form.electricRate} onChange={e => setForm({...form, electricRate: e.target.value})}
        />
      </td>

      {/* Water */}
      <td className="px-4 py-3 font-mono text-slate-300 border-l border-surface-border/50">
        {wPrev}
      </td>
      <td className="px-4 py-3">
        <input 
          type="number" step="0.01" placeholder="0.00"
          className="w-24 bg-surface/50 border border-surface-border focus:border-blue-500 rounded px-2 py-1 text-white font-mono text-sm outline-none"
          value={form.waterCurr} onChange={e => setForm({...form, waterCurr: e.target.value})}
        />
      </td>
      <td className="px-4 py-3">
        <input 
          type="number" step="0.01" 
          className="w-16 bg-surface/50 border border-surface-border focus:border-blue-500 rounded px-2 py-1 text-white font-mono text-sm outline-none"
          value={form.waterRate} onChange={e => setForm({...form, waterRate: e.target.value})}
        />
      </td>

      {/* Action */}
      <td className="px-4 py-3 text-center whitespace-nowrap border-l border-surface-border/50">
        <button 
          onClick={() => onSave(shop, form)}
          disabled={isSaving || (!hasChanges && existingReading) || (!form.electricCurr || !form.waterCurr)}
          className={`px-4 py-1.5 rounded text-xs font-bold uppercase transition-all ${
            hasChanges && existingReading
            ? 'bg-amber-500 text-white hover:bg-amber-600'
            : existingReading && !hasChanges
            ? 'bg-emerald-500/10 text-emerald-400 cursor-not-allowed'
            : form.electricCurr && form.waterCurr
            ? 'bg-brand-500 text-white hover:bg-brand-600'
            : 'bg-surface border border-surface-border text-slate-500 cursor-not-allowed'
          }`}>
          {isSaving ? '⏳' : existingReading ? (hasChanges ? 'Update' : 'Saved') : 'Save'}
        </button>
      </td>
    </tr>
  )
}
