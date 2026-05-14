import { useEffect, useState } from 'react'
import api from '../../lib/api'
import toast from 'react-hot-toast'

const getMonthName = (m) => ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m - 1]
const fmt = (n) => `ETB ${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}`

export default function ManagerDashboard() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const now = new Date()

  useEffect(() => {
    api.get(`/board/summary?month=${now.getMonth() + 1}&year=${now.getFullYear()}`)
      .then(r => setSummary(r.data))
      .catch(() => toast.error('Failed to load summary'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spin />

  const { occupancy, revenue, invoices } = summary || {}

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Manager Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">
          {getMonthName(now.getMonth() + 1)} {now.getFullYear()} overview
        </p>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Shops"     value={occupancy?.total}     icon="🏢" />
        <StatCard label="Occupied"        value={occupancy?.occupied}  icon="✅" color="emerald" />
        <StatCard label="Vacant"          value={occupancy?.vacant}    icon="⬜" color="slate" />
        <StatCard label="Maintenance"     value={occupancy?.maintenance} icon="🔧" color="orange" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Collected Revenue" value={fmt(revenue?.collected || 0)} icon="💰" color="emerald" wide />
        <StatCard label="Outstanding"       value={fmt(revenue?.outstanding || 0)} icon="⚠️" color="red" wide />
        <StatCard label="Pending Payments"  value={invoices?.pendingVerification || 0} icon="⏳" color="amber" wide />
      </div>

      {/* Recent pending payments */}
      <div className="card">
        <h2 className="text-base font-semibold text-white mb-4">⏳ Pending Verification</h2>
        {invoices?.details?.filter(i => i.status === 'PENDING_VERIFICATION').length === 0 ? (
          <p className="text-slate-500 text-sm">No payments awaiting review.</p>
        ) : (
          <div className="space-y-3">
            {invoices.details.filter(i => i.status === 'PENDING_VERIFICATION').map(inv => (
              <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl bg-amber-900/10 border border-amber-700/30">
                <div>
                  <p className="text-sm font-medium text-white">{inv.tenant?.fullName}</p>
                  <p className="text-xs text-slate-400">Shop {inv.shop?.shopNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-amber-300">{fmt(inv.totalAmount)}</p>
                  <span className="badge-pending">Pending</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invoice status breakdown */}
      <div className="card">
        <h2 className="text-base font-semibold text-white mb-4">Invoice Breakdown</h2>
        <div className="grid grid-cols-3 gap-4">
          <MiniStat label="Paid"     value={invoices?.paid || 0}    color="emerald" />
          <MiniStat label="Unpaid"   value={invoices?.unpaid || 0}  color="red" />
          <MiniStat label="Pending"  value={invoices?.pendingVerification || 0} color="amber" />
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, color = 'brand', wide }) {
  const colors = {
    brand:   'from-brand-900/30 to-brand-800/10 border-brand-700/30 text-brand-300',
    emerald: 'from-emerald-900/30 to-emerald-800/10 border-emerald-700/30 text-emerald-300',
    red:     'from-red-900/30 to-red-800/10 border-red-700/30 text-red-300',
    amber:   'from-amber-900/30 to-amber-800/10 border-amber-700/30 text-amber-300',
    slate:   'from-slate-800/30 to-slate-700/10 border-slate-600/30 text-slate-300',
    orange:  'from-orange-900/30 to-orange-800/10 border-orange-700/30 text-orange-300',
  }
  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-2xl p-4 animate-fade-in`}>
      <p className="text-xl mb-2">{icon}</p>
      <p className={`text-xl font-bold ${colors[color].split(' ').at(-1)}`}>{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{label}</p>
    </div>
  )
}

function MiniStat({ label, value, color }) {
  const cls = { emerald: 'text-emerald-400', red: 'text-red-400', amber: 'text-amber-400' }
  return (
    <div className="text-center p-3 rounded-xl bg-surface/50">
      <p className={`text-3xl font-bold ${cls[color]}`}>{value}</p>
      <p className="text-xs text-slate-400 mt-1">{label}</p>
    </div>
  )
}

function Spin() {
  return <div className="flex items-center justify-center h-64">
    <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
  </div>
}
