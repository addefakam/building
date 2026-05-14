import { useEffect, useState } from 'react'
import api from '../../lib/api'
import toast from 'react-hot-toast'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const fmt = (n) => `ETB ${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
const now = new Date()

const statusBadge = (s) => ({
  UNPAID:               <span className="badge-unpaid">Unpaid</span>,
  PENDING_VERIFICATION: <span className="badge-pending">Pending</span>,
  PAID:                 <span className="badge-paid">Paid</span>,
  REJECTED:             <span className="badge-rejected">Rejected</span>,
}[s])

export default function BoardInvoices() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading]   = useState(true)
  const [month, setMonth]       = useState('')
  const [year, setYear]         = useState(String(now.getFullYear()))
  const [status, setStatus]     = useState('')

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (month)  params.append('month', month)
    if (year)   params.append('year', year)
    if (status) params.append('status', status)
    api.get(`/invoices?${params.toString()}`)
      .then(r => setInvoices(r.data))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false))
  }, [month, year, status])

  const paid   = invoices.filter(i => i.status === 'PAID')
  const unpaid = invoices.filter(i => i.status !== 'PAID')
  const total  = invoices.reduce((s, i) => s + Number(i.totalAmount), 0)
  const collected = paid.reduce((s, i) => s + Number(i.totalAmount), 0)

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Invoice Records</h1>
        <p className="text-slate-400 text-sm mt-1">Filterable paid/unpaid history</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <select value={month} onChange={e => setMonth(e.target.value)} className="input w-32">
          <option value="">All Months</option>
          {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
        </select>
        <select value={year} onChange={e => setYear(e.target.value)} className="input w-24">
          <option value="">All Years</option>
          {[2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)} className="input w-44">
          <option value="">All Statuses</option>
          <option value="PAID">Paid</option>
          <option value="UNPAID">Unpaid</option>
          <option value="PENDING_VERIFICATION">Pending Verification</option>
        </select>
        <div className="flex-1" />
        <div className="text-sm text-slate-400">
          Showing <span className="text-white font-semibold">{invoices.length}</span> invoices
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center"><p className="text-xs text-slate-400 mb-1">Total Billed</p><p className="text-lg font-bold text-white">{fmt(total)}</p></div>
        <div className="card text-center"><p className="text-xs text-slate-400 mb-1">Collected</p><p className="text-lg font-bold text-emerald-400">{fmt(collected)}</p></div>
        <div className="card text-center"><p className="text-xs text-slate-400 mb-1">Outstanding</p><p className="text-lg font-bold text-red-400">{fmt(total - collected)}</p></div>
      </div>

      {/* Table */}
      {loading ? <Spin /> : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full">
            <thead className="border-b border-surface-border">
              <tr>
                {['Period','Tenant','Shop','Rent','Electric','Water','Total','Status','Due Date'].map(h => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id} className="table-row">
                  <td className="table-cell font-medium">{MONTHS[(inv.billingMonth||1)-1]} {inv.billingYear}</td>
                  <td className="table-cell text-white">{inv.tenant?.fullName}</td>
                  <td className="table-cell">{inv.shop?.shopNumber}</td>
                  <td className="table-cell">{fmt(inv.rentAmount)}</td>
                  <td className="table-cell">{fmt(inv.electricCharge)}</td>
                  <td className="table-cell">{fmt(inv.waterCharge)}</td>
                  <td className="table-cell font-semibold text-white">{fmt(inv.totalAmount)}</td>
                  <td className="table-cell">{statusBadge(inv.status)}</td>
                  <td className="table-cell">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {invoices.length === 0 && <p className="text-center text-slate-500 py-8 text-sm">No invoices match the filter.</p>}
        </div>
      )}
    </div>
  )
}

function Spin() {
  return <div className="flex items-center justify-center h-64">
    <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
  </div>
}
