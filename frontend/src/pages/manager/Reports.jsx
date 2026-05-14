import { useState, useEffect, useMemo } from 'react'
import api from '../../lib/api'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function Reports() {
  const [unpaidBills, setUnpaidBills] = useState([])
  const [outdatedAgreements, setOutdatedAgreements] = useState([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [billShopFilter, setBillShopFilter] = useState('')
  const [billCategoryFilter, setBillCategoryFilter] = useState('All')

  // Modals
  const [selectedBill, setSelectedBill] = useState(null)

  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = async () => {
    setLoading(true)
    try {
      const [billsRes, agreementsRes] = await Promise.all([
        api.get('/reports/unpaid'),
        api.get('/reports/outdated-agreements')
      ])
      setUnpaidBills(billsRes.data)
      setOutdatedAgreements(agreementsRes.data)
    } catch (err) {
      toast.error('Failed to load reports')
    } finally {
      setLoading(false)
    }
  }

  const filteredBills = useMemo(() => {
    return unpaidBills.filter(b => {
      const shopMatch = b.shop?.shopNumber?.toLowerCase().includes(billShopFilter.toLowerCase())
      const catMatch = billCategoryFilter === 'All' || b.agingCategory === billCategoryFilter
      return shopMatch && catMatch
    })
  }, [unpaidBills, billShopFilter, billCategoryFilter])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl relative">
      <div>
        <h1 className="text-2xl font-bold text-white">System Reports</h1>
        <p className="text-slate-400 text-sm mt-1">Overview of outstanding bills and outdated agreements.</p>
      </div>

      {/* Unpaid Bills Section */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-white">Unpaid Bills</h2>
            <span className="badge-unpaid">{filteredBills.length} Found</span>
          </div>
          
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Filter by Shop..." 
              className="input w-40 text-sm"
              value={billShopFilter}
              onChange={e => setBillShopFilter(e.target.value)}
            />
            <select 
              className="input w-40 text-sm"
              value={billCategoryFilter}
              onChange={e => setBillCategoryFilter(e.target.value)}
            >
              <option value="All">All Categories</option>
              <option value="Current">Current</option>
              <option value="1-30 Days Late">1-30 Days Late</option>
              <option value="31-60 Days Late">31-60 Days Late</option>
              <option value="60+ Days Late">60+ Days Late</option>
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="table-header">Shop</th>
                <th className="table-header">Tenant</th>
                <th className="table-header">Due Date</th>
                <th className="table-header">Days Late</th>
                <th className="table-header">Category</th>
                <th className="table-header">Late Fee</th>
                <th className="table-header">Total Amount</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.length > 0 ? filteredBills.map(bill => (
                <tr key={bill.id} className="table-row">
                  <td className="table-cell font-medium">{bill.shop?.shopNumber}</td>
                  <td className="table-cell">{bill.tenant?.fullName}</td>
                  <td className="table-cell">{format(new Date(bill.dueDate), 'MMM d, yyyy')}</td>
                  <td className="table-cell text-amber-400">{bill.daysLate}</td>
                  <td className="table-cell">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-surface-border/50 text-slate-300">
                      {bill.agingCategory}
                    </span>
                  </td>
                  <td className="table-cell">ETB {Number(bill.currentLateFee).toFixed(2)}</td>
                  <td className="table-cell font-bold text-white">ETB {Number(bill.totalAmount).toFixed(2)}</td>
                  <td className="table-cell">
                    <button 
                      onClick={() => setSelectedBill(bill)}
                      className="text-brand-400 hover:text-brand-300 text-xs font-medium px-3 py-1.5 bg-brand-500/10 rounded transition-colors"
                    >
                      Detail
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="8" className="text-center py-6 text-slate-400">No unpaid bills found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Outdated Agreements Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Outdated Agreements</h2>
          <span className="badge-pending">{outdatedAgreements.length} Total</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="table-header">Shop</th>
                <th className="table-header">Tenant</th>
                <th className="table-header">Lease Start</th>
                <th className="table-header">Lease End</th>
                <th className="table-header">Status</th>
              </tr>
            </thead>
            <tbody>
              {outdatedAgreements.length > 0 ? outdatedAgreements.map(agreement => (
                <tr key={agreement.id} className="table-row">
                  <td className="table-cell font-medium">{agreement.shop?.shopNumber}</td>
                  <td className="table-cell">
                    <div>
                      <p className="font-medium text-white">{agreement.fullName}</p>
                      <p className="text-xs text-slate-400">{agreement.phone}</p>
                    </div>
                  </td>
                  <td className="table-cell">{format(new Date(agreement.leaseStart), 'MMM d, yyyy')}</td>
                  <td className="table-cell text-amber-400 font-medium">{format(new Date(agreement.leaseEnd), 'MMM d, yyyy')}</td>
                  <td className="table-cell">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      agreement.status === 'Expired' 
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {agreement.status}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="text-center py-6 text-slate-400">No outdated agreements found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Bill Modal */}
      {selectedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-card border border-surface-border rounded-2xl w-full max-w-md p-6 shadow-2xl animate-slide-up">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Bill Details</h3>
                <p className="text-sm text-slate-400">Shop {selectedBill.shop?.shopNumber} - {selectedBill.tenant?.fullName}</p>
              </div>
              <button 
                onClick={() => setSelectedBill(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 mt-6">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Rent Amount</span>
                <span className="text-white">ETB {Number(selectedBill.rentAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Electric Charge</span>
                <span className="text-white">ETB {Number(selectedBill.electricCharge).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Water Charge</span>
                <span className="text-white">ETB {Number(selectedBill.waterCharge).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Arrears / Previous Balance</span>
                <span className="text-white">ETB {Number(selectedBill.previousBalance || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Accumulated Late Fees</span>
                <span className="text-amber-400">ETB {Number(selectedBill.currentLateFee).toFixed(2)}</span>
              </div>
              
              <div className="border-t border-surface-border my-2 pt-2 flex justify-between font-bold">
                <span className="text-white">Total Amount</span>
                <span className="text-brand-400">ETB {(Number(selectedBill.totalAmount) + Number(selectedBill.currentLateFee)).toFixed(2)}</span>
              </div>
            </div>

            <button 
              onClick={() => setSelectedBill(null)}
              className="mt-6 w-full btn-secondary justify-center py-2"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
