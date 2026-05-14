import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import api from '../../lib/api'
import toast from 'react-hot-toast'

export default function TenantPayment({ invoice, onSuccess, onCancel }) {
  const [ftNumber, setFtNumber] = useState('')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)

  const onDrop = useCallback(acceptedFiles => {
    setFile(acceptedFiles[0])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [], 'application/pdf': [] },
    multiple: false
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) return toast.error('Please upload bank slip / እባክዎን የባንክ ደረሰኝ ይስቀሉ')

    setLoading(true)
    const formData = new FormData()
    formData.append('invoiceId', invoice.id)
    formData.append('ftNumber', ftNumber)
    formData.append('slip', file)

    try {
      await api.post('/payments/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      toast.success('Payment submitted for verification / ክፍያ ለማረጋገጫ ቀርቧል')
      onSuccess()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Submission failed / ማስገባት አልተሳካም')
    } finally { setLoading(false) }
  }

  return (
    <div className="card animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Submit Payment / ክፍያ ያስገቡ</h2>
        <button onClick={onCancel} className="text-slate-400 hover:text-white">✕</button>
      </div>

      <div className="bg-surface/50 rounded-xl p-4 mb-6 border border-surface-border">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-slate-400">Invoice Amount / የቢል መጠን</span>
          <span className="text-white font-bold">ETB {Number(invoice.totalAmount).toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Billing Period / የክፍያ ጊዜ</span>
          <span className="text-white">{invoice.billingMonth}/{invoice.billingYear}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="label">Bank Transfer (FT) Number / የባንክ ማስተላለፊያ ቁጥር</label>
          <input
            type="text"
            required
            className="input uppercase font-mono"
            placeholder="FT23XXXXXXXX"
            value={ftNumber}
            onChange={e => setFtNumber(e.target.value)}
          />
          <p className="text-[10px] text-slate-500 mt-1 italic">
            Enter the unique reference number from your bank app/slip / ከባንክ ደረሰኝ ላይ ያለውን ልዩ ቁጥር ያስገቡ
          </p>
        </div>

        <div>
          <label className="label">Upload Bank Slip / የባንክ ደረሰኝ ይስቀሉ</label>
          <div {...getRootProps()} className={`
            border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
            ${isDragActive ? 'border-brand-500 bg-brand-500/5' : 'border-surface-border hover:border-slate-600'}
            ${file ? 'border-emerald-500/50 bg-emerald-500/5' : ''}
          `}>
            <input {...getInputProps()} />
            {file ? (
              <div className="flex items-center justify-center gap-2 text-emerald-400">
                <span>📄</span>
                <span className="text-sm font-medium">{file.name}</span>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-2xl">📸</p>
                <p className="text-sm text-slate-300">
                  {isDragActive ? 'Drop it here / እዚህ ይጣሉት' : 'Click or drag bank slip / ደረሰኙን እዚህ ይጎትቱ ወይም ይጫኑ'}
                </p>
                <p className="text-xs text-slate-500">Supports PNG, JPG, PDF (Max 10MB)</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onCancel} className="btn-secondary flex-1 justify-center">
            Cancel / ሰርዝ
          </button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
            {loading ? '⏳' : 'Submit Payment / ክፍያ ያስገቡ'}
          </button>
        </div>
      </form>
    </div>
  )
}
