import { useEffect, useState } from 'react'
import api from '../../lib/api'
import toast from 'react-hot-toast'

const fmt = (n) => `ETB ${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}`

export default function Reconciliation() {
  const [payments, setPayments]   = useState([])
  const [ledger, setLedger]       = useState([])
  const [selected, setSelected]   = useState(null)
  const [rejectModal, setRejectModal] = useState(null)
  const [reason, setReason]       = useState('')
  const [loading, setLoading]     = useState(true)
  const [acting, setActing]       = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [pr, lr] = await Promise.all([
        api.get('/payments?status=PENDING'),
        api.get('/payments/ledger'),
      ])
      setPayments(pr.data)
      setLedger(lr.data)
    } catch { toast.error('Failed to load / መጫን አልተሳካም') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const getLedgerEntry = (ftNumber) => ledger.find(l => l.ftNumber === ftNumber)

  const approve = async (paymentId) => {
    setActing(true)
    try {
      await api.post(`/payments/${paymentId}/approve`)
      toast.success('Payment approved! / ክፍያው ጸድቋል!')
      setSelected(null)
      await load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Approve failed / ማጽደቅ አልተሳካም')
    } finally { setActing(false) }
  }

  const reject = async () => {
    if (!rejectModal) return
    setActing(true)
    try {
      await api.post(`/payments/${rejectModal.id}/reject`, { reason })
      toast.success('Payment rejected / ክፍያው ውድቅ ተደርጓል')
      setRejectModal(null); setReason('')
      await load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Reject failed / ውድቅ ማድረግ አልተሳካም')
    } finally { setActing(false) }
  }

  if (loading) return <Spin />

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Payment Reconciliation / የክፍያ ማረጋገጫ</h1>
        <p className="text-slate-400 text-sm mt-1">Compare submissions against bank records / ክፍያዎችን ከባንክ መረጃ ጋር ያወዳድሩ</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
            ⏳ Pending / በመጠባበቅ ላይ ({payments.length})
          </h2>
          {payments.length === 0 && (
            <div className="card text-center py-10">
              <p className="text-3xl mb-2">🎉</p>
              <p className="text-slate-400 text-sm">All payments reconciled / ሁሉም ክፍያዎች ተረጋግጠዋል</p>
            </div>
          )}
          {payments.map(p => {
            const matched = getLedgerEntry(p.ftNumber)
            return (
              <div key={p.id}
                onClick={() => setSelected(p)}
                className={`card cursor-pointer transition-all ${selected?.id === p.id ? 'border-brand-500' : 'hover:border-surface-muted'}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-white text-sm">{p.tenant?.fullName}</p>
                    <p className="text-xs text-slate-400">Shop {p.invoice?.shop?.shopNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">{fmt(p.invoice?.totalAmount || 0)}</p>
                    {matched
                      ? <span className="text-xs text-emerald-400">✅ Ledger match / ከባንክ ጋር ይገጥማል</span>
                      : <span className="text-xs text-red-400">⚠️ No match / አይገጥምም</span>}
                  </div>
                </div>
                <p className="text-xs font-mono text-slate-400">FT: {p.ftNumber}</p>
              </div>
            )
          })}
        </div>

        <div className="space-y-4">
          {selected ? (
            <>
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">🔍 Review / ምርመራ</h2>
              <div className="card space-y-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-white">{selected.tenant?.fullName}</p>
                  <span className="badge-pending">Pending / በመጠባበቅ ላይ</span>
                </div>
                <div className="space-y-2 text-sm">
                  <Row label="FT Number / የባንክ ቁጥር"   value={<span className="font-mono text-brand-300">{selected.ftNumber}</span>} />
                  <div className="my-2 border-t border-surface-border" />
                  <Row label="Rent / ኪራይ" value={fmt(selected.invoice?.rentAmount || 0)} />
                  <Row label="Utilities / መገልገያዎች" value={fmt(Number(selected.invoice?.electricCharge || 0) + Number(selected.invoice?.waterCharge || 0))} />
                  <Row label="Arrears / ቀሪ ዕዳ" value={fmt(selected.invoice?.previousBalance || 0)} />
                  <Row label="Late Fees / የቅጣት ክፍያ" value={fmt(selected.invoice?.lateFee || 0)} />
                  <div className="my-2 border-t border-surface-border" />
                  <Row label="Total Amt / ጠቅላላ መጠን" value={<span className="font-bold text-white">{fmt(selected.invoice?.totalAmount || 0)}</span>} />
                </div>

                {selected.slipImageUrl && (
                  <div>
                    <p className="label mb-2">Bank Slip / የባንክ ደረሰኝ</p>
                    <img src={selected.slipImageUrl} alt="Bank slip"
                      className="rounded-xl max-h-52 object-contain border border-surface-border w-full" />
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setRejectModal(selected)} disabled={acting}
                    className="btn-danger flex-1 justify-center">
                    ✕ Reject / ውድቅ አድርግ
                  </button>
                  <button onClick={() => approve(selected.id)} disabled={acting}
                    className="btn-success flex-1 justify-center">
                    {acting ? '⏳' : '✓ Approve / አጽድቅ'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="card text-center py-16 text-slate-500">
              <p className="text-3xl mb-2">👈</p>
              <p className="text-sm">Select to review / ለመመርመር ይምረጡ</p>
            </div>
          )}
        </div>
      </div>

      {rejectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-card border border-surface-border rounded-2xl w-full max-w-md animate-slide-up p-6">
            <h2 className="text-lg font-semibold text-white mb-1">Reject Payment / ክፍያ ውድቅ አድርግ</h2>
            <p className="text-sm text-slate-400 mb-4">FT: {rejectModal.ftNumber}</p>
            <label className="label">Reason / ምክንያት</label>
            <textarea rows={3} className="input resize-none" placeholder="e.g. FT not found / ቁጥሩ አልተገኘም..."
              value={reason} onChange={e => setReason(e.target.value)} />
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setRejectModal(null); setReason('') }} className="btn-secondary flex-1 justify-center">Cancel / ሰርዝ</button>
              <button onClick={reject} disabled={acting} className="btn-danger flex-1 justify-center">
                {acting ? '⏳' : 'Confirm Reject / አረጋግጥ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const Row = ({ label, value }) => (
  <div className="flex items-center justify-between gap-4 text-sm">
    <span className="text-slate-400">{label}</span>
    <span className="text-slate-200 text-right">{value}</span>
  </div>
)

function Spin() { return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div> }
