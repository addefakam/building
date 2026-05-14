import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const statusBadge = (s) => {
  if (s === 'UNPAID')               return <span className="badge-unpaid">Unpaid</span>
  if (s === 'PENDING_VERIFICATION') return <span className="badge-pending">Pending Review</span>
  if (s === 'PAID')                 return <span className="badge-paid">Paid</span>
  if (s === 'REJECTED')             return <span className="badge-rejected">Rejected</span>
  return null
}

export default function TenantBills() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading]   = useState(true)
  const [tenant, setTenant]     = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const meRes = await api.get('/auth/me')
        setTenant(meRes.data.tenant)
        if (meRes.data.tenant) {
          const invRes = await api.get(`/tenants/${meRes.data.tenant.id}/invoices`)
          setInvoices(invRes.data)
        }
      } catch (e) {
        toast.error('Failed to load invoices')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <Loading />

  const latestInvoice = invoices[0]

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">My Bills</h1>
        <p className="text-slate-400 text-sm mt-1">
          {tenant ? `Shop ${tenant.shop?.shopNumber} — Floor ${tenant.shop?.floor}` : ''}
        </p>
      </div>

      {/* Current bill highlight */}
      {latestInvoice && (
        <div className="card border-brand-500/30 bg-gradient-to-br from-brand-900/20 to-surface-card relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-brand-600/5 rounded-full -translate-y-20 translate-x-20" />
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wide">Current Bill</p>
              <p className="text-3xl font-bold text-white mt-1">
                ETB {Number(latestInvoice.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-slate-400 text-sm mt-1">
                Due {format(new Date(latestInvoice.dueDate), 'MMM d, yyyy')}
              </p>
            </div>
            <div className="text-right">
              {statusBadge(latestInvoice.status)}
              <p className="text-slate-500 text-xs mt-2">
                {getMonthName(latestInvoice.billingMonth)} {latestInvoice.billingYear}
              </p>
            </div>
          </div>

          {/* Itemized breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <BillItem label="Rent" amount={latestInvoice.rentAmount} icon="🏪" />
            <BillItem label="Electricity" amount={latestInvoice.electricCharge} icon="⚡" />
            <BillItem label="Water" amount={latestInvoice.waterCharge} icon="💧" />
            <BillItem label="Previous Balance" amount={latestInvoice.previousBalance || 0} icon="🕒" />
          </div>

          {/* Utility details */}
          {latestInvoice.utilityReading && (
            <div className="mt-4 pt-4 border-t border-surface-border/50 grid grid-cols-2 gap-4 text-xs text-slate-500">
              <div>
                <span className="text-slate-400">⚡ Electric: </span>
                {Number(latestInvoice.utilityReading.electricPrev)} → {Number(latestInvoice.utilityReading.electricCurr)} kWh
                × ETB {Number(latestInvoice.utilityReading.electricRate)}
              </div>
              <div>
                <span className="text-slate-400">💧 Water: </span>
                {Number(latestInvoice.utilityReading.waterPrev)} → {Number(latestInvoice.utilityReading.waterCurr)} m³
                × ETB {Number(latestInvoice.utilityReading.waterRate)}
              </div>
            </div>
          )}

          {latestInvoice.status === 'UNPAID' && (
            <div className="mt-4">
               {latestInvoice.currentLateFee > 0 && (
                 <p className="text-amber-400 text-xs mb-2">
                   ⚠️ Includes ETB {Number(latestInvoice.currentLateFee).toLocaleString('en-US', { minimumFractionDigits: 2 })} late fee penalty.
                 </p>
               )}
              <button onClick={() => navigate('/tenant/payment', { state: { invoice: latestInvoice } })}
                className="btn-primary w-full justify-center py-3">
                💳 Submit Payment
              </button>
            </div>
          )}
          {latestInvoice.status === 'PENDING_VERIFICATION' && (
            <div className="mt-5 p-3 rounded-xl bg-amber-900/20 border border-amber-700/30 text-amber-300 text-sm flex items-center gap-2">
              <span className="animate-pulse-dot">⏳</span> Payment submitted — awaiting manager verification
            </div>
          )}
          {latestInvoice.status === 'PAID' && (
            <div className="mt-5 p-3 rounded-xl bg-emerald-900/20 border border-emerald-700/30 text-emerald-300 text-sm flex items-center gap-2">
              ✅ Payment verified and confirmed
            </div>
          )}
        </div>
      )}

      {/* Invoice history */}
      {invoices.length > 1 && (
        <div className="card">
          <h2 className="text-base font-semibold text-white mb-4">Invoice History</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-border">
                  <th className="table-header">Period</th>
                  <th className="table-header">Rent</th>
                  <th className="table-header">Utilities</th>
                  <th className="table-header">Arrears</th>
                  <th className="table-header">Total</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.slice(1).map(inv => (
                  <tr key={inv.id} className="table-row">
                    <td className="table-cell font-medium">{getMonthName(inv.billingMonth)} {inv.billingYear}</td>
                    <td className="table-cell">{fmt(inv.rentAmount)}</td>
                    <td className="table-cell">{fmt(Number(inv.electricCharge) + Number(inv.waterCharge))}</td>
                    <td className="table-cell">{fmt(inv.previousBalance || 0)}</td>
                    <td className="table-cell font-semibold text-white">{fmt(inv.totalAmount)}</td>
                    <td className="table-cell">{statusBadge(inv.status)}</td>
                    <td className="table-cell">
                      <button onClick={() => {
                         alert(`Detailed Invoice:\nRent: ${fmt(inv.rentAmount)}\nElectric: ${fmt(inv.electricCharge)}\nWater: ${fmt(inv.waterCharge)}\nArrears: ${fmt(inv.previousBalance || 0)}\nTotal: ${fmt(inv.totalAmount)}`);
                      }} className="text-brand-400 hover:text-brand-300 text-xs font-medium px-2 py-1 bg-brand-500/10 rounded">
                         Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {invoices.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-slate-400">No invoices yet</p>
        </div>
      )}
    </div>
  )
}

function BillItem({ label, amount, icon }) {
  return (
    <div className="bg-surface/50 rounded-xl p-3 text-center">
      <p className="text-xl mb-1">{icon}</p>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-semibold text-white mt-0.5">{fmt(amount)}</p>
    </div>
  )
}

const fmt = (n) => `ETB ${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
const getMonthName = (m) => ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m - 1] || m

function Loading() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
