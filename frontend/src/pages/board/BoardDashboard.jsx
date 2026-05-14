import { useEffect, useState } from 'react'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const fmt = (n) => `ETB ${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
const now = new Date()

const PIE_COLORS = { OCCUPIED: '#6366f1', VACANT: '#475569', MAINTENANCE: '#f97316' }

export default function BoardDashboard() {
  const [summary, setSummary] = useState(null)
  const [month, setMonth]     = useState(now.getMonth() + 1)
  const [year, setYear]       = useState(now.getFullYear())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.get(`/board/summary?month=${month}&year=${year}`)
      .then(r => setSummary(r.data))
      .catch(() => toast.error('Failed to load summary / መጫን አልተሳካም'))
      .finally(() => setLoading(false))
  }, [month, year])

  if (loading) return <Spin />

  const { occupancy, revenue, invoices, trend } = summary || {}

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Executive Summary / የሥራ አመራር መግለጫ</h1>
          <p className="text-slate-400 text-sm mt-1">Read-only Board View / የቦርድ እይታ - {MONTHS[month-1]} {year}</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={month} onChange={e => setMonth(Number(e.target.value))} className="input w-32">
            {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard label="Revenue Collected / የተሰበሰበ ገቢ" value={fmt(revenue?.collected || 0)} color="emerald" icon="💰" />
        <KpiCard label="Outstanding / ያልተከፈለ"        value={fmt(revenue?.outstanding || 0)} color="red" icon="⚠️" />
        <KpiCard label="Occupancy Rate / የሱቆች ይዞታ" value={`${occupancy?.total ? Math.round((occupancy.occupied / occupancy.total) * 100) : 0}%`} color="brand" icon="🏢" />
        <KpiCard label="Invoices Paid / የተከፈሉ ቢሎች" value={`${invoices?.paid || 0}/${invoices?.total || 0}`} color="amber" icon="📋" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-sm font-semibold text-slate-300 mb-4">📈 Revenue Trend / የገቢ ሁኔታ</h2>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={(trend || []).map(t => ({ name: t.label, Revenue: t.revenue }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155' }} />
                <Bar dataKey="Revenue" fill="#6366f1" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h2 className="text-sm font-semibold text-slate-300 mb-4">🏢 Shop Status / የሱቆች ሁኔታ</h2>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={[
                  { name: 'Occupied / የተያዘ', value: occupancy?.occupied || 0 },
                  { name: 'Vacant / ክፍት', value: occupancy?.vacant || 0 },
                  { name: 'Maintenance / ጥገና', value: occupancy?.maintenance || 0 }
                ].filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value">
                  <Cell fill={PIE_COLORS.OCCUPIED} />
                  <Cell fill={PIE_COLORS.VACANT} />
                  <Cell fill={PIE_COLORS.MAINTENANCE} />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

function KpiCard({ label, value, color, icon }) {
  const colors = {
    brand: 'border-brand-500/20 bg-brand-500/5 text-brand-400',
    emerald: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400',
    red: 'border-red-500/20 bg-red-500/5 text-red-400',
    amber: 'border-amber-500/20 bg-amber-500/5 text-amber-400',
  }
  return (
    <div className={`card ${colors[color]} border`}>
      <p className="text-xl mb-1">{icon}</p>
      <p className="text-lg font-bold">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-slate-400">{label}</p>
    </div>
  )
}

function Spin() { return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div> }
